"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  newsApi,
  categoriesApi,
  ApiArticle,
  ApiCategory,
  ArticleInput,
  ApiError,
} from "@/src/lib/api";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  AlertCircle,
  Trash2,
  AlertTriangle,
  User,
  Calendar,
} from "lucide-react";

export default function EditArticleClient() {
  const router = useRouter();
  const params = useParams();
  const slugParam =
    typeof params?.slug === "string" ? decodeURIComponent(params.slug) : "";

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Original article state
  const [originalArticle, setOriginalArticle] = useState<ApiArticle | null>(
    null,
  );

  // Form Fields
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");

  // Image Selection State (URL vs Upload)
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [imageFileError, setImageFileError] = useState<string | null>(null);

  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  // Deletion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadArticleAndCategories() {
      if (!slugParam) return;
      setLoading(true);
      setErrorMessage(null);
      try {
        const [articleData, categoriesData] = await Promise.all([
          newsApi.getManageArticle(slugParam),
          categoriesApi.getCategories(),
        ]);
        setOriginalArticle(articleData);
        setCategories(categoriesData);

        // Pre-fill form
        setTitle(articleData.title);
        setSlug(articleData.slug);
        setCategoryId(articleData.category);
        setImageUrl(articleData.image || "");
        setSummary(articleData.summary);
        setContent(articleData.content);
        setIsPublished(articleData.is_published);
        setIsFeatured(articleData.is_featured);
      } catch (err) {
        if (err instanceof ApiError) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage("Failed to load article from the server.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadArticleAndCategories();
  }, [slugParam]);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (uploadedPreview) {
        URL.revokeObjectURL(uploadedPreview);
      }
    };
  }, [uploadedPreview]);

  // Handle local image file selection with client validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type: JPEG, PNG, WebP
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const validExts = [".jpg", ".jpeg", ".png", ".webp"];

    if (!validTypes.includes(file.type) && !validExts.includes(ext)) {
      setImageFileError(
        "Invalid image format. Allowed formats: JPEG, PNG, WebP.",
      );
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageFileError(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum limit of 5MB.`,
      );
      return;
    }

    setImageFile(file);
    if (uploadedPreview) {
      URL.revokeObjectURL(uploadedPreview);
    }
    setUploadedPreview(URL.createObjectURL(file));
  };

  const clearSelectedFile = () => {
    setImageFile(null);
    if (uploadedPreview) {
      URL.revokeObjectURL(uploadedPreview);
      setUploadedPreview(null);
    }
    setImageFileError(null);
    const fileInput = document.getElementById(
      "editArticleImageFileInput",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter an article title.");
      return;
    }
    if (!categoryId) {
      setErrorMessage("Please select a valid category.");
      return;
    }
    if (!summary.trim()) {
      setErrorMessage("Please provide a summary for the article.");
      return;
    }
    if (!content.trim()) {
      setErrorMessage("Please provide the full story content.");
      return;
    }

    // Validate online URL if URL mode is chosen and entered
    if (imageMode === "url" && imageUrl.trim()) {
      try {
        const parsed = new URL(imageUrl.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
          setErrorMessage(
            "Online image URL must start with http:// or https://",
          );
          return;
        }
      } catch {
        setErrorMessage("Please enter a valid, well-formed image URL.");
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage(null);

    const hasNewImageFile = imageMode === "upload" && Boolean(imageFile);
    const hasImageUrl = imageMode === "url" && Boolean(imageUrl.trim());

    const payload: Partial<ArticleInput> = {
      title: title.trim(),
      slug: slug.trim() ? slug.trim() : undefined,
      category: Number(categoryId),
      summary: summary.trim(),
      content: content.trim(),
      image: hasImageUrl ? imageUrl.trim() : hasNewImageFile ? undefined : "",
      image_file: hasNewImageFile ? imageFile! : undefined,
      is_published: isPublished,
      is_featured: isFeatured,
    };

    try {
      await newsApi.updateArticle(slugParam, payload);
      router.push("/admin/articles");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to update article.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await newsApi.deleteArticle(slugParam);
      router.push("/admin/articles");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(`Delete failed: ${err.message}`);
      } else {
        setErrorMessage("Delete failed.");
      }
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 150));

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-xs text-stone-400">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading article details...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER & BREADCRUMBS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Articles</span>
          </Link>
          <h1 className="font-news text-2xl sm:text-3xl font-bold text-stone-900">
            Edit Article
          </h1>
          <div className="flex items-center gap-3 text-xs text-stone-400 mt-1">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Author: {originalArticle?.author_username}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Created:{" "}
              {originalArticle?.created_at
                ? new Date(originalArticle.created_at).toLocaleDateString()
                : ""}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="p-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
            title="Delete this article"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FORM
          ───────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-8 shadow-2xs space-y-6">
          {/* Article Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5"
            >
              Story Headline *
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 font-news text-lg font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600"
            />
          </div>

          {/* Slug */}
          <div>
            <label
              htmlFor="slug"
              className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5"
            >
              URL Slug
            </label>
            <div className="flex items-center rounded-xl bg-stone-50 border border-stone-200 overflow-hidden">
              <span className="px-3.5 text-xs text-stone-400 font-mono select-none bg-stone-100/80 border-r border-stone-200 py-2.5">
                /api/news/
              </span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-transparent font-mono text-xs text-stone-900 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Modifying the slug changes the public URL path for this article.
            </p>
          </div>

          {/* Category Selection */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="category"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wide"
              >
                Category *
              </label>
              <Link
                href="/admin/categories"
                className="text-[11px] text-amber-700 hover:underline"
              >
                Manage Categories
              </Link>
            </div>
            <select
              id="category"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              disabled={categories.length === 0}
              className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 cursor-pointer disabled:opacity-50"
            >
              {categories.length === 0 ? (
                <option value="">No categories found</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              ARTICLE IMAGE SELECTION (ONLINE URL vs UPLOAD)
              ───────────────────────────────────────────────────────────── */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wide">
                Article Featured Image (Optional)
              </label>
              <span className="text-[11px] text-stone-400">
                Choose URL or upload from device
              </span>
            </div>

            {/* Mode Selector Tabs */}
            <div className="inline-flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200/80 gap-1">
              <button
                type="button"
                onClick={() => {
                  setImageMode("url");
                  setImageFileError(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  imageMode === "url"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                Online Image URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageMode("upload");
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  imageMode === "upload"
                    ? "bg-white text-stone-900 shadow-2xs"
                    : "text-stone-500 hover:text-stone-900"
                }`}
              >
                Upload Image File
              </button>
            </div>

            {/* Tab 1: Online Image URL */}
            {imageMode === "url" && (
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <p className="text-[11px] text-stone-400">
                  Enter a valid publicly accessible image link (starting with
                  http:// or https://).
                </p>

                {/* Online URL Preview */}
                {imageUrl.trim() && (
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-20 h-14 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-200">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                      <div className="text-xs text-stone-600 truncate flex-1 min-w-0">
                        <span className="font-semibold block text-stone-900">
                          Image Source Preview
                        </span>
                        <span className="text-[11px] text-stone-400 truncate block">
                          {imageUrl}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="px-2.5 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 text-[11px] font-semibold cursor-pointer transition-colors shrink-0"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Upload Image File */}
            {imageMode === "upload" && (
              <div className="space-y-3">
                <input
                  id="editArticleImageFileInput"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadedPreview ? (
                  <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-24 h-20 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-200">
                      <img
                        src={uploadedPreview}
                        alt="Upload preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-bold text-stone-900 truncate">
                        {imageFile?.name}
                      </p>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {imageFile
                          ? `${(imageFile.size / 1024).toFixed(1)} KB`
                          : ""}{" "}
                        • Ready to upload & replace
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <label
                          htmlFor="editArticleImageFileInput"
                          className="px-3 py-1 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-[11px] font-semibold cursor-pointer transition-colors"
                        >
                          Change File
                        </label>
                        <button
                          type="button"
                          onClick={clearSelectedFile}
                          className="px-3 py-1 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 text-[11px] font-semibold cursor-pointer transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="editArticleImageFileInput"
                      className="border-2 border-dashed border-stone-200 hover:border-amber-500/50 rounded-2xl p-6 bg-stone-50/50 hover:bg-stone-50 transition-colors cursor-pointer block text-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-2">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-stone-800">
                        Click to choose a replacement image file from your
                        computer
                      </p>
                      <p className="text-[11px] text-stone-400 mt-1">
                        Supports JPEG, PNG, and WebP formats (Max size: 5MB)
                      </p>
                    </label>

                    {/* Show current image if exists */}
                    {imageUrl && (
                      <div className="mt-3 p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
                        <div className="w-20 h-14 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-200">
                          <img
                            src={imageUrl}
                            alt="Current"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "/images/solar_energy.jpg";
                            }}
                          />
                        </div>
                        <div className="text-xs text-stone-600 truncate flex-1 min-w-0">
                          <span className="font-semibold block text-stone-900">
                            Current Saved Image
                          </span>
                          <span className="text-[11px] text-stone-400 truncate block">
                            {imageUrl}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {imageFileError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{imageFileError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <div>
            <label
              htmlFor="summary"
              className="block text-xs font-bold text-stone-700 uppercase tracking-wide mb-1.5"
            >
              Summary / Abstract *
            </label>
            <textarea
              id="summary"
              rows={2}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="content"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wide"
              >
                Story Content *
              </label>
              <div className="text-[11px] text-stone-400 font-medium flex items-center gap-2">
                <span>{wordCount} words</span>
                <span>•</span>
                <span>~{estimatedReadTime} min read</span>
              </div>
            </div>
            <textarea
              id="content"
              rows={12}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono text-xs"
            />
          </div>

          {/* Publication Switches */}
          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 block">
                    Published status
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    {isPublished
                      ? "Currently visible live on the public news portal."
                      : "Saved as an internal draft; hidden from readers."}
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-stone-300"
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Feature as Today&apos;s Big Story
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    Displays this article prominently in the hero section on the
                    homepage.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Link
                href="/admin/articles"
                className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
              <strong className="text-stone-900">&ldquo;{title}&rdquo;</strong>?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
