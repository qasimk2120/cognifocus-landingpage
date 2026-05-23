import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const resourceConfig = {
  blog: {
    endpoint: "listCmsBlogPosts",
    outputDir: join("src", "content", "blog"),
    payloadKeys: ["blog", "blogPosts", "posts"],
    fileKeys: ["slug", "id", "title"],
    fieldOrder: [
      "slug",
      "title",
      "articleTitle",
      "description",
      "canonical",
      "ogTitle",
      "ogDescription",
      "ogImage",
      "ogType",
      "displayDate",
      "category",
      "categorySlug",
      "tags",
      "excerpt",
      "bodyClass",
      "hasBlogCss",
      "includePinterest",
      "schemaHeadline",
      "schemaDescription",
      "breadcrumbTitle",
      "breadcrumbLabel",
      "bodyMarkdown",
      "bodyHtml",
      "publishedAt",
      "updatedAt",
      "featured",
      "coverImage",
      "seoTitle",
      "seoDescription",
    ],
  },
  releases: {
    endpoint: "listCmsReleaseNotes",
    outputDir: join("src", "content", "releases"),
    payloadKeys: ["releases", "releaseNotes", "notes"],
    fileKeys: ["slug", "id", "version", "title"],
    fieldOrder: [
      "title",
      "version",
      "slug",
      "summary",
      "type",
      "category",
      "tags",
      "highlights",
      "fixes",
      "improvements",
      "notes",
      "publishedAt",
      "featured",
    ],
  },
};

const selectedResources = new Set(
  process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith("--")),
);
const prune = process.argv.includes("--prune");
const dryRun = process.argv.includes("--dry-run");

function parseEnvFile(content) {
  const entries = {};

  for (const line of content.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    entries[key] = value;
  }

  return entries;
}

async function loadDotEnv() {
  try {
    const content = await readFile(".env", "utf8");
    const entries = parseEnvFile(content);

    for (const [key, value] of Object.entries(entries)) {
      process.env[key] ??= value;
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
}

function trimTrailingSlash(value) {
  return String(value || "").trim().replace(/\/+$/u, "");
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/['"]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

function toDateOnly(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/u.test(trimmed)) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString().slice(0, 10);
  }

  const seconds = value.seconds ?? value._seconds;
  const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0;

  if (typeof seconds === "number") {
    const parsed = new Date(
      (seconds * 1000) + Math.floor(Number(nanoseconds || 0) / 1000000),
    );
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
  }

  return "";
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/u)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizePayload(payload, config, resource) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.[resource])) {
    return payload[resource];
  }

  for (const key of config.payloadKeys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

function orderFields(item, fieldOrder) {
  const ordered = {};

  for (const key of fieldOrder) {
    if (item[key] !== undefined && item[key] !== "" && item[key] !== null) {
      ordered[key] = item[key];
    }
  }

  for (const key of Object.keys(item).sort()) {
    if (!(key in ordered) && item[key] !== undefined && item[key] !== "" && item[key] !== null) {
      ordered[key] = item[key];
    }
  }

  return ordered;
}

function normalizeBlogItem(item) {
  const slug = item.slug || item.id || slugify(item.title);
  const publishedAt = toDateOnly(item.publishedAt || item.publishDate || item.date);
  const updatedAt = toDateOnly(item.updatedAt || item.updatedDate || publishedAt);

  return {
    ...item,
    slug,
    title: item.seoTitle || item.title,
    articleTitle: item.articleTitle || item.title,
    description: item.description || item.excerpt || item.seoDescription || "",
    canonical: item.canonical || `https://cognifocus.app/blog/${slug}.html`,
    ogTitle: item.ogTitle || item.seoTitle || item.title,
    ogDescription: item.ogDescription || item.seoDescription || item.description || item.excerpt,
    category: item.category || "Focus Guides",
    categorySlug: item.categorySlug || slugify(item.category || "Focus Guides"),
    tags: normalizeArray(item.tags),
    bodyClass: item.bodyClass || "seo-guide-page blog-page cf-shell",
    includePinterest: item.includePinterest ?? true,
    publishedAt,
    updatedAt,
    featured: Boolean(item.featured),
  };
}

function normalizeReleaseItem(item) {
  const slug = item.slug || item.id || slugify(item.version || item.title);

  return {
    ...item,
    slug,
    title: item.title || item.version || slug,
    version: item.version || slug,
    summary: item.summary || item.description || item.excerpt || "",
    type: item.type || item.category || "app",
    category: item.category || item.type || "App Update",
    tags: normalizeArray(item.tags),
    highlights: normalizeArray(item.highlights),
    fixes: normalizeArray(item.fixes),
    improvements: normalizeArray(item.improvements),
    notes: normalizeArray(item.notes),
    publishedAt: toDateOnly(item.publishedAt || item.date),
    featured: Boolean(item.featured),
  };
}

function normalizeItem(resource, item) {
  return resource === "blog" ? normalizeBlogItem(item) : normalizeReleaseItem(item);
}

function getFileSlug(item, config) {
  for (const key of config.fileKeys) {
    if (item[key]) {
      return slugify(item[key]);
    }
  }

  return "";
}

async function fetchItems(resource, config, baseUrl, token) {
  const url = new URL(`${baseUrl}/${config.endpoint}`);
  url.searchParams.set("status", "published");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    throw new Error(
      payload?.message ||
        payload?.error ||
        `${resource} CMS fetch failed with HTTP ${response.status}.`,
    );
  }

  return normalizePayload(payload, config, resource)
    .filter((item) => !item?.status || String(item.status).toLowerCase() === "published")
    .map((item) => normalizeItem(resource, item));
}

async function writeResource(resource, config, items) {
  const written = new Set();

  await mkdir(config.outputDir, { recursive: true });

  for (const item of items) {
    const slug = getFileSlug(item, config);

    if (!slug) {
      throw new Error(`Cannot derive ${resource} filename for item "${item.title || item.id}".`);
    }

    const filePath = join(config.outputDir, `${slug}.json`);
    const content = `${JSON.stringify(orderFields(item, config.fieldOrder), null, 2)}\n`;
    written.add(basename(filePath));

    if (dryRun) {
      console.log(`[dry-run] write ${filePath}`);
      continue;
    }

    await writeFile(filePath, content, "utf8");
  }

  if (prune) {
    const existingFiles = (await readdir(config.outputDir)).filter((file) => file.endsWith(".json"));

    for (const file of existingFiles) {
      if (written.has(file)) {
        continue;
      }

      const filePath = join(config.outputDir, file);

      if (dryRun) {
        console.log(`[dry-run] delete ${filePath}`);
        continue;
      }

      await unlink(filePath);
    }
  }

  console.log(
    `${dryRun ? "Would sync" : "Synced"} ${items.length} ${resource} item(s) to ${config.outputDir}${prune ? " with pruning" : ""}.`,
  );
}

async function main() {
  await loadDotEnv();

  const baseUrl = trimTrailingSlash(
    process.env.CMS_FUNCTION_BASE_URL || process.env.PUBLIC_CMS_FUNCTION_BASE_URL,
  );
  const token = String(process.env.CMS_BUILD_AUTH_TOKEN || "").trim();

  if (!baseUrl) {
    throw new Error("CMS_FUNCTION_BASE_URL or PUBLIC_CMS_FUNCTION_BASE_URL is required.");
  }

  if (!token) {
    throw new Error("CMS_BUILD_AUTH_TOKEN is required.");
  }

  const resources = Object.entries(resourceConfig).filter(
    ([resource]) => selectedResources.size === 0 || selectedResources.has(resource),
  );

  if (resources.length === 0) {
    throw new Error("No matching resources selected. Use blog, releases, or no resource for both.");
  }

  const fetched = [];

  for (const [resource, config] of resources) {
    const items = await fetchItems(resource, config, baseUrl, token);
    fetched.push([resource, config, items]);
  }

  for (const [resource, config, items] of fetched) {
    await writeResource(resource, config, items);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
