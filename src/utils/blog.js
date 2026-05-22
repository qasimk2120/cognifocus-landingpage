import {
  getPublishedBlogPostBySlug,
  getPublishedBlogPosts,
} from "./cms-content.js";
import { renderMarkdownToHtml } from "./markdown.js";

export const BLOG_PAGE_SIZE = 6;

export const BLOG_CATEGORIES = [
  { label: "Focus Guides", slug: "focus-guides" },
  { label: "App Blocking", slug: "app-blocking" },
  { label: "Study Focus", slug: "study-focus" },
  { label: "ADHD-Friendly Focus", slug: "adhd-friendly-focus" },
  { label: "Product Comparisons", slug: "product-comparisons" },
  { label: "Release Notes", slug: "release-notes" },
];

function parseBlogDate(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T00:00:00Z`)
    : new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export const formatBlogDate = (value) => {
  const parsed = parseBlogDate(value);

  if (!parsed) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
};

export function normalizeBlogPost(entry) {
  const post = entry.data;
  const publishDate = post.publishedAt;
  const updatedDate = post.updatedAt || post.publishedAt;
  const bodyMarkdown = post.bodyMarkdown || "";

  return {
    ...post,
    publishDate,
    updatedDate,
    articleTitle: post.articleTitle || post.title,
    canonical: post.canonical || `https://cognifocus.app/blog/${post.slug}.html`,
    ogTitle: post.ogTitle || post.seoTitle || post.title,
    ogDescription: post.ogDescription || post.seoDescription || post.description,
    ogImage: post.ogImage || post.coverImage,
    displayDate: post.displayDate || (parseBlogDate(publishDate) ? formatBlogDate(publishDate) : ""),
    categorySlug: post.categorySlug || "",
    excerpt: post.excerpt || post.description,
    bodyClass: post.bodyClass || "seo-guide-page blog-page cf-shell",
    includePinterest: post.includePinterest ?? true,
    schemaHeadline: post.schemaHeadline || post.articleTitle || post.title,
    schemaDescription: post.schemaDescription || post.description,
    breadcrumbTitle: post.breadcrumbTitle || post.articleTitle || post.title,
    breadcrumbLabel: post.breadcrumbLabel || post.articleTitle || post.title,
    bodyMarkdown,
    bodyHtml: bodyMarkdown.trim()
      ? renderMarkdownToHtml(bodyMarkdown)
      : post.bodyHtml || "",
  };
}

export const sortPostsByDate = (entries) =>
  [...entries].sort((a, b) =>
    (b.publishDate || "").localeCompare(a.publishDate || ""),
  );

export async function getSortedPosts() {
  return sortPostsByDate(await getPublishedBlogPosts());
}

export async function getFeaturedPosts() {
  return (await getSortedPosts()).filter((post) => post.featured);
}

export async function getPostBySlug(slug) {
  return getPublishedBlogPostBySlug(slug);
}

export const getCategoryBySlug = (slug) =>
  BLOG_CATEGORIES.find((category) => category.slug === slug);

export async function getPostsByCategory(slug) {
  return (await getSortedPosts()).filter((post) => post.categorySlug === slug);
}

export async function getActiveCategories() {
  const counts = new Map();

  for (const post of await getSortedPosts()) {
    counts.set(post.categorySlug, (counts.get(post.categorySlug) || 0) + 1);
  }

  return BLOG_CATEGORIES.filter((category) => counts.has(category.slug)).map(
    (category) => ({
      ...category,
      count: counts.get(category.slug),
    }),
  );
}

export const getTotalPages = (entries, pageSize = BLOG_PAGE_SIZE) =>
  Math.max(1, Math.ceil(entries.length / pageSize));

export const getPageSlice = (entries, pageNumber, pageSize = BLOG_PAGE_SIZE) =>
  entries.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

export const getBlogPagePath = (pageNumber) =>
  pageNumber <= 1 ? "/blog/" : `/blog/page/${pageNumber}.html`;

export const getCategoryPagePath = (categorySlug, pageNumber = 1) =>
  pageNumber <= 1
    ? `/blog/category/${categorySlug}/`
    : `/blog/category/${categorySlug}/page/${pageNumber}.html`;
