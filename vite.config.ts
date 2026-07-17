import fs from 'fs';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeCitation from 'rehype-citation';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const mdxPlugin: any = mdx({
    remarkPlugins: [remarkFrontmatter, remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeKatex,
      // Zotero-style citations. Author posts write `[@bibkey]` inline; the plugin
      // reads content/_bibliography.bib and renders a numbered bibliography wherever
      // the post puts a `[^ref]` marker (else at the very end). That file is GENERATED
      // (gitignored) by the mergeBib plugin below, which concatenates two sources:
      // content/zotero.bib = Zotero's Better BibTeX "keep updated" auto-export (Zotero
      // OWNS it, overwritten on every change, do not hand-edit), and
      // content/references.bib = manual entries not in Zotero (demo/one-off refs that
      // must survive a library re-export). We merge into ONE file rather than passing
      // an array to rehype-citation because its array path is buggy: it mutates the
      // shared paths in place, so the 2nd MDX file re-resolves already-absolute paths
      // and dies with "Cannot read non valid bibliography URL". csl points at a local
      // IEEE style file (bracketed numeric [1]), which suits the blog's no-em-dash
      // house style. To switch styles, set csl to a built-in ('apa', 'vancouver',
      // 'chicago', 'mla', 'harvard1') or another local .csl path. showTooltips
      // shows the full entry on hover, matching the site's <Term> pattern.
      // linkCitations is intentionally OFF: its numeric-link path mis-parses page
      // locators that contain digits (e.g. `[@chen2015, p. 544]` -> it treats 544
      // as a second citation number and crashes). Tooltips already surface the
      // full reference on hover, so we skip the click-to-bibliography jump.
      [
        rehypeCitation,
        {
          bibliography: 'content/_bibliography.bib',
          csl: 'content/ieee.csl',
          linkCitations: false,
          showTooltips: true,
          inlineClass: ['blg-cite'],
        },
      ],
    ],
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

  // Concatenate the Zotero auto-export and the manual references into the single
  // file rehype-citation reads. Runs at server start and at build start, before
  // any MDX is compiled, so the merged file always exists. (In dev, .bib files
  // aren't watched deps — after Zotero rewrites zotero.bib, restart the dev
  // server to re-merge. Production rebuilds on every push, so it's a non-issue.)
  const mergeBib: any = {
    name: 'merge-bibliography',
    buildStart() {
      const root = process.cwd();
      const sources = ['content/zotero.bib', 'content/references.bib'];
      const merged = sources
        .map((f) => {
          try {
            return fs.readFileSync(path.join(root, f), 'utf8');
          } catch {
            return '';
          }
        })
        .join('\n\n');
      fs.writeFileSync(path.join(root, 'content/_bibliography.bib'), merged);
    },
  };

  return {
    server: {
      port: Number(process.env.PORT) || 3000,
      host: '0.0.0.0',
    },
    plugins: [mergeBib, mdxGuarded, react()],
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
            // three.js + react-three stack for the blog's <NeuronViewer>. Its own
            // chunk (separate from Spline's vendor-3d) so a neuron viewer never
            // drags in Spline and vice versa. The 'vendor-3d' substring keeps it
            // out of the eager modulePreload list above — it loads only when a
            // NeuronViewer scrolls into view.
            if (
              norm.includes('/node_modules/three/') ||
              norm.includes('/node_modules/@react-three/')
            ) {
              return 'vendor-3d-three';
            }
          }
        }
      }
    }
  };
});
