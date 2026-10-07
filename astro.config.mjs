// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import { handleAdminLinks } from './scripts/admin-links.mjs';

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
  // en lugar de caer en el 404.
  redirects: {
    '/en/admin': '/admin',
  },
  integrations: [react()],
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'admin-links-api',
        /**
         * API local para el panel /admin: solo existe en `astro dev`
         * (el build estático no incluye middlewares de Vite).
         * @param {import('vite').ViteDevServer} server
         */
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = (req.url || '').split('?')[0];
            if (url === '/api/links') {
              handleAdminLinks(req, res);
              return;
            }
            next();
          });
        },
      },
    ],
  },
});
