import { defineCollection, z } from "astro:content";

const blog = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
    publishedAt: z.string(),
    updatedAt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    featured: z.boolean().optional(),
    coverImage: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    canonical: z.string().optional(),
    articleTitle: z.string().optional(),
    ogTitle: z.string().optional(),
    ogDescription: z.string().optional(),
    ogImage: z.string().optional(),
    ogType: z.string().optional(),
    displayDate: z.string().optional(),
    categorySlug: z.string().optional(),
    excerpt: z.string().optional(),
    bodyClass: z.string().optional(),
    hasBlogCss: z.boolean().optional(),
    includePinterest: z.boolean().optional(),
    schemaHeadline: z.string().optional(),
    schemaDescription: z.string().optional(),
    breadcrumbTitle: z.string().optional(),
    breadcrumbLabel: z.string().optional(),
    bodyMarkdown: z.string().optional(),
    bodyHtml: z.string().optional(),
  }),
});

const releases = defineCollection({
  type: "data",
  schema: z.object({
    title: z.string(),
    version: z.string(),
    publishedAt: z.string(),
    slug: z.string(),
    summary: z.string(),
    category: z.string(),
    type: z
      .enum([
        "app",
        "website",
        "shield",
        "goblin",
        "analytics",
        "security",
        "content",
      ])
      .default("app"),
    tags: z.array(z.string()).default([]),
    highlights: z.array(z.string()).optional(),
    fixes: z.array(z.string()).optional(),
    improvements: z.array(z.string()).optional(),
    notes: z.array(z.string()).optional(),
    featured: z.boolean().optional(),
  }),
});

export const collections = { blog, releases };
