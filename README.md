# Toolsbuild

**Toolsbuild** is a hand-curated directory of **490 design and development resources** — tools, components, icon sets, motion references, AI utilities, fonts, and more — organized into **9 categories** and built as a fully static, fast, bilingual site.

Every entry has a short description in Spanish and English, tags, and a favicon, so you can scan the catalog, filter by category, and jump straight to the resource.

![Toolsbuild — the resource catalog](./public/preview.png)

## What you can do with it

- **Browse 490 resources** in9 curated categories: Inspiration, Components, Icons, Animation, Visuals, AI, Build, Learn, and Utilities
- **Search everything** (names, descriptions, tags) with the command palette — `Ctrl`/`⌘ + K`
- **Filter by category** from the sidebar, with live counts per category
- **Switch between grid and list views** with a smooth layout toggle
- **Read it in Spanish or English** — every resource description is written in both languages (`/` and `/en`)
- **Spot fresh additions** — resources added in the last14 days show a "New" badge
- Dark-first UI, responsive layout, and a static build that deploys anywhere

## Tech stack

- [Astro 7](https://astro.build) — static site framework with island architecture
- React 19 — interactive islands (search palette)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Morphicons](https://www.morphicons.com) + [lucide](https://lucide.dev) — icons and morphing icon transitions
- TypeScript

## Quick start

```sh
npm install
npm run dev        # http://localhost:4321
```

| Command                   | Action                                      |
| :------------------------ | :------------------------------------------ |
| `npm run dev`             | Start the dev server at `localhost:4321`    |
| `npm run build`           | Build the production site to `./dist/`      |
| `npm run preview`         | Preview the production build locally        |
| `npm run astro check`     | Type-check the project                      |
| `npm run astro ...`       | Run any Astro CLI command                   |

## Project structure

```text
/
├── public/                 # favicons and static assets
├── src/
│   ├── components/         # UI: Header, Sidebar, ResourceCard, search palette…
│   ├── data/
│   │   ├── links.json      # the catalog —490 resources with ES/EN descriptions
│   │   └── categories.json # the9 categories
│   ├── i18n/               # Spanish / English dictionaries
│   ├── layouts/            # shared page layout
│   ├── lib/                # helpers (URLs, icon morphing…)
│   ├── pages/              # routes: /, /en, /404, category redirects
│   └── styles/             # global CSS and design tokens
└── package.json
```

## Adding a resource

The catalog lives in [`src/data/links.json`](./src/data/links.json). Each entry looks like:

```json
{
  "id": "magic-ui",
  "url": "https://magicui.design",
  "name": "Magic UI",
  "category": "components",
  "tags": ["react", "animated", "free"],
  "desc": {
    "es": "Componentes animados listos para copiar y pegar.",
    "en": "Animated components ready to copy and paste."
  },
  "addedAt": "2026-10-13T00:00:00.000Z"
}
```

Rules: `id` is a lowercase slug (`^[a-z0-9-]+$`) and must be unique; `category` must exist in `categories.json`; `tags` are1–3 short lowercase strings; both descriptions are required. Entries are appended in ascending `addedAt` order.
