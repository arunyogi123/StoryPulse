"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "../../lib/auth-context";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Users,
  LogOut,
  ExternalLink,
  PlusCircle,
  Menu,
  X,
  ShieldAlert,
  Sparkles,
  BookOpen,
} from "lucide-react";

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isStaff, isAuthenticated, isLoading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  // Redirect to /admin/login when unauthenticated and not loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // If on login page, render children directly without admin chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state: preserve valid staff sessions without premature redirects
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="font-bold text-stone-900 text-sm">
              Loading SimpleNews Admin...
            </p>
            <p className="text-xs text-stone-500">
              Verifying editorial credentials
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated: render placeholder while useEffect performs redirect
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white rounded-2xl border border-stone-200 max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-stone-900 mb-1">
            Authentication Required
          </h2>
          <p className="text-xs text-stone-600 mb-4">
            Redirecting to staff login...
          </p>
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Authenticated but NOT staff -> Access Denied Screen
  if (!isStaff) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200/80 p-8 shadow-md text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 font-news mb-2">
            Staff Permissions Required
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed mb-6">
            You are signed in as{" "}
            <strong className="text-stone-900">{user?.username}</strong>, but
            this account does not possess editorial or staff permissions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              Return to Public Portal
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/admin/login");
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition-colors cursor-pointer"
            >
              Sign in with Different Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navLinks = [
    {
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: "Articles",
      href: "/admin/articles",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      label: "New Article",
      href: "/admin/articles/new",
      icon: <PlusCircle className="w-4 h-4" />,
    },
    {
      label: "Categories",
      href: "/admin/categories",
      icon: <FolderTree className="w-4 h-4" />,
    },
    {
      label: "Users (Read-Only)",
      href: "/admin/users",
      icon: <Users className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100/70 flex flex-col md:flex-row text-stone-800">
      {/* ─────────────────────────────────────────────────────────────
          DESKTOP SIDEBAR
          ───────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-news font-bold text-base text-stone-900 block leading-tight">
                SimpleNews
              </span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                Admin Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 flex-1">
          <div className="px-3 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Editorial Desk
          </div>
          {navLinks.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" &&
                pathname.startsWith(item.href) &&
                item.href !== "/admin/articles/new");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-stone-900 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-4 px-3 py-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Public Gateway
          </div>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-stone-600 hover:text-amber-800 hover:bg-amber-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span>Public News Portal</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
          </Link>
        </nav>

        {/* Current User Profile Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(user?.username || "A").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">
                  {user?.username}
                </p>
                <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Staff Editor
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                logout();
                router.push("/admin/login");
              }}
              title="Sign Out"
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE TOPBAR & DRAWER
          ───────────────────────────────────────────────────────────── */}
      <div className="md:hidden bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-news font-bold text-base text-stone-900">
            SimpleNews{" "}
            <span className="text-xs font-sans text-amber-700">Admin</span>
          </span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 py-3 space-y-1 z-30 shadow-lg">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                pathname === item.href
                  ? "bg-stone-900 text-white"
                  : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
          <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              {user?.username} (Staff)
            </span>
            <button
              onClick={() => {
                logout();
                router.push("/admin/login");
              }}
              className="text-xs text-rose-600 font-bold"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA
          ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
