import { Buffer } from "node:buffer";

const DOUBLE_ENCODED_EM_DASH = String.fromCharCode(
  0x00c3,
  0x00a2,
  0x00e2,
  0x201a,
  0x00ac,
  0x00e2,
  0x20ac,
  0x009d,
);

const SINGLE_ENCODED_EM_DASH = String.fromCharCode(0x00e2, 0x20ac, 0x201d);
const SINGLE_ENCODED_EN_DASH = String.fromCharCode(0x00e2, 0x20ac, 0x201c);
const SINGLE_ENCODED_ELLIPSIS = String.fromCharCode(0x00e2, 0x20ac, 0x00a6);
const SINGLE_ENCODED_APOSTROPHE = String.fromCharCode(0x00e2, 0x20ac, 0x2122);
const DOUBLE_ENCODED_APOSTROPHE = String.fromCharCode(
  0x00c3,
  0x00a2,
  0x00e2,
  0x201a,
  0x00ac,
  0x00e2,
  0x201e,
  0x00a2,
);

function mojibakeScore(value) {
  return (
    (value.match(/[\u00c2\u00c3\u00e2]/g) || []).length * 2 +
    (value.match(/\uFFFD/g) || []).length * 3
  );
}

function decodeLikelyMojibake(value) {
  if (typeof value !== "string" || !/[\u00c2\u00c3\u00e2]/.test(value)) {
    return value;
  }

  let current = value;

  for (let index = 0; index < 2; index += 1) {
    const repaired = Buffer.from(current, "latin1").toString("utf8");

    if (mojibakeScore(repaired) >= mojibakeScore(current)) {
      break;
    }

    current = repaired;
  }

  return current;
}

export function normalizeBlogText(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }

  const { titleMode = false } = options;
  let normalized = decodeLikelyMojibake(value);

  normalized = normalized
    .replaceAll(DOUBLE_ENCODED_EM_DASH, " | ")
    .replaceAll(SINGLE_ENCODED_EM_DASH, " | ")
    .replaceAll(SINGLE_ENCODED_EN_DASH, " | ")
    .replaceAll(DOUBLE_ENCODED_APOSTROPHE, "'")
    .replaceAll(SINGLE_ENCODED_APOSTROPHE, "'")
    .replaceAll(SINGLE_ENCODED_ELLIPSIS, "...")
    .replace(/\u2026/g, "...")
    .replace(/\u2192/g, "->")
    .replace(/\u00a0/g, " ");

  if (titleMode) {
    normalized = normalized.replace(/\s*[\u2013\u2014]\s*/g, " | ");
    normalized = normalized.replace(/\s*\|\s*/g, " | ");
  }

  return normalized.replace(/[ \t]{2,}/g, " ").trim();
}

export function normalizeBlogTextFields(item) {
  if (!item || typeof item !== "object") {
    return item;
  }

  return {
    ...item,
    title: normalizeBlogText(item.title, { titleMode: true }),
    seoTitle: normalizeBlogText(item.seoTitle, { titleMode: true }),
    ogTitle: normalizeBlogText(item.ogTitle, { titleMode: true }),
    articleTitle: normalizeBlogText(item.articleTitle),
    description: normalizeBlogText(item.description),
    seoDescription: normalizeBlogText(item.seoDescription),
    ogDescription: normalizeBlogText(item.ogDescription),
    excerpt: normalizeBlogText(item.excerpt),
    schemaHeadline: normalizeBlogText(item.schemaHeadline),
    schemaDescription: normalizeBlogText(item.schemaDescription),
    breadcrumbTitle: normalizeBlogText(item.breadcrumbTitle),
    breadcrumbLabel: normalizeBlogText(item.breadcrumbLabel),
    bodyMarkdown: normalizeBlogText(item.bodyMarkdown),
    bodyHtml: normalizeBlogText(item.bodyHtml),
  };
}
