// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://tools-build.vercel.app',
  output: 'server',
  adapter: process.env.VERCEL ? vercel() : node({ mode: 'standalone' }),
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // /admin is Spanish-only; redirect /en/admin instead of 404ing.
  // Only when admin.astro exists (local-only, not in fresh clones).
  ...(fs.existsSync(path.resolve(process.cwd(), 'src/pages/admin.astro'))
    ? { redirects: { '/en/admin': '/admin' } }
    : {}),
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/admin'),
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-ES', en: 'en-US' },
      },
    }),
  ],
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'admin-links-api',
        /**
         * Local /admin API, dev only (static builds skip Vite middleware).
         * The script is gitignored, so register it only when present.
         * @param {import('vite').ViteDevServer} server
         */
        configureServer(server) {
          const apiFile = path.resolve(process.cwd(), 'scripts/admin-links.mjs');
          if (!fs.existsSync(apiFile)) return;
          server.middlewares.use(async (req, res, next) => {
            const url = (req.url || '').split('?')[0];
            if (url === '/api/links') {
              try {
                const { handleAdminLinks } = await import(pathToFileURL(apiFile).href);
                handleAdminLinks(req, res);
              } catch {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'API de admin no disponible.' }));
              }
              return;
            }
            next();
          });
        },
      },
    ],
  },
});
