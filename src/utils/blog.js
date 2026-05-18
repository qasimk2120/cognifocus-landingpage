import posts from "../data/blog/posts.json";

export const BLOG_PAGE_SIZE = 6;

export const BLOG_CATEGORIES = [
  { label: "Focus Guides", slug: "focus-guides" },
  { label: "App Blocking", slug: "app-blocking" },
  { label: "Study Focus", slug: "study-focus" },
  { label: "ADHD-Friendly Focus", slug: "adhd-friendly-focus" },
  { label: "Product Comparisons", slug: "product-comparisons" },
  { label: "Release Notes", slug: "release-notes" },
];

export const formatBlogDate = (value) =>
  new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));

export const sortPostsByDate = (entries) =>
  [...entries].sort((a, b) =>
    (b.publishDate || "").localeCompare(a.publishDate || ""),
  );

export const getSortedPosts = () => sortPostsByDate(posts);

export const getCategoryBySlug = (slug) =>
  BLOG_CATEGORIES.find((category) => category.slug === slug);

export const getPostsByCategory = (slug) =>
  getSortedPosts().filter((post) => post.categorySlug === slug);

export const getActiveCategories = () => {
  const counts = new Map();

  for (const post of posts) {
    counts.set(post.categorySlug, (counts.get(post.categorySlug) || 0) + 1);
  }

  return BLOG_CATEGORIES.filter((category) => counts.has(category.slug)).map(
    (category) => ({
      ...category,
      count: counts.get(category.slug),
    }),
  );
};

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
