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
    const publishedLabel = value
      ? normalizeDateTimeValue(value)
      : "";
    const publishedHint = value
      ? "Set automatically when this item was first published."
      : "This will be set automatically the first time you publish.";

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

  if (type === "select") {
    const current = value || "draft";

    return `
      <label>
        ${label}
        <select name="${name}"${requiredAttribute}>
          ${["draft", "published", "archived"]
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

function renderViewAction(resource, item, size = "small") {
  const href = getPublicHref(resource, item);
  const sizeClass = size === "small" ? " admin-button-small" : "";

  if (!href) {
    return `<span class="admin-button${sizeClass} admin-button-muted" aria-disabled="true" data-public-view-action>View</span>`;
  }

  return `<a class="admin-button${sizeClass}" href="${href}" target="_blank" rel="noopener" data-public-view-action>View</a>`;
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
        await archiveCmsItem(resource, id);
        setAlert(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} archived.`, "success");
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

  if (!title || !slug) {
    return;
  }

  let slugTouched = Boolean(slug.value);

  slug.addEventListener("input", () => {
    slugTouched = true;
  });

  title.addEventListener("input", () => {
    if (!slugTouched) {
      slug.value = slugify(title.value);
    }
  });
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
        ${config.fields.map((field) => renderField(field, item)).join("")}
      </div>
      <div class="admin-editor-actions">
        <a class="admin-button" href="${config.basePath}">Back</a>
        ${renderViewAction(resource, item, "normal")}
        <button type="submit" class="admin-button" data-save-status="draft">Save Draft</button>
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

      message.textContent =
        requestedStatus === "archived"
          ? `${config.singular[0].toUpperCase()}${config.singular.slice(1)} archived.`
          : `${config.singular[0].toUpperCase()}${config.singular.slice(1)} saved.`;
      message.dataset.type = "success";
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
