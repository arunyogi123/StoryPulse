import React, { useState } from "react";
import { Article } from "../types";
import {
  Clock,
  Bookmark,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

interface FeaturedArticleProps {
  article: Article;
  onSelectArticle: (article: Article) => void;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
}

export const FeaturedArticle: React.FC<FeaturedArticleProps> = ({
  article,
  onSelectArticle,
  isSaved,
  onToggleSave,
}) => {
  const [imgError, setImgError] = useState(false);
  const displayTitle = article.title;
  const displaySnippet = article.shortSnippet;

  const hasImage = Boolean(
    article.imageUrl && article.imageUrl.trim() && !imgError,
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
      {hasImage ? (
        /* Layout with Featured Photo */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left: Image Container */}
          <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[340px] overflow-hidden bg-stone-100 group">
            <img
              src={article.imageUrl}
              alt={article.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500 ease-out"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />

            {/* Badge & Bookmark Overlay */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-stone-950 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                Today's Big Story
              </span>
            </div>

            <button
              id={`btn-bookmark-featured-${article.id}`}
              onClick={(e) => onToggleSave(article.id, e)}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-white/90 backdrop-blur-xs text-stone-700 hover:text-amber-600 hover:bg-white shadow-md transition-colors cursor-pointer"
              title={
                isSaved ? "Remove from saved stories" : "Save story for later"
              }
            >
              <Bookmark
                className={`w-4 h-4 ${isSaved ? "fill-amber-600 text-amber-600" : ""}`}
              />
            </button>

            {article.imageCaption && (
              <p className="absolute bottom-2 left-4 right-4 text-[11px] text-white/90 truncate lg:hidden font-medium">
                {article.imageCaption}
              </p>
            )}
          </div>

          {/* Right: Content */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-stone-50/50">
            <div>
              {/* Meta tags */}
              <div className="flex items-center gap-2.5 text-xs text-stone-500 mb-3">
                <span className="font-semibold text-amber-700 uppercase tracking-wider text-[11px]">
                  {article.categoryLabel}
                </span>
                {article.author && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-stone-600">
                      By {article.author}
                    </span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {article.readTime}
                </span>
                <span>•</span>
                <span>{article.date}</span>
              </div>

              {/* Headline */}
              <h2
                onClick={() => onSelectArticle(article)}
                className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight font-news hover:text-amber-700 cursor-pointer transition-colors leading-tight mb-3"
              >
                {displayTitle}
              </h2>

              {/* Summary Snippet */}
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-5">
                {displaySnippet}
              </p>

              {/* 3 Quick Takeaways Box */}
              {article.takeaways && article.takeaways.length > 0 && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wider mb-2.5">
                    <CheckCircle2 className="w-4 h-4 text-amber-700" />
                    <span>3 Quick Facts in 10 Seconds</span>
                  </div>
                  <ul className="space-y-1.5">
                    {article.takeaways.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-xs sm:text-sm text-stone-700"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-stone-200">
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  {article.wordsToKnow?.length || 0} key words explained
                </span>
              </div>

              <button
                id={`btn-read-featured-${article.id}`}
                onClick={() => onSelectArticle(article)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-xs transition-colors"
              >
                <span>Read Full Story</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Full-width editorial layout when article has no image */
        <div className="p-6 sm:p-10 bg-gradient-to-br from-white via-stone-50/60 to-amber-50/30 flex flex-col justify-between">
          <div>
            {/* Top Bar with Badge, Category, Meta, and Bookmark */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-stone-950 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Today's Big Story
                </span>
                <span className="font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full text-xs">
                  {article.categoryLabel}
                </span>
                {article.author && (
                  <>
                    <span className="text-stone-300">•</span>
                    <span className="text-xs font-medium text-stone-600">
                      By {article.author}
                    </span>
                  </>
                )}
                <span className="text-stone-300">•</span>
                <span className="flex items-center gap-1 text-xs text-stone-500">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {article.readTime}
                </span>
                <span className="text-stone-300">•</span>
                <span className="text-xs text-stone-500">{article.date}</span>
              </div>

              <button
                id={`btn-bookmark-featured-${article.id}`}
                onClick={(e) => onToggleSave(article.id, e)}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-amber-600 transition-colors cursor-pointer"
                title={
                  isSaved ? "Remove from saved stories" : "Save story for later"
                }
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved ? "fill-amber-600 text-amber-600" : ""}`}
                />
              </button>
            </div>

            {/* Large Editorial Headline */}
            <h2
              onClick={() => onSelectArticle(article)}
              className="text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight font-news hover:text-amber-700 cursor-pointer transition-colors leading-tight mb-4"
            >
              {displayTitle}
            </h2>

            {/* Summary Snippet */}
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-6 max-w-4xl">
              {displaySnippet}
            </p>

            {/* 3 Quick Takeaways Box */}
            {article.takeaways && article.takeaways.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 mb-8 max-w-4xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 uppercase tracking-wider mb-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-700" />
                  <span>3 Quick Facts in 10 Seconds</span>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {article.takeaways.map((point, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-xs sm:text-sm text-stone-800 bg-white/70 p-3 rounded-xl border border-amber-100"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-200">
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <BookOpen className="w-3.5 h-3.5 text-stone-400" />
              <span>
                {article.wordsToKnow?.length || 0} key words explained
              </span>
            </div>

            <button
              id={`btn-read-featured-${article.id}`}
              onClick={() => onSelectArticle(article)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold cursor-pointer shadow-xs transition-colors"
            >
              <span>Read Full Story</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
