import React, { useState } from "react";
import { Article } from "../types";
import {
  Clock,
  Bookmark,
  ArrowUpRight,
  BookA,
} from "lucide-react";

interface ArticleCardProps {
  article: Article;
  onSelectArticle: (article: Article) => void;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelectArticle,
  isSaved,
  onToggleSave,
}) => {
  const [imgError, setImgError] = useState(false);
  const displayTitle = article.title;
  const displaySnippet = article.shortSnippet;

  const hasImage = Boolean(
    article.imageUrl && article.imageUrl.trim() && !imgError
  );

  return (
    <article className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Card Header Image - only rendered when an image exists and loads */}
        {hasImage && (
          <div
            onClick={() => onSelectArticle(article)}
            className="relative h-48 sm:h-52 overflow-hidden bg-stone-100 cursor-pointer"
          >
            <img
              src={article.imageUrl}
              alt={article.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-stone-900/5 group-hover:bg-transparent transition-colors" />

            {/* Category Tag */}
            <div className="absolute top-3 left-3">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/95 text-stone-800 shadow-xs backdrop-blur-xs">
                {article.categoryLabel}
              </span>
            </div>

            {/* Bookmark Button */}
            <button
              id={`btn-bookmark-${article.id}`}
              onClick={(e) => onToggleSave(article.id, e)}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-stone-600 hover:text-amber-600 shadow-xs backdrop-blur-xs transition-colors cursor-pointer"
              title={isSaved ? "Remove from saved" : "Save article"}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${isSaved ? "fill-amber-600 text-amber-600" : ""}`}
              />
            </button>
          </div>
        )}

        {/* Card Body */}
        <div className="p-5">
          {/* If no image exists, render category tag & bookmark button directly inside header */}
          {!hasImage && (
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200/60">
                {article.categoryLabel}
              </span>

              <button
                id={`btn-bookmark-${article.id}`}
                onClick={(e) => onToggleSave(article.id, e)}
                className="p-1.5 rounded-lg text-stone-500 hover:text-amber-600 hover:bg-stone-100 transition-colors cursor-pointer"
                title={isSaved ? "Remove from saved" : "Save article"}
              >
                <Bookmark
                  className={`w-4 h-4 ${isSaved ? "fill-amber-600 text-amber-600" : ""}`}
                />
              </button>
            </div>
          )}

          {/* Reading Meta */}
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-2 font-medium">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
            <span>•</span>
            <span>{article.date}</span>
            {article.author && (
              <>
                <span>•</span>
                <span className="text-stone-500 truncate max-w-[120px]">By {article.author}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelectArticle(article)}
            className="font-news text-lg sm:text-xl font-bold text-stone-900 leading-snug mb-2.5 group-hover:text-amber-700 cursor-pointer transition-colors"
          >
            {displayTitle}
          </h3>

          {/* Snippet */}
          <p className="text-stone-600 text-xs sm:text-sm line-clamp-3 leading-relaxed mb-4">
            {displaySnippet}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 pb-5 pt-0">
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <BookA className="w-3.5 h-3.5 text-amber-600" />
            <span>{article.wordsToKnow?.length || 0} Words explained</span>
          </div>

          <button
            id={`btn-open-${article.id}`}
            onClick={() => onSelectArticle(article)}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-900 group-hover:translate-x-0.5 transition-transform cursor-pointer"
          >
            <span>Read Story</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
};
