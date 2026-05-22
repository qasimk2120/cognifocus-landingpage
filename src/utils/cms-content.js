import { getCollection } from "astro:content";
import { renderMarkdownToHtml } from "./markdown.js";

const CMS_SOURCE = String(import.meta.env.CMS_CONTENT_SOURCE || "auto").trim();
const CMS_BASE_URL = String(
  import.meta.env.CMS_FUNCTION_BASE_URL ||
    import.meta.env.PUBLIC_CMS_FUNCTION_BASE_URL ||
    "",
).trim();
const CMS_BUILD_AUTH_TOKEN = String(
  import.meta.env.CMS_BUILD_AUTH_TOKEN || "",
).trim();

let blogPostsPromise;
let releaseNotesPromise;

const cmsListEndpoints = {
  blog: "listCmsBlogPosts",
  releases: "listCmsReleaseNotes",
};

const cmsPayloadKeys = {
  blog: ["blog", "blogPosts", "posts"],
  releases: ["releases", "releaseNotes", "notes"],
};

function getCmsAuthMode() {
  return CMS_BUILD_AUTH_TOKEN ? "build-token" : "none";
}

function shouldUseCms() {
  return CMS_SOURCE === "cms" || (CMS_SOURCE !== "local" && Boolean(CMS_BASE_URL));
}

function shouldFailOnCmsError() {
  return CMS_SOURCE === "cms";
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toDateFromTimestampLike(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value?.toDate === "function") {
    return toDateFromTimestampLike(value.toDate());
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value !== "object") {
    return null;
  }

  const seconds = value.seconds ?? value._seconds;
  const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0;

  if (typeof seconds !== "number") {
    return null;
  }

  const milliseconds =
    (seconds * 1000) + Math.floor(Number(nanoseconds || 0) / 1000000);
  const parsed = new Date(milliseconds);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeCmsDateValue(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return "";
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const parsed = toDateFromTimestampLike(trimmed);
    return parsed ? parsed.toISOString() : trimmed;
  }

  const parsed = toDateFromTimestampLike(value);
  return parsed ? parsed.toISOString() : "";
}

function toDateOnly(value) {
  const normalized = normalizeCmsDateValue(value);

  if (!normalized) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const parsed = toDateFromTimestampLike(normalized);
  return parsed ? parsed.toISOString().slice(0, 10) : normalized;
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeItemsPayload(payload, resource) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.[resource])) {
    return payload[resource];
  }

  for (const key of cmsPayloadKeys[resource] || []) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function isPublishedCmsItem(item) {
  return item?.status === "published";
}

function isPublishedLocalItem(item) {
  return !item?.status || item.status === "published";
}

async function fetchCmsItems(resource) {
  const baseUrl = trimTrailingSlash(CMS_BASE_URL);
  const endpoint = cmsListEndpoints[resource];

  if (!endpoint) {
    throw new Error(`Unknown CMS resource "${resource}".`);
  }

  const url = new URL(`${baseUrl}/${endpoint}`);
  url.searchParams.set("status", "published");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(CMS_BUILD_AUTH_TOKEN
        ? { Authorization: `Bearer ${CMS_BUILD_AUTH_TOKEN}` }
        : {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `CMS ${resource} fetch failed with HTTP ${response.status}.`,
    );
  }

  return normalizeItemsPayload(payload, resource).filter(isPublishedCmsItem);
}

async function loadLocalItems(resource, localLoader, reason) {
  const items = await localLoader();
  console.warn(
    `[cms-content] Using local ${resource} content (${items.length} items). ${reason}`,
  );
  return { items, source: "local" };
}

async function getCmsOrLocalItems(resource, localLoader) {
  if (!shouldUseCms()) {
    const reason =
      CMS_SOURCE === "local"
        ? "CMS source is forced to local."
        : "CMS base URL is not configured.";
    return loadLocalItems(resource, localLoader, reason);
  }

  try {
    const items = await fetchCmsItems(resource);
    console.info(
      `[cms-content] Using CMS ${resource} content (${items.length} published items) from ${trimTrailingSlash(
        CMS_BASE_URL,
      )}. Auth mode: ${getCmsAuthMode()}.`,
    );
    return { items, source: "cms" };
  } catch (error) {
    if (shouldFailOnCmsError()) {
      throw new Error(
        `Could not fetch published CMS ${resource}. ${error.message}`,
      );
    }

    return loadLocalItems(
      resource,
      localLoader,
      `Falling back because CMS fetch failed: ${error.message}. Auth mode: ${getCmsAuthMode()}.`,
    );
  }
}

function normalizeBlogPost(item, source = "cms") {
  const slug = item.slug || item.id || slugify(item.title);
  const publishedAt = toDateOnly(item.publishedAt || item.publishDate || "");
  const updatedAt = toDateOnly(item.updatedAt || item.updatedDate || publishedAt);
  const bodyMarkdown = item.bodyMarkdown || "";
  const bodyHtml = bodyMarkdown.trim()
    ? renderMarkdownToHtml(bodyMarkdown)
    : item.bodyHtml || "";
  const category = item.category || "Focus Guides";
  const categorySlug = item.categorySlug || slugify(category);
  const canonical = item.canonical || `https://cognifocus.app/blog/${slug}.html`;

  return {
    ...item,
    slug,
    status: item.status || "published",
    publishedAt,
    publishDate: publishedAt,
    updatedAt,
    updatedDate: updatedAt,
    articleTitle: item.articleTitle || item.title,
    title: item.seoTitle || item.title,
    description: item.description || item.excerpt || item.seoDescription || "",
    canonical,
    ogTitle: item.ogTitle || item.seoTitle || item.title,
    ogDescription:
      item.ogDescription || item.seoDescription || item.description || item.excerpt,
    ogImage: item.ogImage || item.coverImageUrl || item.coverImage,
    displayDate: item.displayDate || "",
    category,
    categorySlug,
    excerpt: item.excerpt || item.description || "",
    featured: Boolean(item.featured),
    bodyClass: item.bodyClass || "seo-guide-page blog-page cf-shell",
    includePinterest: item.includePinterest ?? true,
    schemaHeadline: item.schemaHeadline || item.articleTitle || item.title,
    schemaDescription: item.schemaDescription || item.description || item.excerpt,
    breadcrumbTitle: item.breadcrumbTitle || item.articleTitle || item.title,
    breadcrumbLabel: item.breadcrumbLabel || item.articleTitle || item.title,
    coverImageUrl: item.coverImageUrl || item.coverImage || "",
    bodyMarkdown,
    bodyHtml,
  };
}

function normalizeReleaseNote(item, source = "cms") {
  const slug = item.slug || item.id || slugify(item.version || item.title);
  const publishedAt = toDateOnly(item.publishedAt || item.date || "");
  const bodyMarkdown = item.bodyMarkdown || "";
  const bodyHtml = item.bodyHtml || renderMarkdownToHtml(bodyMarkdown);
  const category = item.category || item.type || "App Update";

  return {
    ...item,
    slug,
    status: item.status || "published",
    publishedAt,
    date: publishedAt,
    category,
    type: item.type || category,
    tags: normalizeArray(item.tags),
    highlights: normalizeArray(item.highlights),
    fixes: normalizeArray(item.fixes),
    improvements: normalizeArray(item.improvements),
    notes: normalizeArray(item.notes),
    summary: item.summary || item.description || item.excerpt || "",
    featured: Boolean(item.featured),
    isFeatured: Boolean(item.featured),
    bodyMarkdown,
    bodyHtml,
    canonical:
      item.canonical || `https://cognifocus.app/whats-new/${slug}.html`,
  };
}

async function loadLocalBlogPosts() {
  return (await getCollection("blog"))
    .map((entry) => ({ ...entry.data, id: entry.id.replace(/\.json$/, "") }))
    .filter(isPublishedLocalItem)
    .map((item) => normalizeBlogPost(item, "local"));
}

async function loadLocalReleaseNotes() {
  return (await getCollection("releases"))
    .map((entry) => ({ ...entry.data, id: entry.id.replace(/\.json$/, "") }))
    .filter(isPublishedLocalItem)
    .map((item) => normalizeReleaseNote(item, "local"));
}

export async function getPublishedBlogPosts() {
  blogPostsPromise ??= getCmsOrLocalItems("blog", loadLocalBlogPosts).then(
    ({ items, source }) => items.map((item) => normalizeBlogPost(item, source)),
  );

  return blogPostsPromise;
}

export async function getPublishedBlogPostBySlug(slug) {
  return (await getPublishedBlogPosts()).find((post) => post.slug === slug);
}

export async function getPublishedReleaseNotes() {
  releaseNotesPromise ??= getCmsOrLocalItems(
    "releases",
    loadLocalReleaseNotes,
  ).then(({ items, source }) =>
    items.map((item) => normalizeReleaseNote(item, source)),
  );

  return releaseNotesPromise;
}

export async function getPublishedReleaseNoteBySlug(slug) {
  return (await getPublishedReleaseNotes()).find(
    (release) => release.slug === slug,
  );
}
