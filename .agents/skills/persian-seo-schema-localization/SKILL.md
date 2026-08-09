---
name: persian-seo-schema-localization
description: >-
  SEO optimization and Persian localization skill for JinxFamily. Use this skill when
  modifying page metadata, OpenGraph tags, Schema.org JSON-LD structured data,
  sitemap, or Persian RTL accessibility.
---

# Persian SEO & Structured Data Localization Skill

This skill provides guidelines for maximizing organic search visibility and search engine snippet presentation for JinxFamily.

## Core SEO Requirements

1. **Title & Meta Tags**:
   - Unique, descriptive Persian titles with brand name (`جینکس فمیلی | خرید v-bucks فورتنایت و گیفت کارت`).
   - Compelling Persian meta descriptions including targeted keywords (خرید V-Bucks, گیفت کارت, جم فورتنایت, اکانت gta).

2. **Schema.org JSON-LD**:
   - Implement `Product`, `AggregateRating`, `Offer`, and `BreadcrumbList` schemas on product pages.
   - Example Offer currency: `IRT` (Toman) / `IRR` (Rial), with accurate `inStock` availability status.

3. **Semantic HTML & Heading Structure**:
   - Exactly one `<h1>` per page.
   - Logical `<h2>`, `<h3>` hierarchy.
   - Descriptive `alt` tags on all product images in Persian.

4. **HTTP Status Codes for Maintenance**:
   - Maintenance page responses MUST issue a **503 Service Unavailable** status code with `Retry-After` header to avoid de-indexing by search engines (e.g. Googlebot).
