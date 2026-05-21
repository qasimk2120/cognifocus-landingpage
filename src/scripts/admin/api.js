import { getAdminIdToken } from "./auth.js";

const readEnv = (key) => String(import.meta.env[key] || "").trim();

export class CmsAccessDeniedError extends Error {
  constructor(message = "You do not have access to the CMS.") {
    super(message);
    this.name = "CmsAccessDeniedError";
  }
}

function getFunctionBaseUrl() {
  const baseUrl = readEnv("PUBLIC_CMS_FUNCTION_BASE_URL").replace(/\/+$/, "");

  if (!baseUrl) {
    throw new Error("PUBLIC_CMS_FUNCTION_BASE_URL is not configured.");
  }

  return baseUrl;
}

const endpointMap = {
  blog: {
    list: "listCmsBlogPosts",
    get: "getCmsBlogPost",
    create: "createCmsBlogPost",
    update: "updateCmsBlogPost",
    archive: "archiveCmsBlogPost",
  },
  releases: {
    list: "listCmsReleaseNotes",
    get: "getCmsReleaseNote",
    create: "createCmsReleaseNote",
    update: "updateCmsReleaseNote",
    archive: "archiveCmsReleaseNote",
  },
};

function getResourceEndpoints(resource) {
  const endpoints = endpointMap[resource];

  if (!endpoints) {
    throw new Error("Unknown CMS resource.");
  }

  return endpoints;
}

function buildEndpoint(functionName, query = {}) {
  const url = new URL(`${getFunctionBaseUrl()}/${functionName}`);

  for (const [key, value] of Object.entries(query)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url.href;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

function getErrorMessage(status, payload) {
  if (status === 401 || status === 403) {
    return "Access denied. Sign in with an authorized admin account.";
  }

  if (status >= 500) {
    return "The CMS backend had trouble saving this. Please try again.";
  }

  if (payload?.message) {
    return payload.message;
  }

  if (payload?.error) {
    return payload.error;
  }

  return "The CMS request could not be completed.";
}

export async function cmsRequest(functionName, options = {}) {
  const token = await getAdminIdToken();

  if (!token) {
    return null;
  }

  const response = await fetch(buildEndpoint(functionName, options.query), {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = await parseResponse(response);

  if (response.status === 401 || response.status === 403) {
    throw new CmsAccessDeniedError(getErrorMessage(response.status, payload));
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(response.status, payload));
  }

  return payload;
}

export function normalizeItemsPayload(payload, resource) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.[resource])) {
    return payload[resource];
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return [];
}

export function normalizeItemPayload(payload) {
  return payload?.item || payload?.data || payload || {};
}

function withIdPayload(id, body = {}) {
  return {
    ...body,
    id,
    slug: body.slug || id,
  };
}

export async function listBlogPosts() {
  return normalizeItemsPayload(await cmsRequest(endpointMap.blog.list), "blog");
}

export async function getBlogPost(idOrSlug) {
  return normalizeItemPayload(
    await cmsRequest(endpointMap.blog.get, {
      query: { slug: idOrSlug },
    }),
  );
}

export async function createBlogPost(payload) {
  return normalizeItemPayload(
    await cmsRequest(endpointMap.blog.create, {
      method: "POST",
      body: payload,
    }),
  );
}

export async function updateBlogPost(payload) {
  return normalizeItemPayload(
    await cmsRequest(endpointMap.blog.update, {
      method: "POST",
      body: payload,
    }),
  );
}

export async function archiveBlogPost(payload) {
  return normalizeItemPayload(
    await cmsRequest(endpointMap.blog.archive, {
      method: "POST",
      body: payload,
    }),
  );
}

export async function listReleaseNotes() {
  return normalizeItemsPayload(
    await cmsRequest(endpointMap.releases.list),
    "releases",
  );
}

export async function getReleaseNote(idOrSlug) {
  return normalizeItemPayload(
    await cmsRequest(endpointMap.releases.get, {
      query: { slug: idOrSlug },
    }),
  );
}

export async function createReleaseNote(payload) {
  return normalizeItemPayload(
    await cmsRequest(endpointMap.releases.create, {
      method: "POST",
      body: payload,
    }),
  );
}

export async function updateReleaseNote(payload) {
  return normalizeItemPayload(
    await cmsRequest(endpointMap.releases.update, {
      method: "POST",
      body: payload,
    }),
  );
}

export async function archiveReleaseNote(payload) {
  return normalizeItemPayload(
    await cmsRequest(endpointMap.releases.archive, {
      method: "POST",
      body: payload,
    }),
  );
}

export async function listCmsItems(resource) {
  getResourceEndpoints(resource);

  return resource === "blog" ? listBlogPosts() : listReleaseNotes();
}

export async function getCmsItem(resource, id) {
  getResourceEndpoints(resource);

  return resource === "blog" ? getBlogPost(id) : getReleaseNote(id);
}

export async function createCmsItem(resource, body) {
  getResourceEndpoints(resource);

  return resource === "blog" ? createBlogPost(body) : createReleaseNote(body);
}

export async function updateCmsItem(resource, id, body) {
  getResourceEndpoints(resource);
  const payload = withIdPayload(id, body);

  return resource === "blog"
    ? updateBlogPost(payload)
    : updateReleaseNote(payload);
}

export async function archiveCmsItem(resource, id) {
  getResourceEndpoints(resource);
  const payload = { id, slug: id, status: "archived" };

  return resource === "blog"
    ? archiveBlogPost(payload)
    : archiveReleaseNote(payload);
}
