"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";
import {
  Sparkles,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  Building2,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isStaff } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in as staff, forward straight to dashboard
  useEffect(() => {
    if (isAuthenticated && isStaff) {
      router.push("/admin/dashboard");
    }
  }, [isAuthenticated, isStaff, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await login(username.trim(), password);
      if (result.success && result.isStaff) {
        router.push("/admin/dashboard");
      } else {
        setErrorMessage(
          result.error || "Login failed. Please verify your credentials.",
        );
      }
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top back navigation */}
      <div className="max-w-md w-full mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to SimpleNews Portal</span>
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden p-6 sm:p-8">
          {/* Header Brand Crest */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase tracking-wider mb-2">
              <Building2 className="w-3 h-3 text-amber-800" />
              Editorial System
            </div>
            <h1 className="font-news text-2xl sm:text-3xl font-bold text-stone-900 leading-tight">
              Staff Portal Login
            </h1>
            <p className="text-xs text-stone-500 mt-1.5 max-w-xs mx-auto">
              Sign in with your authorized staff credentials to manage stories,
              categories, and editorial metrics.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. arunyogi"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Editorial Desk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-5 border-t border-stone-100 text-center text-[11px] text-stone-500">
            Administrative access is monitored and restricted to verified staff
            users.
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center text-xs text-stone-400 max-w-md w-full mx-auto">
        SimpleNews Media Group • Daily Editorial Edition
      </div>
    </div>
  );
}
