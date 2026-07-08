import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const mdxPlugin: any = mdx({
    remarkPlugins: [remarkFrontmatter, remarkGfm, remarkMath],
    rehypePlugins: [rehypeKatex],
    providerImportSource: '@mdx-js/react',
  });
  const mdxBase: any = typeof mdxPlugin.transform === 'function' ? mdxPlugin.transform : mdxPlugin.transform.handler;
  // Let Vite handle ?raw (and other query) imports of .mdx — the frontmatter
  // index reads the raw file text, so MDX must not compile those requests.
  const mdxGuarded: any = {
    ...mdxPlugin,
    enforce: 'pre',
    transform(this: any, code: string, id: string) {
      if (id.includes('?')) return null;
      return mdxBase.call(this, code, id);
    },
  };

  return {
    server: {
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
    },
    plugins: [mdxGuarded, react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // In production, call the backend through the Static Web App's own
      // same-origin `/api` route (SWA linked backend). An empty base makes
      // fetch() hit `/api/...` on the SWA domain, which SWA proxies to the
      // linked Function App with its auth token — so the Function App can be
      // locked to SWA-only traffic. Local dev still targets the func host.
      'import.meta.env.VITE_RAG_API_URL': JSON.stringify(
        env.VITE_RAG_API_URL || (mode === 'production' ? '' : 'http://localhost:7071')
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    esbuild: {
      drop: ['debugger'],
      // Strip noisy debug logs in prod (keeps console.warn / console.error)
      pure: ['console.log', 'console.info', 'console.debug'],
    },
    build: {
      chunkSizeWarningLimit: 2500,
      // Don't eagerly modulepreload the heavy Spline chunk — it must stay a
      // truly on-demand import triggered from Hero (requestIdleCallback), not
      // fetched + compiled during the initial page load.
      modulePreload: {
        resolveDependencies: (_url: string, deps: string[]) =>
          deps.filter((d) => !d.includes('vendor-3d')),
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            const norm = id.replace(/\\/g, '/');
            if (norm.includes('/node_modules/react-router') || norm.includes('/node_modules/@remix-run/')) {
              return 'vendor-router';
            }
            if (norm.includes('/node_modules/@mdx-js/')) {
              return 'vendor-mdx';
            }
            // Keep React (incl. react/jsx-runtime) + scheduler together so the
            // dynamically-imported Spline chunk never bridges into the eager
            // entry chunk (the jsx-runtime leak that defeated the lazy boundary).
            if (
              norm.includes('/node_modules/react/') ||
              norm.includes('/node_modules/react-dom/') ||
              norm.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (norm.includes('@splinetool')) {
              return 'vendor-3d';
            }
          }
        }
      }
    }
  };
});
