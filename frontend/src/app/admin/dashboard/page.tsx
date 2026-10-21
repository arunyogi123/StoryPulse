"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";
import {
  dashboardApi,
  newsApi,
  DashboardStats,
  ApiArticle,
  ApiError,
} from "../../../lib/api";
import {
  Newspaper,
  CheckCircle2,
  Clock,
  Sparkles,
  FolderTree,
  Users,
  PlusCircle,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Edit3,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentArticles, setRecentArticles] = useState<ApiArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, articlesData] = await Promise.all([
        dashboardApi.getStats(),
        newsApi.getArticles(),
      ]);
      setStats(statsData);
      setRecentArticles(articlesData.slice(0, 5));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          "Failed to load dashboard data. Please check your connection.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
            <span>Editorial Intelligence</span>
            <span>•</span>
            <span>{todayFormatted}</span>
          </div>
          <h1 className="font-news text-2xl sm:text-3xl font-bold text-stone-900">
            Welcome back, {user?.first_name || user?.username}
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time overview of editorial publications, drafts, categories,
            and reader engagement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh statistics"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? "animate-spin text-amber-600" : ""}`}
            />
          </button>
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Write New Story</span>
          </Link>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadDashboardData}
            className="px-3 py-1 bg-rose-200/80 hover:bg-rose-200 rounded-lg font-bold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          REAL STATISTICS CARDS (from GET /api/dashboard/stats/)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Articles */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center mb-2.5">
            <Newspaper className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-stone-500 block">
            Total Articles
          </span>
          <span className="font-news text-2xl font-bold text-stone-900">
            {loading ? "..." : (stats?.total_articles ?? 0)}
          </span>
        </div>

        {/* Published Articles */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-stone-500 block">
            Published
          </span>
          <span className="font-news text-2xl font-bold text-emerald-700">
            {loading ? "..." : (stats?.published_articles ?? 0)}
          </span>
        </div>

        {/* Draft Articles */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-stone-500 block">
            Draft Stories
          </span>
          <span className="font-news text-2xl font-bold text-amber-700">
            {loading ? "..." : (stats?.draft_articles ?? 0)}
          </span>
        </div>

        {/* Featured Stories */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center mb-2.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-stone-500 block">
            Featured
          </span>
          <span className="font-news text-2xl font-bold text-sky-700">
            {loading ? "..." : (stats?.featured_articles ?? 0)}
          </span>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center mb-2.5">
            <FolderTree className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-stone-500 block">
            Categories
          </span>
          <span className="font-news text-2xl font-bold text-indigo-700">
            {loading ? "..." : (stats?.total_categories ?? 0)}
          </span>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center mb-2.5">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-stone-500 block">
            Total Users
          </span>
          <span className="font-news text-2xl font-bold text-stone-900">
            {loading ? "..." : (stats?.total_users ?? 0)}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          QUICK ACTIONS STRIP
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/articles/new"
          className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 hover:border-amber-300 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 group-hover:text-amber-800 transition-colors">
                Publish a Story
              </h4>
              <p className="text-xs text-stone-500">
                Draft or publish a news article
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-amber-700 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/categories"
          className="p-4 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-300 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center font-bold">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 group-hover:text-stone-700 transition-colors">
                Manage Categories
              </h4>
              <p className="text-xs text-stone-500">
                Organize topics and taxonomy
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
        </Link>

        <Link
          href="/admin/users"
          className="p-4 rounded-2xl bg-white border border-stone-200/90 hover:border-stone-300 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900 group-hover:text-stone-700 transition-colors">
                Review Accounts
              </h4>
              <p className="text-xs text-stone-500">
                Read-only view of registered readers
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RECENT ARTICLES TABLE
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-news text-lg font-bold text-stone-900">
              Recent Editorial Publications
            </h3>
            <p className="text-xs text-stone-500">
              Latest news stories managed on the portal
            </p>
          </div>
          <Link
            href="/admin/articles"
            className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-1"
          >
            <span>View All Articles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-stone-400">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading editorial stories...
          </div>
        ) : recentArticles.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400">
            No articles found in the database. Click &ldquo;Write New
            Story&rdquo; to publish your first article.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-100">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {recentArticles.map((article) => (
                  <tr
                    key={article.id}
                    className="hover:bg-stone-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-stone-900 max-w-xs truncate">
                      {article.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700">
                        {article.category_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {article.is_published ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                          <Clock className="w-3 h-3" />
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-stone-500">
                      {article.author_username}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/articles/${encodeURIComponent(article.slug)}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
