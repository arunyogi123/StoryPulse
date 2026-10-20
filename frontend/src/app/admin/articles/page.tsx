"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  newsApi,
  categoriesApi,
  ApiArticle,
  ApiCategory,
  ApiError,
} from "../../../lib/api";
import {
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit3,
  Trash2,
  RefreshCw,
  AlertCircle,
  Filter,
  Eye,
  X,
  AlertTriangle,
} from "lucide-react";

export default function AdminArticlesListPage() {
  const [articles, setArticles] = useState<ApiArticle[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Deletion modal state
  const [articleToDelete, setArticleToDelete] = useState<ApiArticle | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchArticlesAndCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const [articlesData, categoriesData] = await Promise.all([
        newsApi.getArticles(),
        categoriesApi.getCategories(),
      ]);
      setArticles(articlesData);
      setCategories(categoriesData);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to load articles.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticlesAndCategories();
  }, []);

  // Quick toggle publication status
  const handleTogglePublish = async (article: ApiArticle) => {
    try {
      setActionError(null);
      const updated = await newsApi.updateArticle(article.slug, {
        is_published: !article.is_published,
      });
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? updated : a)),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(`Failed to update status: ${err.message}`);
      } else {
        setActionError("Failed to update status.");
      }
    }
  };

  // Quick toggle featured status
  const handleToggleFeatured = async (article: ApiArticle) => {
    try {
      setActionError(null);
      const updated = await newsApi.updateArticle(article.slug, {
        is_featured: !article.is_featured,
      });
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? updated : a)),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(`Failed to update featured flag: ${err.message}`);
      } else {
        setActionError("Failed to update featured flag.");
      }
    }
  };

  // Handle article deletion
  const confirmDelete = async () => {
    if (!articleToDelete) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await newsApi.deleteArticle(articleToDelete.slug);
      setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
      setArticleToDelete(null);
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(`Failed to delete story: ${err.message}`);
      } else {
        setActionError("Failed to delete story.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered list
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Status filter
      if (statusFilter === "published" && !article.is_published) return false;
      if (statusFilter === "draft" && article.is_published) return false;

      // Category filter
      if (
        selectedCategory !== "all" &&
        String(article.category) !== selectedCategory &&
        article.category_name !== selectedCategory
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = article.title.toLowerCase().includes(q);
        const matchesSummary = (article.summary || "")
          .toLowerCase()
          .includes(q);
        const matchesAuthor = (article.author_username || "")
          .toLowerCase()
          .includes(q);
        return matchesTitle || matchesSummary || matchesAuthor;
      }

      return true;
    });
  }, [articles, statusFilter, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <h1 className="font-news text-2xl sm:text-3xl font-bold text-stone-900">
            Articles Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Browse, search, edit, publish, or remove editorial articles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchArticlesAndCategories}
            disabled={loading}
            className="p-2.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:text-stone-900 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh articles"
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
            <span>New Article</span>
          </Link>
        </div>
      </div>

      {/* Global Alerts */}
      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="p-1 text-rose-600 hover:text-rose-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchArticlesAndCategories}
            className="px-3 py-1 bg-rose-200/80 hover:bg-rose-200 rounded-lg font-bold transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FILTERS & SEARCH
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title, summary, or author..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter tabs */}
          <div className="flex items-center p-0.5 rounded-xl bg-stone-100 border border-stone-200/80 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "all"
                  ? "bg-white text-stone-900 shadow-2xs font-bold"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              All ({articles.length})
            </button>
            <button
              onClick={() => setStatusFilter("published")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "published"
                  ? "bg-white text-emerald-800 shadow-2xs font-bold"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Published
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "draft"
                  ? "bg-white text-amber-800 shadow-2xs font-bold"
                  : "text-stone-500 hover:text-stone-900"
              }`}
            >
              Drafts
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 pl-3 pr-8 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ARTICLES DATA TABLE
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-stone-400">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading articles...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-900 mb-1">
              No articles found
            </h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
              {searchQuery ||
              statusFilter !== "all" ||
              selectedCategory !== "all"
                ? "Try clearing your filters or search terms."
                : "No articles currently exist. Create your first news article."}
            </p>
            {(searchQuery ||
              statusFilter !== "all" ||
              selectedCategory !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setSelectedCategory("all");
                }}
                className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 font-bold uppercase tracking-wider text-[10px] border-b border-stone-100">
                <tr>
                  <th className="py-3 px-4">Story Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Featured</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredArticles.map((article) => (
                  <tr
                    key={article.id}
                    className="hover:bg-stone-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="font-bold text-stone-900 line-clamp-1">
                        {article.title}
                      </div>
                      <div className="text-[11px] text-stone-400 font-mono line-clamp-1 mt-0.5">
                        /{article.slug}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-200/60">
                        {article.category_name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                      {article.author_username}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(article)}
                        title="Click to toggle publication status"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          article.is_published
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200"
                        }`}
                      >
                        {article.is_published ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleFeatured(article)}
                        title="Click to toggle featured hero status"
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          article.is_featured
                            ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                            : "bg-stone-50 text-stone-400 border border-stone-200 hover:text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        <Sparkles
                          className={`w-3.5 h-3.5 ${article.is_featured ? "text-amber-700" : ""}`}
                        />
                        <span>
                          {article.is_featured ? "Featured" : "Standard"}
                        </span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-stone-500">
                      {new Date(article.created_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/articles/${encodeURIComponent(article.slug)}/edit`}
                          className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          title="Edit story"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setArticleToDelete(article)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete story"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DELETE CONFIRMATION MODAL
          ───────────────────────────────────────────────────────────── */}
      {articleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-6 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-news text-xl font-bold text-stone-900 text-center mb-1">
              Delete Article?
            </h3>
            <p className="text-xs text-stone-600 text-center mb-4 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-stone-900">
                &ldquo;{articleToDelete.title}&rdquo;
              </strong>
              ? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setArticleToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting && (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Delete Story</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
