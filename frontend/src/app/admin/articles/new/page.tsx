"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  newsApi,
  categoriesApi,
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
  HelpCircle,
  FileText,
} from "lucide-react";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewArticlePage() {
  const router = useRouter();

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManual, setIsSlugManual] = useState(false);
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

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load categories
  useEffect(() => {
    async function loadCats() {
      try {
        const data = await categoriesApi.getCategories();
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      } catch (err) {
        setErrorMessage("Failed to load categories from server.");
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCats();
  }, []);

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
      setImageFileError("Invalid image format. Allowed formats: JPEG, PNG, WebP.");
      return;
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setImageFileError(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum limit of 5MB.`
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
    const fileInput = document.getElementById("articleImageFileInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  // Update slug automatically when title changes unless manually edited
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManual) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManual(true);
    setSlug(slugify(val));
  };

  const handleSubmit = async (e: React.FormEvent, publishImmediately?: boolean) => {
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
          setErrorMessage("Online image URL must start with http:// or https://");
          return;
        }
      } catch {
        setErrorMessage("Please enter a valid, well-formed image URL.");
        return;
      }
    }

    setSubmitting(true);
    setErrorMessage(null);

    const payload: ArticleInput = {
      title: title.trim(),
      slug: slug.trim() ? slug.trim() : undefined,
      category: Number(categoryId),
      summary: summary.trim(),
      content: content.trim(),
      image: imageMode === "url" && imageUrl.trim() ? imageUrl.trim() : undefined,
      image_file: imageMode === "upload" && imageFile ? imageFile : undefined,
      is_published: publishImmediately !== undefined ? publishImmediately : isPublished,
      is_featured: isFeatured,
    };

    try {
      await newsApi.createArticle(payload);
      router.push("/admin/articles");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred while saving the story.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 150));

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER & BREADCRUMBS
          ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200">
        <div>
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Articles</span>
          </Link>
          <h1 className="font-news text-2xl sm:text-3xl font-bold text-stone-900">
            Write New Article
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, false)}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>Publish Now</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MAIN FORM
          ───────────────────────────────────────────────────────────── */}
      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
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
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Major Renewable Energy Milestone Achieved Globally"
              className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 font-news text-lg font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600"
            />
          </div>

          {/* Slug input with auto-sync notice */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="slug"
                className="block text-xs font-bold text-stone-700 uppercase tracking-wide"
              >
                URL Slug
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsSlugManual(false);
                  setSlug(slugify(title));
                }}
                className="text-[11px] text-amber-700 hover:underline cursor-pointer"
              >
                Auto-generate from Title
              </button>
            </div>
            <div className="flex items-center rounded-xl bg-stone-50 border border-stone-200 overflow-hidden">
              <span className="px-3.5 text-xs text-stone-400 font-mono select-none bg-stone-100/80 border-r border-stone-200 py-2.5">
                /api/news/
              </span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="auto-generated-slug-from-title"
                className="flex-1 px-3.5 py-2.5 bg-transparent font-mono text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Leave blank to have the server automatically generate a collision-safe slug.
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
              disabled={loadingCategories || categories.length === 0}
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
            {categories.length === 0 && !loadingCategories && (
              <p className="text-[11px] text-rose-600 mt-1">
                Please create a category before publishing an article.
              </p>
            )}
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
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <p className="text-[11px] text-stone-400">
                  Enter a valid publicly accessible image link (starting with http:// or https://).
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
                          Online Image Preview
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
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Upload Image File */}
            {imageMode === "upload" && (
              <div className="space-y-3">
                <input
                  id="articleImageFileInput"
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
                        {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ""} • Ready for upload
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <label
                          htmlFor="articleImageFileInput"
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
                  <label
                    htmlFor="articleImageFileInput"
                    className="border-2 border-dashed border-stone-200 hover:border-amber-500/50 rounded-2xl p-6 bg-stone-50/50 hover:bg-stone-50 transition-colors cursor-pointer block text-center"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-2">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-stone-800">
                      Click to choose an image file from your computer
                    </p>
                    <p className="text-[11px] text-stone-400 mt-1">
                      Supports JPEG, PNG, and WebP formats (Max size: 5MB)
                    </p>
                  </label>
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

          {/* Summary / Abstract */}
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
              placeholder="A concise, high-level overview of the news story (1-2 sentences)..."
              className="w-full p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 leading-relaxed placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />
          </div>

          {/* Full Story Content */}
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
              placeholder="Write the full news story here. Separate paragraphs with double line breaks for clean readability..."
              className="w-full p-4 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-800 leading-relaxed placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 font-mono text-xs"
            />
          </div>

          {/* Editorial Switches */}
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
                    Publish immediately
                  </span>
                  <span className="text-[11px] text-stone-500 block">
                    When checked, this article will appear live to all readers on the portal.
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
                    Displays this article prominently in the hero section on the homepage.
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
                <span>Save Article</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
