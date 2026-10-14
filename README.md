# Toolsbuild

## Description

Toolsbuild is a hand-curated directory of **506 resources for designers, developers and small teams**, organized into **10 categories**: inspiration galleries, UI components, icon sets, animation references, visual assets, build tools, MCP servers, learning material, and everyday utilities.

Every entry includes a favicon, tags, and a short description in **Spanish and English**, so you can scan the catalog, filter by category, and jump straight to the resource. The site is fully static, dark-first, responsive, and ships with:

- Full-text **search** over names, descriptions and tags — press `Ctrl` / `⌘ + K`
- **Category sidebar** with live counts
- **Grid and list views** with a layout toggle
- Bilingual UI — Spanish at `/`, English at `/en`
- "New" badges on resources added in the last 14 days

Built with [Astro](https://astro.build), React and Tailwind CSS.

## Screenshots

![Toolsbuild — the resource catalog](./public/preview.png)

## Getting Started

### Dependencies

- [Node.js](https://nodejs.org) **22.12 or newer** (the project declares `engines: node >=22.12.0`)
- npm (ships with Node)
- A modern browser (Chrome, Firefox, Safari or Edge)

### Installing

```sh
git clone https://github.com/DylanZM/ToolsBuild.git
cd ToolsBuild
npm install
```

### Executing program

```sh
npm run dev          # dev server at http://localhost:4321
npm run build        # production build → ./dist/
npm run preview      # preview the production build locally
npm run astro check  # type-check the project
```

Step by step:

1. Run `npm install` once after cloning.
2. Start the dev server with `npm run dev` and open `http://localhost:4321`.
3. Browse the catalog: filter with the sidebar, search with `Ctrl` / `⌘ + K`, toggle grid/list from the header, and switch languages with the `EN` / `ES` control.
4. For deployment, run `npm run build` and publish the generated `dist/` folder to any static host.

## Help

- **Dev server hangs or assets return `504 (Outdated Optimize Dep)`?** Stale Vite cache — wipe it and restart:

  ```sh
  rm -rf node_modules/.vite node_modules/.astro .astro node_modules/.cache
  npm run dev
  ```

- **Type errors or warnings?** Run `npm run astro check`.
- **Port 4321 already in use?** Stop the other process or run Astro with `--port` to pick a different one.
- Anything else — open an issue and describe what you did and what you saw.

## License

No license has been specified for this project yet.
