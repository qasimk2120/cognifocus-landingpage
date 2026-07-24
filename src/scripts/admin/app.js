import { CmsAccessDeniedError } from "./api.js";
import {
  archiveCmsItem,
  createCmsItem,
  getCmsItem,
  listCmsItems,
  normalizeCmsDateValue,
  updateCmsItem,
} from "./api.js";
import { clearAdminSession, logoutAdmin, requireAdminUser } from "./auth.js";

const root = document.querySelector("[data-admin-root]");
const session = document.querySelector("[data-admin-session]");
const alertBox = document.querySelector("[data-admin-alert]");
const denied = document.querySelector("[data-admin-denied]");
const view = document.querySelector("[data-admin-view]");
const adminNav = document.querySelector("[data-admin-auth-nav]");
const IMAGE_PATH_MAX_LENGTH = 2048;
const IMAGE_HELPER_TEXT =
  "Upload images manually to public/blog/images for now, then paste the path here.";
const SITE_ORIGIN = "https://cognifocus.app";
const GITHUB_ACTIONS_WORKFLOW_URL =
  "https://github.com/qasimk2120/cognifocus-landingpage/actions/workflows/deploy.yml";
const CMS_DEPLOY_METADATA_KEY = "__cmsDeploy";
const distributionCopyCache = new Map();
const distributionIntegrations = [
  {
    title: "Medium",
    description: "Draft export is ready. API publishing and OAuth can be added later.",
  },
  {
    title: "Pinterest",
    description: "Title and description helpers are ready. Board publishing can come later.",
  },
  {
    title: "Meta Business Suite",
    description: "Facebook and Instagram planning stays separate from content editing.",
  },
  {
    title: "Product Hunt",
    description: "Launch copy can be prepared here when Product Hunt assets are ready.",
  },
];

const resources = {
  blog: {
    singular: "blog post",
    plural: "blog posts",
    basePath: "/admin/blog",
    editPath: "/admin/blog/edit",
    newPath: "/admin/blog/new",
    idLabel: "slug",
    publicPath: (item) => `/blog/${encodeURIComponent(item.slug)}.html`,
    fields: [
      ["title", "Title", "text", true],
      ["slug", "Slug", "text", true],
      ["description", "Description", "textarea", true],
      ["excerpt", "Excerpt", "textarea"],
      ["bodyMarkdown", "Body markdown", "textarea"],
      ["category", "Category", "text"],
      ["tags", "Tags", "text"],
      ["coverImageUrl", "Cover image URL/path", "text"],
      ["seoTitle", "SEO title", "text"],
      ["seoDescription", "SEO description", "textarea"],
      ["canonical", "Canonical URL", "url"],
      ["featured", "Featured", "checkbox"],
      ["status", "Status", "select"],
      ["publishedAt", "Published at", "datetime-local"],
      ["instagramCaption", "Instagram caption", "textarea"],
      ["facebookCaption", "Facebook caption", "textarea"],
      ["pinterestTitle", "Pinterest title", "text"],
      ["pinterestDescription", "Pinterest description", "textarea"],
      ["mediumCanonicalUrl", "Medium canonical URL", "url"],
      ["publishTargets", "Publish targets", "text"],
    ],
  },
  releases: {
    singular: "release note",
    plural: "release notes",
    basePath: "/admin/releases",
    editPath: "/admin/releases/edit",
    newPath: "/admin/releases/new",
    idLabel: "slug",
    publicPath: (item) => `/whats-new/${encodeURIComponent(item.slug)}.html`,
    fields: [
      ["title", "Title", "text", true],
      ["slug", "Slug", "text", true],
      ["version", "Version", "text", true],
      ["summary", "Summary", "textarea", true],
      ["bodyMarkdown", "Body markdown", "textarea"],
      ["category", "Category", "text"],
      ["highlights", "Highlights", "textarea"],
      ["fixes", "Fixes", "textarea"],
      ["improvements", "Improvements", "textarea"],
      ["featured", "Featured", "checkbox"],
      ["status", "Status", "select"],
      ["publishedAt", "Published at", "datetime-local"],
      ["instagramCaption", "Instagram caption", "textarea"],
      ["facebookCaption", "Facebook caption", "textarea"],
      ["pinterestTitle", "Pinterest title", "text"],
      ["pinterestDescription", "Pinterest description", "textarea"],
      ["mediumCanonicalUrl", "Medium canonical URL", "url"],
      ["publishTargets", "Publish targets", "text"],
    ],
  },
};

const state = {
  resource: root?.dataset.resource || "",
  mode: root?.dataset.mode || "dashboard",
  itemId: root?.dataset.itemId || "",
  saving: false,
};

if (state.mode === "edit" && !state.itemId) {
  const queryId = new URLSearchParams(window.location.search).get("id");

  if (queryId) {
    state.itemId = queryId;
  } else {
    const pathParts = window.location.pathname.replace(/\/$/, "").split("/");
    const pathId = pathParts[pathParts.length - 1] || "";
    state.itemId = decodeURIComponent(pathId.replace(/\.html$/, ""));
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeDateTimeValue(value) {
  const normalizedValue = normalizeCmsDateValue(value);

  if (!normalizedValue || typeof normalizedValue !== "string") {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalizedValue)) {
    const date = new Date(normalizedValue);

    if (Number.isNaN(date.getTime())) {
      return normalizedValue.slice(0, 16);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return `${normalizedValue}T09:00`;
  }

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function todayDateTime() {
  return new Date().toISOString().slice(0, 16);
}

function setAlert(message, type = "info") {
  if (!alertBox) {
    return;
  }

  alertBox.hidden = !message;
  alertBox.textContent = message || "";
  alertBox.dataset.type = type;
}

function setAlertHtml(html, type = "info") {
  if (!alertBox) {
    return;
  }

  alertBox.hidden = !html;
  alertBox.innerHTML = html || "";
  alertBox.dataset.type = type;
}

function setDenied(message) {
  if (adminNav) {
    adminNav.hidden = true;
  }

  if (view) {
    view.hidden = true;
  }

  if (denied) {
    denied.hidden = false;
    const text = denied.querySelector("p");

    if (text && message) {
      text.textContent = message;
    }
  }
}

function getItemId(item) {
  return item.id || item.slug || item.key || "";
}

function getEditHref(resource, item) {
  const config = resources[resource];
  const id = getItemId(item);

  return id
    ? `${config.editPath}?id=${encodeURIComponent(id)}`
    : config.editPath;
}

function getPublicHref(resource, item) {
  const config = resources[resource];
  const slug = String(item?.slug || "").trim();

  if (!config?.publicPath || item?.status !== "published" || !slug) {
    return "";
  }

  return config.publicPath({ ...item, slug });
}

function getPublicPathPreview(resource, slug) {
  const config = resources[resource];
  const normalizedSlug = String(slug || "").trim();

  if (!config?.publicPath) {
    return "";
  }

  return normalizedSlug
    ? config.publicPath({ slug: normalizedSlug })
    : config.publicPath({ slug: "{slug}" });
}

function toInputValue(name, value) {
  if (name === "featured") {
    return Boolean(value);
  }

  if (name === "tags" || name === "publishTargets") {
    return Array.isArray(value) ? value.join(", ") : value || "";
  }

  if (name === "highlights" || name === "fixes" || name === "improvements") {
    return Array.isArray(value) ? value.join("\n") : value || "";
  }

  if (name === "publishedAt") {
    return normalizeDateTimeValue(value);
  }

  return value || "";
}

function renderField([name, label, type, required], item = {}) {
  const value = toInputValue(name, item[name]);
  const requiredAttribute = required ? " required" : "";
  const helperText =
    name === "coverImageUrl" || name === "bodyMarkdown"
      ? `<span class="admin-helper-text">${IMAGE_HELPER_TEXT}</span>`
      : "";
  const imagePathMaxLength =
    name === "coverImageUrl" ? ` maxlength="${IMAGE_PATH_MAX_LENGTH}"` : "";

  if (name === "publishedAt") {
    const status = String(item.status || "").toLowerCase();
    const isPublished = status === "published";
    const publishedLabel = value
      ? normalizeDateTimeValue(value)
      : "";
    const publishedHint = isPublished
      ? "Set automatically when this item was first published."
      : "Required for scheduled posts. Pick a future date and time.";

    if (isPublished) {
      return `
      <label>
        ${label}
        <input type="datetime-local" name="${name}" value="${escapeHtml(
          publishedLabel,
        )}" readonly disabled />
        <span class="admin-helper-text">${publishedHint}</span>
      </label>
    `;
    }

    return `
      <label>
        ${label}
        <input type="datetime-local" name="${name}" value="${escapeHtml(
          publishedLabel || todayDateTime(),
        )}" />
        <span class="admin-helper-text">${publishedHint}</span>
      </label>
    `;
  }

  if (type === "select") {
    const current = value || "draft";

    return `
      <label>
        ${label}
        <select name="${name}"${requiredAttribute}>
          ${["draft", "scheduled", "published", "archived"]
            .map(
              (option) =>
                `<option value="${option}"${
                  current === option ? " selected" : ""
                }>${option}</option>`,
            )
            .join("")}
        </select>
      </label>
    `;
  }

  if (type === "checkbox") {
    return `
      <label class="admin-checkbox-field">
        <input type="checkbox" name="${name}"${value ? " checked" : ""} />
        <span>
          ${label}
          <small>Feature this item in public content surfaces.</small>
        </span>
      </label>
    `;
  }

  if (type === "textarea") {
    const isMarkdown = name === "bodyMarkdown";

    return `
      <label class="${isMarkdown ? "admin-field-wide" : ""}">
        ${label}
        <textarea name="${name}" rows="${isMarkdown ? 14 : 4}"${requiredAttribute}>${escapeHtml(
          value,
        )}</textarea>
        ${helperText}
      </label>
    `;
  }

  return `
    <label>
      ${label}
      <input type="${type}" name="${name}" value="${escapeHtml(
        value,
      )}"${requiredAttribute}${imagePathMaxLength} />
      ${helperText}
    </label>
  `;
}

function renderSlugControls(resource, item = {}) {
  const slug = toInputValue("slug", item.slug);
  const previewPath = getPublicPathPreview(resource, slug);

  return `
    <section class="admin-slug-panel admin-field-wide" data-slug-panel>
      <div class="admin-slug-preview">
        <div>
          <span>Public URL</span>
          <code data-public-url-preview>${escapeHtml(previewPath)}</code>
        </div>
        <button type="button" class="admin-button admin-button-small" data-slug-toggle aria-expanded="false">
          Advanced slug
        </button>
      </div>
      <div class="admin-slug-advanced" data-slug-advanced hidden>
        <label>
          Slug
          <input type="text" name="slug" value="${escapeHtml(slug)}" data-slug-input />
          <span class="admin-helper-text">Changing this after publishing changes the public URL.</span>
        </label>
      </div>
    </section>
  `;
}

function renderDashboard() {
  view.innerHTML = `
    <div class="admin-grid admin-grid-two">
      <a class="admin-card-link" href="/admin/blog">
        <strong>Blog</strong>
        <span>List, draft, publish, and archive blog posts.</span>
      </a>
      <a class="admin-card-link" href="/admin/releases">
        <strong>Releases</strong>
        <span>Manage release notes and update announcements.</span>
      </a>
      <a class="admin-card-link" href="/admin/distribution">
        <strong>Distribution</strong>
        <span>Prepare published content for social and media channels.</span>
      </a>
    </div>
  `;
}

function getDisplayDate(item) {
  return item.publishedAt || item.updatedAt || item.createdAt || "";
}

function formatDisplayDate(value) {
  const normalizedValue = normalizeCmsDateValue(value);

  if (!normalizedValue || typeof normalizedValue !== "string") {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return normalizedValue;
  }

  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return normalizedValue;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function renderFeaturedBadge(item) {
  return item.featured
    ? `<span class="admin-featured-badge">Featured</span>`
    : `<span class="admin-featured-muted">No</span>`;
}

function getDeployMetadata(item) {
  return item?.[CMS_DEPLOY_METADATA_KEY] || null;
}

function getDeployMetadataUrl(metadata) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }

  return normalizeExternalUrl(
    metadata.workflowRunUrl ||
    metadata.runUrl ||
    metadata.htmlUrl ||
    metadata.workflowUrl ||
    metadata.url ||
    "",
  );
}

function normalizeExternalUrl(value) {
  const rawUrl = String(value || "").trim();

  if (!rawUrl) {
    return "";
  }

  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function formatDeployMetadataValue(value) {
  if (value === true) {
    return "yes";
  }

  if (value === false) {
    return "no";
  }

  if (value == null) {
    return "";
  }

  if (typeof value === "object") {
    return "";
  }

  return String(value).trim();
}

function formatDeployMetadata(metadata) {
  if (!metadata) {
    return "";
  }

  if (typeof metadata === "string") {
    return metadata.trim();
  }

  if (typeof metadata === "boolean") {
    return metadata ? "Deploy trigger reported." : "Deploy trigger was not reported as started.";
  }

  if (typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }

  const entries = [
    ["Message", metadata.message],
    ["Triggered", metadata.deployTriggered ?? metadata.rebuildTriggered ?? metadata.workflowDispatched],
    ["Workflow", metadata.workflowName ?? metadata.workflowId],
    ["Run", metadata.workflowRunId ?? metadata.runId],
    ["Ref", metadata.ref],
    ["SHA", typeof metadata.sha === "string" ? metadata.sha.slice(0, 7) : metadata.sha],
  ]
    .map(([label, value]) => [label, formatDeployMetadataValue(value)])
    .filter(([, value]) => value);

  return entries.map(([label, value]) => `${label}: ${value}`).join(" · ");
}

function renderDeployFeedback(item) {
  const metadata = getDeployMetadata(item);
  const metadataText = formatDeployMetadata(metadata);
  const metadataUrl = getDeployMetadataUrl(metadata);
  const runLink = metadataUrl
    ? ` <a href="${escapeHtml(metadataUrl)}" target="_blank" rel="noopener">Open run</a>`
    : "";

  return `
    <span>Saved. Site rebuild should start shortly.</span>
    <a href="${GITHUB_ACTIONS_WORKFLOW_URL}" target="_blank" rel="noopener">GitHub Actions</a>
    ${
      metadataText || runLink
        ? `<small class="admin-deploy-meta">${escapeHtml(metadataText)}${runLink}</small>`
        : ""
    }
  `;
}

function setInlineSuccessWithDeploy(message, item) {
  message.innerHTML = renderDeployFeedback(item);
  message.dataset.type = "success";
}

function renderViewAction(resource, item, size = "small") {
  const href = getPublicHref(resource, item);
  const sizeClass = size === "small" ? " admin-button-small" : "";

  if (!href) {
    return `<span class="admin-button${sizeClass} admin-button-muted" aria-disabled="true" data-public-view-action>View</span>`;
  }

  return `<a class="admin-button${sizeClass}" href="${href}" target="_blank" rel="noopener" data-public-view-action>View</a>`;
}

function getAbsoluteUrl(href) {
  if (!href) {
    return "";
  }

  try {
    return new URL(href, SITE_ORIGIN).href;
  } catch {
    return href;
  }
}

function getDistributionStatus(item) {
  const status = String(item?.status || "").trim().toLowerCase();

  if (status) {
    return status;
  }

  return item?.publishedAt || item?.publishDate ? "published" : "draft";
}

function getDistributionPublicHref(resource, item) {
  const config = resources[resource];
  const slug = String(item?.slug || "").trim();

  if (!config?.publicPath || getDistributionStatus(item) !== "published" || !slug) {
    return "";
  }

  return config.publicPath({ ...item, slug });
}

function getCanonicalHref(resource, item) {
  return getAbsoluteUrl(item?.canonical || getDistributionPublicHref(resource, item));
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function limitText(value, maxLength) {
  const text = normalizeText(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map(normalizeText).filter(Boolean);
  }

  return String(tags || "")
    .split(",")
    .map(normalizeText)
    .filter(Boolean);
}

function tagToHashtag(tag) {
  const normalized = normalizeText(tag)
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z0-9]/gi, ""))
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join("");

  return normalized ? `#${normalized}` : "";
}

function buildHashtags(tags, limit = 3) {
  return normalizeTags(tags)
    .slice(0, limit)
    .map(tagToHashtag)
    .filter(Boolean)
    .join(" ");
}

function getDistributionFields(resource, item) {
  const title = normalizeText(item.title || item.articleTitle || item.version || item.slug);
  const excerpt = normalizeText(item.excerpt || item.summary || item.description);
  const seoDescription = normalizeText(
    item.seoDescription || item.ogDescription || item.description || item.summary || excerpt,
  );
  const category = normalizeText(item.category || item.type || (resource === "blog" ? "Blog" : "Release Notes"));
  const canonicalUrl = getCanonicalHref(resource, item);

  return {
    title,
    excerpt,
    seoDescription,
    category,
    tags: normalizeTags(item.tags),
    canonicalUrl,
    publicUrl: getAbsoluteUrl(getDistributionPublicHref(resource, item)),
  };
}

function buildPlatformCopy(resource, item) {
  const fields = getDistributionFields(resource, item);
  const summary = fields.seoDescription || fields.excerpt;
  const hashtags = buildHashtags(fields.tags);
  let xPost = [
    limitText(fields.title, 90),
    limitText(summary, 130),
    fields.canonicalUrl,
    hashtags,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (xPost.length > 280) {
    xPost = [
      limitText(fields.title, 100),
      fields.canonicalUrl,
      hashtags,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return {
    x: xPost.length > 280 ? xPost.slice(0, 277).trimEnd() + "..." : xPost,
    linkedin: [
      fields.title,
      summary,
      fields.canonicalUrl ? `Read it here: ${fields.canonicalUrl}` : "",
      hashtags,
    ]
      .filter(Boolean)
      .join("\n\n"),
    pinterestTitle: limitText(fields.title, 100),
    pinterestDescription: limitText(
      [summary, fields.canonicalUrl, hashtags].filter(Boolean).join(" "),
      500,
    ),
    mediumDraft: [
      `# ${fields.title}`,
      summary,
      fields.canonicalUrl ? `Originally published at ${fields.canonicalUrl}` : "",
      fields.tags.length ? `Tags: ${fields.tags.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

function renderCopyButton(copyId, label) {
  return `<button type="button" class="admin-button admin-button-small" data-copy-id="${escapeHtml(
    copyId,
  )}">${label}</button>`;
}

function renderDistributionPlaceholders() {
  return `
    <section class="admin-distribution-section" aria-label="Future integrations">
      <div class="admin-section-heading">
        <h2>Future integrations</h2>
        <p>Placeholders only. Posting, OAuth, and scheduling are intentionally not wired yet.</p>
      </div>
      <div class="admin-integration-grid">
        ${distributionIntegrations
          .map(
            (integration) => `
              <article class="admin-integration-card">
                <h3>${escapeHtml(integration.title)}</h3>
                <p>${escapeHtml(integration.description)}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function toDistributionRow(resource, item, index) {
  const status = getDistributionStatus(item);

  if (status !== "published") {
    return "";
  }

  const fields = getDistributionFields(resource, item);
  const copy = buildPlatformCopy(resource, item);
  const slug = item.slug || getItemId(item);
  const publicHref = getDistributionPublicHref(resource, item);
  const canonicalHref = getCanonicalHref(resource, item);
  const copyPrefix = `${resource}-${index}`;

  for (const [key, value] of Object.entries(copy)) {
    distributionCopyCache.set(`${copyPrefix}-${key}`, value);
  }

  return `
    <tr>
      <td>
        <strong>${escapeHtml(fields.title || "Untitled")}</strong>
        <span>${resource === "blog" ? "Blog post" : "Release note"}</span>
      </td>
      <td>
        <code>${escapeHtml(slug || "")}</code>
        <span>${escapeHtml(publicHref || canonicalHref || "")}</span>
      </td>
      <td>${escapeHtml(formatDisplayDate(getDisplayDate(item)) || "Not set")}</td>
      <td>${escapeHtml(fields.category || "Uncategorized")}</td>
      <td><span class="admin-status admin-status-published">Published</span></td>
      <td>
        <div class="admin-distribution-actions">
          ${renderCopyButton(`${copyPrefix}-x`, "Copy X post")}
          ${renderCopyButton(`${copyPrefix}-linkedin`, "Copy LinkedIn post")}
          ${renderCopyButton(`${copyPrefix}-pinterestTitle`, "Copy Pinterest title")}
          ${renderCopyButton(`${copyPrefix}-pinterestDescription`, "Copy Pinterest description")}
          ${renderCopyButton(`${copyPrefix}-mediumDraft`, "Copy Medium draft")}
          ${
            publicHref
              ? `<a class="admin-button admin-button-small" href="${escapeHtml(publicHref)}" target="_blank" rel="noopener">Open public page</a>`
              : `<span class="admin-button admin-button-small admin-button-muted" aria-disabled="true">Open public page</span>`
          }
          ${
            canonicalHref
              ? `<a class="admin-button admin-button-small" href="${escapeHtml(canonicalHref)}" target="_blank" rel="noopener">Open canonical URL</a>`
              : `<span class="admin-button admin-button-small admin-button-muted" aria-disabled="true">Open canonical URL</span>`
          }
        </div>
      </td>
    </tr>
  `;
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function bindDistributionCopyActions() {
  view.querySelectorAll("[data-copy-id]").forEach((button) => {
    const originalLabel = button.textContent;

    button.addEventListener("click", async () => {
      const copyText = distributionCopyCache.get(button.dataset.copyId) || "";

      if (!copyText) {
        setAlert("No generated copy was available for that action.", "error");
        return;
      }

      try {
        await copyTextToClipboard(copyText);
        button.textContent = "Copied";
        setAlert("Distribution copy added to clipboard.", "success");
        window.setTimeout(() => {
          button.textContent = originalLabel;
        }, 1400);
      } catch {
        setAlert("Clipboard copy failed in this browser.", "error");
      }
    });
  });
}

async function renderDistribution() {
  distributionCopyCache.clear();
  view.innerHTML = `<div class="admin-loading">Loading distribution items...</div>`;

  const [blogItems, releaseItems] = await Promise.all([
    listCmsItems("blog"),
    listCmsItems("releases"),
  ]);
  const rows = [
    ...blogItems.map((item, index) => ({ resource: "blog", item, index })),
    ...releaseItems.map((item, index) => ({ resource: "releases", item, index })),
  ]
    .filter(({ item }) => getDistributionStatus(item) === "published")
    .sort((left, right) => {
      const leftTime = new Date(normalizeCmsDateValue(getDisplayDate(left.item)) || 0).getTime();
      const rightTime = new Date(normalizeCmsDateValue(getDisplayDate(right.item)) || 0).getTime();
      return (Number.isNaN(rightTime) ? 0 : rightTime) - (Number.isNaN(leftTime) ? 0 : leftTime);
    });

  view.innerHTML = `
    <div class="admin-list-toolbar">
      <div>
        <h2>Distribution queue</h2>
        <p>${rows.length} published ${rows.length === 1 ? "item" : "items"} ready for social and media prep</p>
      </div>
    </div>
    ${
      rows.length === 0
        ? `<div class="admin-empty">No published blog posts or release notes are ready for distribution.</div>`
        : `
          <div class="admin-table-wrap admin-distribution-table-wrap">
            <table class="admin-table admin-distribution-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug / URL</th>
                  <th>Publish date</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rows
                  .map(({ resource, item, index }) => toDistributionRow(resource, item, index))
                  .join("")}
              </tbody>
            </table>
          </div>
        `
    }
    ${renderDistributionPlaceholders()}
  `;

  bindDistributionCopyActions();
}

async function renderList(resource) {
  const config = resources[resource];

  view.innerHTML = `<div class="admin-loading">Loading ${config.plural}...</div>`;

  const items = await listCmsItems(resource);

  view.innerHTML = `
    <div class="admin-list-toolbar">
      <div>
        <h2>${config.plural[0].toUpperCase()}${config.plural.slice(1)}</h2>
        <p>${items.length} ${items.length === 1 ? config.singular : config.plural}</p>
      </div>
      <a class="admin-button admin-button-primary" href="${config.newPath}">New</a>
    </div>
    ${
      items.length === 0
        ? `<div class="admin-empty">No ${config.plural} yet.</div>`
        : `
          <div class="admin-table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Published</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${items
                  .map((item) => {
                    const id = getItemId(item);
                    return `
                      <tr>
                        <td>
                          <strong>${escapeHtml(item.title || item.slug || id || "Untitled")}</strong>
                          <span>${escapeHtml(item.slug || id || "")}</span>
                        </td>
                        <td><span class="admin-status admin-status-${escapeHtml(item.status || "draft")}">${escapeHtml(
                          item.status || "draft",
                        )}</span></td>
                        <td>${renderFeaturedBadge(item)}</td>
                        <td>${escapeHtml(formatDisplayDate(getDisplayDate(item)) || "Not set")}</td>
                        <td>
                          <div class="admin-row-actions">
                            ${renderViewAction(resource, item)}
                            <a class="admin-button admin-button-small" href="${getEditHref(
                              resource,
                              item,
                            )}">Edit</a>
                            ${
                              id
                                ? `<button type="button" class="admin-button admin-button-small" data-archive-id="${escapeHtml(
                                    id,
                                  )}">Archive</button>`
                                : ""
                            }
                          </div>
                        </td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        `
    }
  `;

  view.querySelectorAll("[data-archive-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      if (state.saving) {
        return;
      }

      const id = button.dataset.archiveId;
      state.saving = true;
      button.disabled = true;
      setAlert(`Archiving ${config.singular}...`);

      try {
        const archived = await archiveCmsItem(resource, id);
        setAlertHtml(renderDeployFeedback(archived), "success");
        await renderList(resource);
      } catch (error) {
        handleError(error);
      } finally {
        state.saving = false;
        button.disabled = false;
      }
    });
  });
}

function readArrayFromTextarea(formData, name) {
  return String(formData.get(name) || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readCommaList(formData, name) {
  return String(formData.get(name) || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readPayload(form, resource, requestedStatus) {
  const formData = new FormData(form);
  const payload = {};

  for (const [name] of resources[resource].fields) {
    const element = form.elements[name];

    if (name === "publishedAt") {
      if (requestedStatus === "published" || requestedStatus === "draft") {
        continue;
      }

      const raw = String(formData.get(name) || "").trim();

      if (raw) {
        payload[name] = new Date(raw).toISOString();
      }

      continue;
    }

    if (name === "featured") {
      payload[name] = Boolean(element?.checked);
    } else if (["tags", "publishTargets"].includes(name)) {
      payload[name] = readCommaList(formData, name);
    } else if (["highlights", "fixes", "improvements"].includes(name)) {
      payload[name] = readArrayFromTextarea(formData, name);
    } else {
      payload[name] = String(formData.get(name) || "").trim();
    }
  }

  payload.status = requestedStatus || payload.status || "draft";

  return payload;
}

function getImagePathLengthError(payload) {
  const coverImageUrl = payload.coverImageUrl || "";

  if (coverImageUrl.length > IMAGE_PATH_MAX_LENGTH) {
    return `Cover image URL/path must be ${IMAGE_PATH_MAX_LENGTH} characters or fewer.`;
  }

  return "";
}

function syncSlug(form) {
  const title = form.elements.title;
  const slug = form.elements.slug;
  const preview = form.querySelector("[data-public-url-preview]");
  const toggle = form.querySelector("[data-slug-toggle]");
  const advanced = form.querySelector("[data-slug-advanced]");

  const updatePreview = () => {
    if (preview && slug) {
      preview.textContent = getPublicPathPreview(state.resource, slug.value);
    }
  };

  if (toggle && advanced) {
    toggle.addEventListener("click", () => {
      const isOpen = !advanced.hidden;
      advanced.hidden = isOpen;
      toggle.setAttribute("aria-expanded", String(!isOpen));
      toggle.textContent = isOpen ? "Advanced slug" : "Hide slug";

      if (isOpen) {
        return;
      }

      slug?.focus();
    });
  }

  if (!title || !slug) {
    updatePreview();
    return;
  }

  let slugTouched = Boolean(slug.value);

  slug.addEventListener("input", () => {
    slugTouched = true;
    slug.value = slugify(slug.value);
    updatePreview();
  });

  title.addEventListener("input", () => {
    if (!slugTouched) {
      slug.value = slugify(title.value);
      updatePreview();
    }
  });

  updatePreview();
}

function setFormLoading(form, isLoading) {
  for (const element of form.elements) {
    element.disabled = isLoading;
  }
}

async function renderForm(resource, mode, item = {}) {
  const config = resources[resource];
  const isEdit = mode === "edit";

  view.innerHTML = `
    <form class="admin-form admin-editor" data-admin-editor>
      <div class="admin-form-grid">
        ${renderSlugControls(resource, item)}
        ${config.fields
          .filter(([name]) => name !== "slug")
          .map((field) => renderField(field, item))
          .join("")}
      </div>
      <div class="admin-editor-actions">
        <a class="admin-button" href="${config.basePath}">Back</a>
        ${renderViewAction(resource, item, "normal")}
        <button type="submit" class="admin-button" data-save-status="draft">Save Draft</button>
        <button type="submit" class="admin-button" data-save-status="scheduled">Schedule</button>
        <button type="submit" class="admin-button admin-button-primary" data-save-status="published">Publish</button>
        ${
          isEdit
            ? `<button type="submit" class="admin-button admin-button-danger" data-save-status="archived">Archive</button>`
            : ""
        }
      </div>
      <p class="admin-form-message" data-editor-message role="status"></p>
    </form>
  `;

  const form = view.querySelector("[data-admin-editor]");
  const message = view.querySelector("[data-editor-message]");

  syncSlug(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (state.saving) {
      return;
    }

    const submitter = event.submitter;
    const requestedStatus = submitter?.dataset.saveStatus || "draft";
    const payload = readPayload(form, resource, requestedStatus);

    if (!payload.title || !payload.slug) {
      message.textContent = "Title and slug are required.";
      message.dataset.type = "error";
      return;
    }

    const imagePathLengthError = getImagePathLengthError(payload);

    if (imagePathLengthError) {
      message.textContent = imagePathLengthError;
      message.dataset.type = "error";
      return;
    }

    if (requestedStatus === "scheduled") {
      const publishAt = String(form.elements.publishedAt?.value || "").trim();

      if (!publishAt) {
        message.textContent = "Pick a publish date and time for scheduled posts.";
        message.dataset.type = "error";
        return;
      }

      if (Number.isNaN(new Date(publishAt).getTime()) || new Date(publishAt).getTime() <= Date.now()) {
        message.textContent = "Scheduled publish time must be in the future.";
        message.dataset.type = "error";
        return;
      }

      payload.publishedAt = new Date(publishAt).toISOString();
    }

    state.saving = true;
    setFormLoading(form, true);
    message.textContent = "Saving...";
    message.dataset.type = "info";

    try {
      const saved = isEdit
        ? await updateCmsItem(resource, state.itemId, payload)
        : await createCmsItem(resource, payload);

      const savedId = getItemId(saved) || payload.slug;
      state.itemId = savedId;
      window.history.replaceState({}, "", getEditHref(resource, saved));
      const viewAction = form.querySelector("[data-public-view-action]");

      if (viewAction) {
        viewAction.outerHTML = renderViewAction(resource, saved, "normal");
      }

      setInlineSuccessWithDeploy(message, saved);
    } catch (error) {
      handleError(error, message);
    } finally {
      state.saving = false;
      setFormLoading(form, false);
    }
  });
}

async function renderEditor(resource, mode) {
  const config = resources[resource];

  if (mode === "new") {
    await renderForm(resource, mode, {
      status: "draft",
      publishedAt: "",
    });
    return;
  }

  view.innerHTML = `<div class="admin-loading">Loading ${config.singular}...</div>`;

  if (!state.itemId) {
    throw new Error(`Missing ${config.idLabel} for this ${config.singular}.`);
  }

  const item = await getCmsItem(resource, state.itemId);
  await renderForm(resource, mode, item);
}

function handleError(error, inlineMessage) {
  if (error instanceof CmsAccessDeniedError) {
    clearAdminSession().catch(() => {});
    setAlert("");
    setDenied(error.message);
    return;
  }

  const message =
    error?.message || "Something went wrong. Please try the CMS action again.";

  if (inlineMessage) {
    inlineMessage.textContent = message;
    inlineMessage.dataset.type = "error";
    return;
  }

  setAlert(message, "error");
}

async function initAdmin() {
  if (!root || !view) {
    return;
  }

  if (adminNav) {
    adminNav.hidden = true;
  }

  document.querySelectorAll("[data-admin-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      logoutAdmin();
    });
  });

  try {
    const user = await requireAdminUser();

    if (!user) {
      return;
    }

    if (adminNav) {
      adminNav.hidden = false;
    }

    if (session) {
      session.textContent = user.email || "Signed in";
    }

    if (state.mode === "dashboard") {
      renderDashboard();
      return;
    }

    if (state.mode === "distribution") {
      await renderDistribution();
      return;
    }

    if (!resources[state.resource]) {
      throw new Error("Unknown CMS section.");
    }

    if (state.mode === "list") {
      await renderList(state.resource);
      return;
    }

    await renderEditor(state.resource, state.mode);
  } catch (error) {
    handleError(error);
  }
}

initAdmin();
