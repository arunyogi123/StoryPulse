"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authApi, tokenStorage, CurrentUser, ApiError } from "./api";

interface AuthContextType {
  user: CurrentUser | null;
  isStaff: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
  ) => Promise<{ success: boolean; isStaff: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<CurrentUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      const token = tokenStorage.getAccessToken();
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.getMe();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (err) {
        // If profile fetch fails even after token refresh attempt, clear tokens
        tokenStorage.clearTokens();
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string,
    ): Promise<{ success: boolean; isStaff: boolean; error?: string }> => {
      try {
        // Step 1: Obtain JWT tokens
        const tokens = await authApi.login(username, password);
        tokenStorage.setTokens(tokens.access, tokens.refresh);

        // Step 2: Verify user profile and staff privileges
        const profile = await authApi.getMe();
        setUser(profile);

        if (!profile.is_staff) {
          // If the user authenticated successfully but is not staff, do not retain admin session
          tokenStorage.clearTokens();
          setUser(null);
          return {
            success: false,
            isStaff: false,
            error:
              "Access denied. Your account does not have staff permissions.",
          };
        }

        return {
          success: true,
          isStaff: true,
        };
      } catch (err) {
        tokenStorage.clearTokens();
        setUser(null);
        let message = "Invalid username or password.";
        if (err instanceof ApiError) {
          message = err.message;
        }
        return {
          success: false,
          isStaff: false,
          error: message,
        };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    tokenStorage.clearTokens();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<CurrentUser | null> => {
    try {
      const profile = await authApi.getMe();
      setUser(profile);
      return profile;
    } catch {
      logout();
      return null;
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    isStaff: Boolean(user?.is_staff),
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
