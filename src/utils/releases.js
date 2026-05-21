import {
  getPublishedReleaseNoteBySlug,
  getPublishedReleaseNotes,
} from "./cms-content.js";

export const RELEASE_TYPES = [
  "app",
  "website",
  "shield",
  "goblin",
  "analytics",
  "security",
  "content",
];

const REQUIRED_STRING_FIELDS = [
  "title",
  "version",
  "publishedAt",
  "slug",
  "summary",
];

function isValidDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function validateRelease(release) {
  for (const field of REQUIRED_STRING_FIELDS) {
    if (!release[field] || typeof release[field] !== "string") {
      throw new Error(`Release entry is missing a valid "${field}" field.`);
    }
  }

  if (!isValidDate(release.publishedAt)) {
    throw new Error(`Release "${release.slug}" has an invalid publishedAt date.`);
  }

  release.type = RELEASE_TYPES.includes(release.type) ? release.type : "app";
}

export function normalizeRelease(entry) {
  const release = entry.data;
  validateRelease(release);

  return {
    ...release,
    date: release.publishedAt,
    category: release.category || release.type,
    isFeatured: Boolean(release.featured),
    tags: normalizeArray(release.tags),
    highlights: normalizeArray(release.highlights),
    fixes: normalizeArray(release.fixes),
    improvements: normalizeArray(release.improvements),
    notes: normalizeArray(release.notes),
  };
}

export async function getSortedReleases() {
  return (await getPublishedReleaseNotes())
    .map((release) => normalizeRelease({ data: release }))
    .sort(
      (a, b) =>
        b.publishedAt.localeCompare(a.publishedAt) ||
        b.version.localeCompare(a.version),
    );
}

export async function getReleaseBySlug(slug) {
  const release = await getPublishedReleaseNoteBySlug(slug);
  return release ? normalizeRelease({ data: release }) : undefined;
}

export async function getFeaturedReleases() {
  return (await getSortedReleases()).filter((release) => release.isFeatured);
}

export async function getReleaseTags(releases) {
  const entries = releases || (await getSortedReleases());
  return [...new Set(entries.flatMap((release) => release.tags))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export function formatReleaseDate(value) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function getReleaseDetailSections(release) {
  return [
    ["Highlights", release.highlights],
    ["Fixes", release.fixes],
    ["Improvements", release.improvements],
    ["Notes", release.notes],
  ]
    .map(([label, items]) => [label, normalizeArray(items)])
    .filter(([, items]) => items.length > 0);
}
