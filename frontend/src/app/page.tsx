"use client";

// React hooks:
// - useState: local component state
// - useEffect: side effects (localStorage, sessionStorage, mount flag)
// - useMemo: memoized/derived values (filtering, featured article, feed)
import React, { useState, useEffect, useMemo } from "react";

// Static data + shared types used across the app
import { ARTICLES_DATA } from "../data/newsData";
import { Article, Category, TextSize } from "../types";
import {
  newsApi,
  categoriesApi,
  bookmarksApi,
  tokenStorage,
  ApiCategory,
} from "../lib/api";
import { adaptApiArticleToArticle } from "../lib/article-adapter";

// Layout / UI components (header, nav, cards, modals, footer)
import { Header } from "../components/Header";
import { CategoryNav } from "../components/CategoryNav";
import { FeaturedArticle } from "../components/FeaturedArticle";
import { ArticleCard } from "../components/ArticleCard";
import { ArticleModal } from "../components/ArticleModal";
import { WordOfTheDay } from "../components/WordOfTheDay";
import { AboutModal } from "../components/AboutModal";
import { Footer } from "../components/Footer";

// Icons from lucide-react used in banners, empty states, and the sidebar
import {
  Bookmark,
  Search,
  Compass,
  BookOpenCheck,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  WifiOff,
} from "lucide-react";

export default function Home() {
  // ─────────────────────────────────────────────────────────────
  // STATE
  // ─────────────────────────────────────────────────────────────

  // `mounted` prevents hydration mismatches: we only read from
  // localStorage AFTER the first client render.
  const [mounted, setMounted] = useState(false);

  // User preferences (persisted to localStorage)
  const [textSize, setTextSize] = useState<TextSize>("normal");

  // Articles & Categories state: populated with live published articles and categories from backend
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isLiveFeed, setIsLiveFeed] = useState<boolean>(false);
  const [backendOffline, setBackendOffline] = useState<boolean>(false);
  const [loadingArticles, setLoadingArticles] = useState<boolean>(true);

  // Feed filters
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Saved (bookmarked) articles
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>([]);

  // When true, the feed only shows bookmarked articles
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  // Currently opened article (null = modal closed)
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  // About modal visibility
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // How many stories the user has opened this session (for the tracker card)
  const [readCount, setReadCount] = useState<number>(0);

  // ─────────────────────────────────────────────────────────────
  // EFFECTS: load persisted state & live backend data on mount
  // ─────────────────────────────────────────────────────────────

  const loadLivePortalData = async () => {
    setLoadingArticles(true);
    try {
      const [liveArticles, liveCategories] = await Promise.all([
        newsApi.getArticles(),
        categoriesApi.getCategories().catch(() => []),
      ]);

      if (liveCategories && liveCategories.length > 0) {
        setCategories(liveCategories);
      }

      if (liveArticles && liveArticles.length > 0) {
        const adapted = liveArticles.map(adaptApiArticleToArticle);
        setArticles(adapted);
        setIsLiveFeed(true);
        setBackendOffline(false);
      } else {
        // Backend reached but database has 0 published articles
        setArticles([]);
        setIsLiveFeed(true);
        setBackendOffline(false);
      }
    } catch {
      // Backend is unreachable: clearly designate offline demo archive
      setArticles(ARTICLES_DATA);
      setIsLiveFeed(false);
      setBackendOffline(true);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    try {
      // Restore text size
      const savedSize = localStorage.getItem("simplenews_size") as TextSize;
      if (savedSize) setTextSize(savedSize);

      // Restore bookmarked article IDs from local storage (anonymous baseline)
      const savedIds = localStorage.getItem("simplenews_saved");
      if (savedIds) {
        try {
          setSavedArticleIds(JSON.parse(savedIds));
        } catch {
          // ignore corrupted JSON
        }
      }

      // Restore session read count
      const count = sessionStorage.getItem("simplenews_read_count");
      if (count) setReadCount(parseInt(count, 10));
    } catch {
      // If storage is blocked/corrupt, silently keep defaults
    }

    // If an authenticated session exists, fetch backend bookmarks
    const token = tokenStorage.getAccessToken();
    if (token) {
      bookmarksApi
        .getBookmarks()
        .then((bms) => {
          if (bms && bms.length > 0) {
            const apiIds = bms.map((b) => String(b.article.id));
            setSavedArticleIds(apiIds);
          }
        })
        .catch(() => {
          // User token may be expired or offline; fallback to local bookmarks
        });
    }

    // Load live articles and categories from Django backend
    loadLivePortalData();
  }, []);

  // Check URL query for deep-linked article (e.g. ?article=slug)
  useEffect(() => {
    if (typeof window === "undefined" || articles.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const targetSlugOrId = params.get("article");
    if (!targetSlugOrId) return;

    // Check loaded articles
    const found = articles.find(
      (a) => a.slug === targetSlugOrId || a.id === targetSlugOrId,
    );
    if (found) {
      setActiveArticle(found);
    } else {
      // Fetch article detail by slug directly from backend
      newsApi
        .getArticleBySlug(targetSlugOrId)
        .then((apiArt) => {
          const adapted = adaptApiArticleToArticle(apiArt);
          setActiveArticle(adapted);
        })
        .catch(() => {
          // Article slug not found
        });
    }
  }, [articles]);

  // ─────────────────────────────────────────────────────────────
  // EFFECTS: persist state whenever it changes
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("simplenews_size", textSize);
  }, [textSize, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("simplenews_saved", JSON.stringify(savedArticleIds));
  }, [savedArticleIds, mounted]);

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Toggle the bookmark state for an article.
   * If logged in, syncs to backend bookmark API.
   * Also maintains local storage for offline / anonymous visitors.
   */
  const handleToggleSave = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = tokenStorage.getAccessToken();
    const isCurrentlySaved = savedArticleIds.includes(id);

    // Optimistic state update
    setSavedArticleIds((prev) =>
      isCurrentlySaved ? prev.filter((item) => item !== id) : [...prev, id],
    );

    // If authenticated user with numeric article id, synchronize with Django bookmark API
    const numericId = parseInt(id, 10);
    if (token && !isNaN(numericId)) {
      try {
        if (isCurrentlySaved) {
          await bookmarksApi.deleteBookmarkByArticleId(numericId);
        } else {
          await bookmarksApi.createBookmark(numericId);
        }
      } catch {
        // Revert on API failure
        setSavedArticleIds((prev) =>
          isCurrentlySaved ? [...prev, id] : prev.filter((item) => item !== id),
        );
      }
    }
  };

  /**
   * Open an article in the modal, update URL query parameter, and bump read count.
   */
  const handleSelectArticle = (article: Article) => {
    setActiveArticle(article);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("article", article.slug || article.id);
      window.history.pushState(null, "", url.toString());

      setReadCount((prev) => {
        const next = prev + 1;
        sessionStorage.setItem("simplenews_read_count", next.toString());
        return next;
      });
    }
  };

  /**
   * Close the article reader modal and remove ?article from URL.
   */
  const handleCloseArticle = () => {
    setActiveArticle(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("article");
      const newQuery = url.searchParams.toString();
      const newUrl = url.pathname + (newQuery ? `?${newQuery}` : "");
      window.history.pushState(null, "", newUrl);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DERIVED DATA (useMemo)
  // ─────────────────────────────────────────────────────────────

  /**
   * The list of articles that pass all current filters:
   *   1. Saved-only mode (if enabled)
   *   2. Category filter (unless "All" or saved-only)
   *   3. Search query (matches title, snippet, words-to-know, category)
   */
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Saved-only mode overrides category filtering
      if (showSavedOnly && !savedArticleIds.includes(article.id)) {
        return false;
      }

      // Category filter (skipped when in saved-only mode)
      if (
        !showSavedOnly &&
        selectedCategory !== "All" &&
        article.category !== selectedCategory &&
        article.categoryLabel !== selectedCategory
      ) {
        return false;
      }

      // Search filter — case-insensitive match across several fields
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle =
          article.title.toLowerCase().includes(q) ||
          Boolean(article.simpleTitle?.toLowerCase().includes(q));
        const matchesSnippet =
          article.shortSnippet.toLowerCase().includes(q) ||
          Boolean(article.superSimpleSnippet?.toLowerCase().includes(q));
        const matchesWords = article.wordsToKnow.some((w) =>
          w.word.toLowerCase().includes(q),
        );
        const matchesCategory = article.categoryLabel.toLowerCase().includes(q);
        return (
          matchesTitle || matchesSnippet || matchesWords || matchesCategory
        );
      }
      return true;
    });
  }, [articles, selectedCategory, searchQuery, showSavedOnly, savedArticleIds]);

  /**
   * Pick the featured article. We only show the hero card when the user
   * is looking at the unfiltered "All" feed — otherwise it would be
   * confusing/redundant with the filtered results.
   */
  const featuredArticle = useMemo(() => {
    if (showSavedOnly || searchQuery.trim() || selectedCategory !== "All") {
      return null;
    }
    return articles.find((a) => a.featured) || articles[0];
  }, [articles, showSavedOnly, searchQuery, selectedCategory]);

  /**
   * The rest of the feed. If a featured article is being shown, remove it
   * from the grid below so it isn't displayed twice.
   */
  const feedArticles = useMemo(() => {
    if (
      featuredArticle &&
      !showSavedOnly &&
      !searchQuery.trim() &&
      selectedCategory === "All"
    ) {
      return filteredArticles.filter((a) => a.id !== featuredArticle.id);
    }
    return filteredArticles;
  }, [
    filteredArticles,
    featuredArticle,
    showSavedOnly,
    searchQuery,
    selectedCategory,
  ]);

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800">
      {/* Top navigation bar: text size, search, saved toggle, about */}
      <Header
        textSize={textSize}
        setTextSize={setTextSize}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        savedCount={savedArticleIds.length}
        showSavedOnly={showSavedOnly}
        setShowSavedOnly={setShowSavedOnly}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Horizontal category pills (World, Tech, Science, etc.) */}
      <CategoryNav
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        showSavedOnly={showSavedOnly}
        setShowSavedOnly={setShowSavedOnly}
        savedCount={savedArticleIds.length}
      />

      {/* Main content area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Offline notice when backend cannot be reached */}
        {backendOffline && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-200/80 text-amber-900 shrink-0">
                <WifiOff className="w-4 h-4 text-amber-800" />
              </div>
              <div>
                <strong className="block font-bold text-stone-900">
                  Offline Demonstration Archive
                </strong>
                <span className="text-stone-600">
                  Django backend is currently offline. You are browsing the
                  local demo archive.
                </span>
              </div>
            </div>
            <button
              onClick={loadLivePortalData}
              disabled={loadingArticles}
              className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingArticles ? "animate-spin" : ""}`}
              />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Banner shown only in "saved only" mode */}
        {showSavedOnly && (
          <div
            className="bg-amber-100/70 border border-amber-200 rounded-2xl p-5 sm:p-6 flex flex-col 
             sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 
                 flex items-center justify-center font-bold"
              >
                <Bookmark className="w-5 h-5 fill-stone-950" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-stone-900 font-news">
                  Your Saved Stories ({savedArticleIds.length})
                </h2>
                <p className="text-xs text-stone-600">
                  Articles you've bookmarked to practice reading and review new
                  words.
                </p>
              </div>
            </div>

            {/* Exit saved-only mode */}
            <button
              onClick={() => setShowSavedOnly(false)}
              className="self-start sm:self-center px-4 py-2 rounded-xl bg-white 
              border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 
              shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to All News</span>
            </button>
          </div>
        )}

        {/* Banner shown while a search query is active */}
        {searchQuery.trim() && (
          <div
            className="bg-stone-100 border border-stone-200 rounded-2xl p-4 sm:p-5 
            flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2 text-sm text-stone-700">
              <Search className="w-4 h-4 text-stone-500" />
              <span>
                Search results for{" "}
                <strong className="font-semibold text-stone-900">
                  "{searchQuery}"
                </strong>{" "}
                ({filteredArticles.length} found)
              </span>
            </div>
            {/* Clear the search query */}
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Hero / featured story (only on the default "All" feed) */}
        {featuredArticle && (
          <section aria-label="Featured Story">
            <FeaturedArticle
              article={featuredArticle}
              onSelectArticle={handleSelectArticle}
              isSaved={savedArticleIds.includes(featuredArticle.id)}
              onToggleSave={handleToggleSave}
            />
          </section>
        )}

        {/* Two-column layout: article feed + sidebar widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT: news feed cards (spans 8 of 12 columns on large screens) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section header: title, count */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-stone-900 font-news">
                  {showSavedOnly
                    ? "Saved Articles"
                    : selectedCategory === "All"
                      ? "Latest Easy Stories"
                      : `${selectedCategory} Stories`}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-200/70 text-stone-700">
                  {feedArticles.length}
                </span>

                {isLiveFeed ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Portal
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600 border border-stone-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                    Demo Archive
                  </span>
                )}
              </div>
            </div>

            {/* Empty state: no matches for the current filter/search */}
            {feedArticles.length === 0 && (
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-stone-200">
                <div
                  className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center 
                  justify-center mx-auto mb-3"
                >
                  <Compass className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-stone-800 mb-1">
                  {showSavedOnly
                    ? "No saved stories yet"
                    : "No articles matched your search"}
                </h4>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mb-5">
                  {showSavedOnly
                    ? "Click the bookmark icon on any article to save it here for later reading!"
                    : "Try typing a simpler word or clear the search box to see all news."}
                </p>
                {showSavedOnly ? (
                  // Exit saved-only mode to browse everything
                  <button
                    onClick={() => setShowSavedOnly(false)}
                    className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold 
                    hover:bg-amber-700 cursor-pointer shadow-xs transition-colors"
                  >
                    Browse All Stories
                  </button>
                ) : (
                  // Reset all filters to the default state
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All");
                    }}
                    className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold 
                    hover:bg-stone-800 cursor-pointer shadow-xs transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            )}

            {/* Responsive grid of article cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {feedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onSelectArticle={handleSelectArticle}
                  isSaved={savedArticleIds.includes(article.id)}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: sidebar with learning widgets (4 of 12 columns) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Daily vocabulary widget */}
            <WordOfTheDay />

            {/* Reading progress tracker */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center 
                justify-center font-bold"
                >
                  <BookOpenCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                    Today's Reading Tracker
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Keep your reading streak active!
                  </p>
                </div>
              </div>

              {/* Two quick stats: stories opened + saved */}
              <div
                className="flex items-center justify-between p-3.5 rounded-xl 
                bg-stone-50 border border-stone-100 mb-3"
              >
                <div>
                  <span className="text-xs text-stone-500 block">
                    Stories Opened
                  </span>
                  <span className="text-2xl font-bold text-stone-900 font-news">
                    {readCount} {readCount === 1 ? "Story" : "Stories"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500 block">
                    Saved to Review
                  </span>
                  <span className="text-2xl font-bold text-amber-700 font-news">
                    {savedArticleIds.length}
                  </span>
                </div>
              </div>

              {/* Encouraging tip */}
              <p className="text-xs text-stone-600 leading-relaxed">
                Reading just{" "}
                <strong className="font-semibold text-stone-800">
                  1 to 2 stories
                </strong>{" "}
                a day teaches you hundreds of new English words each month
                without stress!
              </p>
            </div>

            {/* Beginner "how to read" guide card */}
            <div className="bg-stone-100/80 rounded-2xl border border-stone-200/80 p-5">
              <div className="flex items-center gap-2 mb-2.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  How To Read A News Story
                </h4>
              </div>

              <ol className="space-y-2 text-xs text-stone-600 list-decimal list-inside leading-relaxed">
                <li>
                  <strong className="text-stone-800 font-semibold">
                    Look at the headline:
                  </strong>{" "}
                  Ask yourself what the main event is.
                </li>
                <li>
                  <strong className="text-stone-800 font-semibold">
                    Read the 10-second takeaways:
                  </strong>{" "}
                  Get the 3 big points first.
                </li>
                <li>
                  <strong className="text-stone-800 font-semibold">
                    Check words to know:
                  </strong>{" "}
                  Understand tricky vocabulary before reading.
                </li>
                <li>
                  <strong className="text-stone-800 font-semibold">
                    Press "Listen":
                  </strong>{" "}
                  Hear the pronunciation out loud!
                </li>
              </ol>

              {/* Opens the About modal */}
              <button
                onClick={() => setIsAboutOpen(true)}
                className="mt-4 w-full py-2 rounded-xl bg-white hover:bg-stone-50 border 
                border-stone-200 text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
              >
                Learn more about SimpleNews Media
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Article reader modal (controlled by `activeArticle`) */}
      <ArticleModal
        article={activeArticle}
        onClose={handleCloseArticle}
        textSize={textSize}
        setTextSize={setTextSize}
        isSaved={
          activeArticle ? savedArticleIds.includes(activeArticle.id) : false
        }
        onToggleSave={handleToggleSave}
      />

      {/* About modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />

      {/* Footer with category shortcuts + about link */}
      <Footer
        categories={categories}
        onSelectCategory={(cat) => {
          // Clicking a footer category:
          // 1. exits saved-only mode
          // 2. selects the category
          // 3. scrolls back to top for a fresh view
          setShowSavedOnly(false);
          setSelectedCategory(cat);
          if (typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }}
        onOpenAbout={() => setIsAboutOpen(true)}
      />
    </div>
  );
}
