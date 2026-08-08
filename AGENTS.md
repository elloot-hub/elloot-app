<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Elloot app — agent / team notes

- Structure and “where to edit”: see [`README.md`](./README.md) and root [`../README.md`](../README.md).
- Domain UI lives in `src/features/<name>/` — each `index.ts` has STATUS.
- Canonical market path: `/market` (`routes.market`). Do not build on `/marketplace`.
- Categories are not “games”: use `Category`, `CategoryGrid`, `getCategoryVisual`.
- Keep `app/**/page.tsx` thin; put logic in features.
