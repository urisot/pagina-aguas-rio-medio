import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.aguasderiomedio.com',
  trailingSlash: 'always',
  integrations: [react()],
  redirects: {
    '/category/noticias/': { status: 301, destination: '/noticias/' },
  },
  vite: { plugins: [tailwindcss()] },
});
