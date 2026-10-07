// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  // El panel /admin es solo español: /en/admin no existe, así que redirige
  // en lugar de caer en el 404. Solo si admin.astro está presente (existe
  // en local, no en un clone limpio/publicación).
  ...(fs.existsSync(path.resolve(process.cwd(), 'src/pages/admin.astro'))
    ? { redirects: { '/en/admin': '/admin' } }
    : {}),
  integrations: [react()],
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'admin-links-api',
        /**
         * API local para el panel /admin: solo existe en `astro dev`
         * (el build estático no incluye middlewares de Vite).
         * El script está en .gitignore (admin local-only), así que el
         * middleware se registra solo si el archivo existe.
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
