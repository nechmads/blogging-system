import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  integrations: [mdx()],
  server: { port: 4323 },
  vite: {
    plugins: [tailwindcss()],
  },
});
