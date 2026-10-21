import React, { useState, useEffect } from "react";
import { Article, TextSize } from "../types";
import {
  X,
  Bookmark,
  Volume2,
  VolumeX,
  Pause,
  Play,
  CheckCircle2,
  HelpCircle,
  Share2,
  ArrowLeft,
  Clock,
  Sparkles,
  Check,
  Camera,
  ArrowRight,
  Type,
} from "lucide-react";

interface ArticleModalProps {
  article: Article | null;
  onClose: () => void;
  textSize: TextSize;
  setTextSize?: (size: TextSize) => void;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  article,
  onClose,
  textSize,
  setTextSize,
  isSaved,
  onToggleSave,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Reset img error on article change
  useEffect(() => {
    setImgError(false);
  }, [article?.id]);

  // Stop speech when modal closes or article changes
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [article]);

  // Update document title for deep link and modal viewing
  useEffect(() => {
    if (!article) return;
    const originalTitle = document.title;
    document.title = `${article.title} | SimpleNews Media Group`;
    return () => {
      document.title = originalTitle;
    };
  }, [article]);

  if (!article) return null;

  const readingSections =
    article.sections && article.sections.length > 0
      ? article.sections
      : [{ paragraph: article.shortSnippet || "" }];

  // Font size configuration ensuring visible, measurable scaling without CSS overrides
  const currentSizes = {
    normal: {
      title: { fontSize: "2rem", lineHeight: "1.25" },
      heading: { fontSize: "1.375rem", lineHeight: "1.35" },
      body: { fontSize: "1.125rem", lineHeight: "1.75" },
      subtext: { fontSize: "1rem", lineHeight: "1.6" },
      vocab: { fontSize: "0.875rem", lineHeight: "1.5" },
    },
    large: {
      title: { fontSize: "2.375rem", lineHeight: "1.2" },
      heading: { fontSize: "1.625rem", lineHeight: "1.3" },
      body: { fontSize: "1.375rem", lineHeight: "1.8" },
      subtext: { fontSize: "1.15rem", lineHeight: "1.65" },
      vocab: { fontSize: "1rem", lineHeight: "1.55" },
    },
    xlarge: {
      title: { fontSize: "2.75rem", lineHeight: "1.15" },
      heading: { fontSize: "1.875rem", lineHeight: "1.25" },
      body: { fontSize: "1.625rem", lineHeight: "1.85" },
      subtext: { fontSize: "1.25rem", lineHeight: "1.7" },
      vocab: { fontSize: "1.125rem", lineHeight: "1.6" },
    },
  }[textSize] || {
    title: { fontSize: "2rem", lineHeight: "1.25" },
    heading: { fontSize: "1.375rem", lineHeight: "1.35" },
    body: { fontSize: "1.125rem", lineHeight: "1.75" },
    subtext: { fontSize: "1rem", lineHeight: "1.6" },
    vocab: { fontSize: "0.875rem", lineHeight: "1.5" },
  };

  // Speech synthesis handlers using article content
  const handleToggleSpeech = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isPlayingAudio) {
      if (isPausedAudio) {
        window.speechSynthesis.resume();
        setIsPausedAudio(false);
      } else {
        window.speechSynthesis.pause();
        setIsPausedAudio(true);
      }
      return;
    }

    window.speechSynthesis.cancel();

    // Prepare clear text to speak
    const textToSpeak = `${article.title}. 
    In 10 seconds: ${article.takeaways.join(". ")}. 
    ${readingSections.map((s) => `${s.heading ? s.heading + ". " : ""}${s.paragraph}`).join(" ")}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.88;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
    setIsPausedAudio(false);
  };

  const handleStopSpeech = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsPausedAudio(false);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?article=${encodeURIComponent(article.slug || article.id)}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Structured Data (JSON-LD) for SEO
  const canonicalUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname}?article=${encodeURIComponent(article.slug || article.id)}`
      : `https://simplenews.local/?article=${encodeURIComponent(article.slug || article.id)}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.shortSnippet || article.title,
    datePublished: article.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    author: {
      "@type": "Person",
      name: article.author || "SimpleNews Staff",
    },
    publisher: {
      "@type": "Organization",
      name: "SimpleNews Media Group",
      url: typeof window !== "undefined" ? window.location.origin : "https://simplenews.local",
    },
    ...(article.imageUrl && article.imageUrl.trim() && !imgError
      ? { image: [article.imageUrl] }
      : {}),
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 
    sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
    >
      {/* Safely escaped JSON-LD Structured Data for NewsArticle */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl 
        border border-stone-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        data-text-size={textSize}
      >
        {/* Sticky Header inside modal */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3 border-b 
        border-stone-200 bg-stone-50/95 sticky top-0 z-20 backdrop-blur-xs"
        >
          <button
            id="btn-modal-back"
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 
            hover:text-stone-900 cursor-pointer p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to News</span>
          </button>

          {/* Reading Controls: Font size switcher */}
          <div className="flex items-center gap-2">

            {/* Font Size Selector directly in modal reading toolbar */}
            {setTextSize && (
              <div
                className="flex items-center bg-stone-200/70 p-0.5 rounded-lg text-xs"
                title="Adjust text size"
              >
                <span className="pl-1.5 pr-0.5 text-stone-500">
                  <Type className="w-3 h-3" />
                </span>
                <button
                  id="btn-modal-text-size-normal"
                  onClick={() => setTextSize("normal")}
                  className={`w-6 h-6 rounded-md font-bold transition-all cursor-pointer flex items-center justify-center ${
                    textSize === "normal"
                      ? "bg-white text-stone-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                  title="Normal text size"
                >
                  A
                </button>
                <button
                  id="btn-modal-text-size-large"
                  onClick={() => setTextSize("large")}
                  className={`w-6 h-6 rounded-md font-bold text-xs transition-all cursor-pointer flex items-center justify-center ${
                    textSize === "large"
                      ? "bg-white text-stone-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                  title="A+ (Larger text)"
                >
                  A+
                </button>
                <button
                  id="btn-modal-text-size-xlarge"
                  onClick={() => setTextSize("xlarge")}
                  className={`w-6 h-6 rounded-md font-black text-sm transition-all cursor-pointer flex items-center justify-center ${
                    textSize === "xlarge"
                      ? "bg-white text-stone-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                  title="A++ (Extra large text)"
                >
                  A++
                </button>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center gap-1.5">
            <button
              id={`btn-modal-bookmark-${article.id}`}
              onClick={(e) => onToggleSave(article.id, e)}
              className="p-2 rounded-lg text-stone-600 hover:text-amber-600 
              hover:bg-stone-200/60 transition-colors cursor-pointer"
              title={isSaved ? "Remove from saved" : "Save article"}
            >
              <Bookmark
                className={`w-4 h-4 ${isSaved ? "fill-amber-600 text-amber-600" : ""}`}
              />
            </button>
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 
              transition-colors cursor-pointer relative"
              title="Share article"
            >
              {copiedLink ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
            <button
              id="btn-modal-close"
              onClick={onClose}
              className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 
              transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Article Body */}
        <div
          id="article-modal-body"
          data-text-size={textSize}
          className="article-reading-body overflow-y-auto px-5 sm:px-10 py-6 sm:py-8 space-y-6"
          style={
            {
              "--reading-font-size": currentSizes.body.fontSize,
              "--reading-line-height": currentSizes.body.lineHeight,
              "--reading-heading-size": currentSizes.heading.fontSize,
              "--reading-title-size": currentSizes.title.fontSize,
            } as React.CSSProperties
          }
        >
          {/* Article Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-500 font-medium">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                {article.categoryLabel}
              </span>
              {article.author && (
                <>
                  <span>•</span>
                  <span className="font-medium text-stone-600">By {article.author}</span>
                </>
              )}
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
              <span>•</span>
              <span>{article.date}</span>
            </div>
          </div>

          {/* Headline */}
          <h1
            id="article-modal-title"
            style={currentSizes.title}
            className="font-news font-bold text-stone-900 tracking-tight leading-tight"
          >
            {article.title}
          </h1>

          {/* Audio Read-Aloud Tool for Beginners */}
          <div
            className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/70 
          flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-950">
                  Listen to this article (Read Aloud)
                </p>
                <p className="text-[11px] text-stone-600">
                  Great for practicing pronunciation and following along!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                id="btn-audio-toggle"
                onClick={handleToggleSpeech}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 
                hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                {isPlayingAudio && !isPausedAudio ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{isPausedAudio ? "Resume" : "Listen Now"}</span>
                  </>
                )}
              </button>

              {isPlayingAudio && (
                <button
                  id="btn-audio-stop"
                  onClick={handleStopSpeech}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-200 
                  hover:bg-stone-300 text-stone-700 text-xs font-medium cursor-pointer transition-colors"
                  title="Stop audio"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              )}
            </div>
          </div>

          {/* Article Hero Photo - only rendered when an image exists and has not failed */}
          {Boolean(article.imageUrl && article.imageUrl.trim() && !imgError) && (
            <div className="rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
              <img
                src={article.imageUrl}
                alt={article.title}
                onError={() => setImgError(true)}
                className="w-full max-h-[420px] object-cover"
                referrerPolicy="no-referrer"
              />
              {article.imageCaption && (
                <div
                  className="p-2.5 bg-stone-50 border-t border-stone-100 text-[11px] text-stone-500 
                font-medium flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>{article.imageCaption}</span>
                </div>
              )}
            </div>
          )}

          {/* "In 10 Seconds" - 3 Key Facts */}
          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>In 10 Seconds: What You Need To Know</span>
            </div>
            <ul className="space-y-2">
              {article.takeaways.map((item, idx) => (
                <li
                  key={idx}
                  style={currentSizes.subtext}
                  className="flex items-start gap-2.5 text-stone-700"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0" />
                  <span className="leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* "Why It Matters" box */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-950 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>Why This Matters To You</span>
            </div>
            <p
              style={currentSizes.subtext}
              className="text-sky-900 leading-relaxed"
            >
              {article.whyItMatters}
            </p>
          </div>

          {/* Story Content Sections */}
          <div className="space-y-6 pt-2">
            {readingSections.map((sec, idx) => (
              <div key={idx} className="space-y-2">
                {sec.heading && (
                  <h3
                    style={currentSizes.heading}
                    className="text-stone-900 font-news font-bold"
                  >
                    {sec.heading}
                  </h3>
                )}
                <p
                  style={currentSizes.body}
                  className="text-stone-700 font-normal"
                >
                  {sec.paragraph}
                </p>
              </div>
            ))}
          </div>

          {/* Words To Know & Vocabulary Helper */}
          {article.wordsToKnow && article.wordsToKnow.length > 0 && (
            <div className="pt-4 border-t border-stone-200">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Words to Know: New Vocabulary In This Story</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {article.wordsToKnow.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80"
                  >
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <span className="font-bold text-stone-900 text-sm">
                        {item.word}
                      </span>
                      {item.pronunciation && (
                        <span className="text-[11px] text-amber-800 italic font-medium">
                          [{item.pronunciation}]
                        </span>
                      )}
                    </div>
                    <p
                      style={currentSizes.vocab}
                      className="text-stone-700 mb-2 leading-relaxed flex items-start gap-1"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        <strong className="font-semibold text-stone-900">
                          Meaning:
                        </strong>{" "}
                        {item.simpleMeaning}
                      </span>
                    </p>
                    <p className="text-[11px] text-stone-500 italic bg-white/70 p-2 rounded-lg border border-amber-100">
                      “{item.exampleSentence}”
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center 
        justify-between text-xs text-stone-500"
        >
          <span className="inline-flex items-center gap-1.5 font-medium text-stone-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>You finished reading this story!</span>
          </span>
          
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white 
            font-semibold cursor-pointer transition-colors"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
};
