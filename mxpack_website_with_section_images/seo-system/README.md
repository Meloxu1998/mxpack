# MX PACK SEO Operating System

This directory turns SEO work into a repeatable operating process. It does not
authorize bulk publishing or invented product claims.

## Workflow

1. Maintain business facts in `config.json`.
2. Expand keywords from products, buyer uses, commercial modifiers, search
   suggestions, competitor gaps and Search Console queries.
3. Add MSV, KD and CPC when a trusted data source is available.
4. Run `node scripts/score-keywords.mjs`.
5. Review `data/keyword-opportunities.csv` and update `content-queue.csv`.
6. Create a brief from `templates/content-brief.md`.
7. Draft the page in GitHub.
8. Verify facts, assets, links, schema, mobile layout and conversion paths
   before publishing.
9. Run the weekly audit and use GSC/GA4 results to reprioritize the queue.

## Commands

```powershell
node seo-system/scripts/score-keywords.mjs
node seo-system/scripts/run-weekly-audit.mjs
node seo-system/scripts/run-weekly-audit.mjs --write
node tools/validate-seo.mjs
```

## Publishing Rules

- Do not change the homepage structure without explicit approval.
- Do not publish claims about certifications, delivery times, material
  performance, capacity or customer results without supporting evidence.
- Do not create multiple pages for the same search intent.
- Do not publish an AI draft without a factual and conversion review.
- Product and commercial pages take priority over generic blog volume.
- Every indexable page needs one primary intent, one H1, a canonical URL,
  useful internal links and a relevant quote path.

## Weekly Review

The scheduled review should report:

- live URL and sitemap health;
- missing or duplicated metadata;
- placeholder or thin content;
- GA4 and quote tracking presence;
- newly visible search opportunities;
- the next three content actions;
- facts or assets required from the business owner.

GSC and GA4 account data can only be included when the scheduled environment
has authorized access. Public site checks must still run when private analytics
are unavailable.
