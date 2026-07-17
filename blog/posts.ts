// Build-time, language-aware index of blog posts. Each post is authored as
// `<NNN-slug>.mdx` (English, the canonical/fallback) and optionally translated as
// `<NNN-slug>.tr.mdx` / `<NNN-slug>.de.mdx`. Frontmatter is parsed from the raw
// .mdx text (cheap) for the list/home; the body is a lazily imported MDX module.
import type { Lang } from '../i18n/content';

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  contentType: string; // 'compute' | 'lab' | 'lesson'
  tags: string[];
  excerpt: string;
  cover?: string;
  draft: boolean;
  // Set per language: the post is listed and its frontmatter is shown, but the
  // body is withheld and the page offers a language that does have it. Lets a
  // post be published in one language without pulling its unfinished (or
  // deliberately untranslated) versions along. `draft` hides a post outright;
  // this keeps it visible and announces it.
  comingSoon: boolean;
  lang: Lang;
}

function parseFrontmatter(raw: string): Record<string, any> {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const data: Record<string, any> = {};
  if (!m) return data;
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let val: any = line.slice(i + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
    }
    data[key] = val;
  }
  return data;
}

// "005-recipe-....de.mdx" -> { slug: 'recipe-...', lang: 'de' }; no suffix -> 'en'.
// The NNN- prefix is optional. Slugs are lower-cased so a file named with capitals
// still resolves to the same URL the rest of the app hard-codes.
function parsePath(path: string): { slug: string; lang: Lang } {
  let file = (path.split('/').pop() || path).replace(/\.mdx$/, '');
  let lang: Lang = 'en';
  const m = file.match(/\.(en|tr|de)$/);
  if (m) { lang = m[1] as Lang; file = file.slice(0, -3); }
  const slug = file.replace(/^\d+[-_]/, '').toLowerCase();
  return { slug, lang };
}

const rawModules = import.meta.glob('../content/blog/*.mdx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const bodyModules = import.meta.glob('../content/blog/*.mdx') as Record<string, () => Promise<{ default: React.ComponentType }>>;

type Loader = () => Promise<{ default: React.ComponentType }>;
const metaByLang: Record<Lang, Record<string, PostMeta>> = { en: {}, tr: {}, de: {} };
const bodyByLang: Record<Lang, Record<string, Loader>> = { en: {}, tr: {}, de: {} };

for (const [path, raw] of Object.entries(rawModules)) {
  const { slug, lang } = parsePath(path);
  const fm = parseFrontmatter(raw);
  metaByLang[lang][slug] = {
    slug,
    title: fm.title || slug,
    date: fm.date || '',
    contentType: fm.contentType || 'lesson',
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    excerpt: fm.excerpt || '',
    cover: fm.cover,
    draft: !!fm.draft,
    comingSoon: !!fm.comingSoon,
    lang,
  };
}
for (const [path, loader] of Object.entries(bodyModules)) {
  const { slug, lang } = parsePath(path);
  bodyByLang[lang][slug] = loader;
}

const isVisible = (p: PostMeta) => import.meta.env.DEV || !p.draft;

// Canonical post set comes from English; a translation overrides it when present.
export function getPosts(lang: Lang): PostMeta[] {
  return Object.keys(metaByLang.en)
    .map((slug) => metaByLang[lang][slug] || metaByLang.en[slug])
    .filter(isVisible)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getMeta(slug: string, lang: Lang): PostMeta | undefined {
  return metaByLang[lang][slug] || metaByLang.en[slug];
}

// Languages this post can actually be READ in: the file exists, it is not a
// draft, and it is not merely announced. Drives the offer on a coming-soon
// page, so a reader is sent to a language that has the text rather than left
// at a dead end.
export function getReadableLangs(slug: string): Lang[] {
  return (Object.keys(metaByLang) as Lang[]).filter((l) => {
    const m = metaByLang[l][slug];
    return !!m && !m.comingSoon && isVisible(m);
  });
}

export function loadPostBody(slug: string, lang: Lang): Loader | undefined {
  return bodyByLang[lang][slug] || bodyByLang.en[slug];
}
