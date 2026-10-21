import { Article, Category, ContentSection } from "../types";
import { ApiArticle } from "./api";

/**
 * Calculates a friendly reading time estimate based on word count.
 */
function estimateReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 150));
  return `${minutes} min read`;
}

/**
 * Formats an ISO date string to a human-readable format (e.g. "Oct 17, 2026").
 */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently";
  }
}

/**
 * Maps arbitrary category names to frontend Category union types.
 */
function normalizeCategory(catName: string): { category: Category; label: string } {
  const lower = (catName || "").toLowerCase();
  if (lower.includes("tech") || lower.includes("cyber")) {
    return { category: "Tech", label: catName || "Technology" };
  }
  if (lower.includes("sci") || lower.includes("space")) {
    return { category: "Science", label: catName || "Science & Space" };
  }
  if (lower.includes("nat") || lower.includes("earth") || lower.includes("env")) {
    return { category: "Nature", label: catName || "Environment & Earth" };
  }
  if (lower.includes("life") || lower.includes("health") || lower.includes("school")) {
    return { category: "Life", label: catName || "Daily Life & Living" };
  }
  return { category: "World", label: catName || "World & Society" };
}

/**
 * Splits plain text content into structured paragraphs/sections.
 */
function parseContentSections(content: string, summary: string): ContentSection[] {
  if (!content || !content.trim()) {
    return [{ paragraph: summary || "No content provided." }];
  }

  const paragraphs = content
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [{ paragraph: content }];
  }

  return paragraphs.map((para, index) => {
    // Optionally make the first section header if there are multiple paragraphs
    let heading: string | undefined = undefined;
    if (index === 0 && paragraphs.length > 1) {
      heading = "The Story So Far";
    } else if (index === paragraphs.length - 1 && paragraphs.length > 2) {
      heading = "What It Means Moving Forward";
    }
    return {
      heading,
      paragraph: para,
    };
  });
}

/**
 * Resolves an article image string to an accessible URL.
 * Supports absolute external URLs and uploaded Django media paths.
 * If no image is provided, returns an empty string (NEVER substitutes an arbitrary image).
 */
export function resolveImageUrl(imageStr?: string): string {
  if (!imageStr || !imageStr.trim()) {
    return "";
  }
  const trimmed = imageStr.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    return `${baseUrl.replace(/\/$/, "")}${trimmed}`;
  }
  return trimmed;
}

/**
 * Adapts a Django backend ApiArticle into the frontend Article data contract.
 */
export function adaptApiArticleToArticle(apiArticle: ApiArticle): Article {
  const { category: normalizedCat } = normalizeCategory(apiArticle.category_name);
  const sections = parseContentSections(apiArticle.content, apiArticle.summary);

  // Generate simple bullet points from summary sentences
  const summarySentences = (apiArticle.summary || "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const takeaways =
    summarySentences.length > 0
      ? summarySentences.slice(0, 3)
      : ["Stay informed with simple daily news updates."];

  const categoryName = apiArticle.category_name || "World";

  return {
    id: String(apiArticle.id),
    slug: apiArticle.slug,
    title: apiArticle.title,
    simpleTitle: apiArticle.title,
    category: categoryName,
    categoryLabel: categoryName,
    categoryIcon: normalizedCat,
    author: apiArticle.author_username,
    date: formatDate(apiArticle.created_at),
    readTime: estimateReadingTime(apiArticle.content),
    imageUrl: resolveImageUrl(apiArticle.image),
    imageCaption: apiArticle.summary || apiArticle.title,
    featured: apiArticle.is_featured,
    shortSnippet: apiArticle.summary || apiArticle.content.slice(0, 160) + "...",
    superSimpleSnippet: apiArticle.summary || apiArticle.content.slice(0, 120) + "...",
    takeaways,
    whyItMatters: apiArticle.summary || "Keeping up with current events helps you understand our changing world.",
    sections,
    wordsToKnow: [],
  };
}

