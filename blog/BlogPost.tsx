import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import 'katex/dist/katex.min.css';
import './blog.css';
import { getMeta, loadPostBody, getPosts } from './posts';
import { mdxComponents } from './mdxComponents';
import { useLang, useContent } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import DeckReveal from './DeckReveal';
import BlogIntro, { shouldPlay as blogIntroWillPlay } from './BlogIntro';

const fmtDate = (d: string) => (d ? d.replace(/-/g, ' · ') : '');

// The streaming deck plays only the first time a post is ever opened in this
// browser. We remember which slugs have played (keyed by slug, not language).
const DECK_SEEN_KEY = 'mertoshi-deck-seen';
const reducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasSeenDeck = (slug: string): boolean => {
  if (typeof window === 'undefined') return true;
  try {
    const s = JSON.parse(window.localStorage.getItem(DECK_SEEN_KEY) || '[]');
    return Array.isArray(s) && s.includes(slug);
  } catch {
    return false;
  }
};
const markDeckSeen = (slug: string) => {
  if (typeof window === 'undefined') return;
  try {
    const s = JSON.parse(window.localStorage.getItem(DECK_SEEN_KEY) || '[]');
    const arr = Array.isArray(s) ? s : [];
    if (!arr.includes(slug)) {
      arr.push(slug);
      window.localStorage.setItem(DECK_SEEN_KEY, JSON.stringify(arr));
    }
  } catch {
    /* storage unavailable — ignore */
  }
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLang();
  const c = useContent();
  const meta = slug ? getMeta(slug, lang) : undefined;
  const [Body, setBody] = useState<React.ComponentType | null>(null);
  const nibRef = useRef<HTMLDivElement>(null);
  const ct = (t: string) => (c.blog.contentType as Record<string, string>)[t] ?? t;

  // Streaming-deck gating: decide once per slug whether to play the reveal, and
  // keep the rest of the article hidden until it finishes. Decision is memoised
  // per slug so React StrictMode's double-invoke can't skip or double-run it.
  const metaSlug = meta?.slug;
  const [doneSlug, setDoneSlug] = useState<string | null>(null);
  // On the first blog page of a session, the intro plays as a BACKDROP behind
  // this post's title + deck, and the deck's decrypt drives its exit — so here we
  // deliberately run the deck under the intro (index/hub use the overlay intro).
  const introBackdrop = useMemo(
    () => !!metaSlug && !!meta?.excerpt && blogIntroWillPlay(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metaSlug]
  );
  const deckDecision = useMemo(
    () => !!metaSlug && !!meta?.excerpt && !reducedMotion() && (introBackdrop || !hasSeenDeck(metaSlug)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [metaSlug, introBackdrop]
  );
  // Skip the reveal (show plainly) once it has completed for this slug — so a
  // language switch on an open post never replays it.
  const animateDeck = deckDecision && doneSlug !== metaSlug;
  const [revealed, setRevealed] = useState(!deckDecision);
  useEffect(() => {
    setRevealed(!deckDecision);
  }, [deckDecision, metaSlug]);
  const handleDeckDone = () => {
    setDoneSlug(metaSlug ?? null);
    setRevealed(true);
    if (metaSlug) markDeckSeen(metaSlug);
  };

  // Hero cinematic: while the intro plays, the title + deck sit CENTRED and
  // zoomed-in; when the decrypt finishes they zoom out and dock to the top as the
  // article opens. BlogIntro measures the (transformed) header, so the animation
  // frames it wherever it sits.
  const heroRef = useRef<HTMLDivElement>(null);
  const heroActive = introBackdrop && !revealed;
  const [heroShift, setHeroShift] = useState(0);
  const [heroArmed, setHeroArmed] = useState(false);
  // Gate the backdrop on this: BlogIntro must only mount AFTER the hero is at its
  // centred position, so it measures (and frames) the header where it actually
  // sits — never the pre-shift box (which would let flowers cross the text).
  const [heroReady, setHeroReady] = useState(false);
  useLayoutEffect(() => {
    if (!heroActive || !heroRef.current) { setHeroReady(true); return; }
    const el = heroRef.current;
    const saved = el.style.transform;
    el.style.transform = 'none';
    const r = el.getBoundingClientRect();
    el.style.transform = saved;
    setHeroShift(Math.max(0, window.innerHeight * 0.42 - (r.top + r.height / 2)));
    setHeroReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroActive, metaSlug, lang]);
  // Arm the transition only after the centred position is painted, so entry is
  // instant and only the exit (dock-up + zoom-out) animates.
  useEffect(() => {
    if (!heroActive) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setHeroArmed(true)));
    return () => cancelAnimationFrame(id);
  }, [heroActive]);
  const heroStyle: React.CSSProperties = {
    transform: heroActive ? `translateY(${heroShift}px) scale(1.12)` : undefined,
    transformOrigin: '50% 50%',
    transition: heroArmed ? 'transform 0.9s cubic-bezier(0.2,0.75,0.2,1)' : 'none',
    willChange: 'transform',
  };

  useEffect(() => {
    let active = true;
    setBody(null);
    const loader = slug ? loadPostBody(slug, lang) : undefined;
    if (loader) loader().then((m) => { if (active) setBody(() => m.default); });
    return () => { active = false; };
  }, [slug, lang]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1);
      if (nibRef.current) nibRef.current.style.transform = 'scaleY(' + Math.min(1, Math.max(0, p)) + ')';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [Body, revealed]);

  const topbar = (
    <div className="blg-topbar">
      <Link to="/">← Mertoshi</Link>
      <span className="blg-topbar-right"><Link to="/thesis">{c.thesisHub.hubLink}</Link><Link to="/blog">{c.blog.logbook}</Link><LanguageSwitcher /></span>
    </div>
  );

  if (!meta) {
    return (
      <div className="blog-root">
        {topbar}
        <div className="blg-loading">Post not found. <Link className="blg-link" to="/blog">{c.blog.backToBlog}</Link></div>
      </div>
    );
  }

  const posts = getPosts(lang);
  const idx = posts.findIndex((p) => p.slug === meta.slug);
  const prev = posts[idx + 1];
  const next = posts[idx - 1];

  return (
    <div className="blog-root">
      {introBackdrop && heroReady && <BlogIntro key={metaSlug} mode="backdrop" dissolve={revealed} />}
      <div className="blg-nib-track"><div className="blg-nib-fill" ref={nibRef} /></div>
      {topbar}
      <article className="blg-article">
        <div className="blg-col">
          <div className="blg-hero" ref={heroRef} style={heroStyle}>
            <div className="blg-kicker">{ct(meta.contentType)}{meta.tags[0] ? ' · ' + meta.tags[0] : ''}</div>
            <h1 className="blg-title">{meta.title}</h1>
            {meta.excerpt && (
              <p className="blg-deck">
                <DeckReveal key={metaSlug} text={meta.excerpt} animate={animateDeck} onDone={handleDeckDone} />
              </p>
            )}
          </div>
          {revealed && (
            <div className="blg-reveal">
              <div className="blg-byline">
                <span className="name">Mert Koca</span>
                <span>{fmtDate(meta.date)}</span>
                <span className={'blg-chip ' + meta.contentType}>{ct(meta.contentType)}</span>
              </div>
              <div className="blg-body">
                <MDXProvider components={mdxComponents}>
                  {Body ? <Body /> : <div className="blg-loading">Loading…</div>}
                </MDXProvider>
              </div>
              <footer className="blg-foot">
                {prev ? <Link to={`/blog/${prev.slug}`}>← {prev.title.slice(0, 26)}</Link> : <span />}
                {next ? <Link to={`/blog/${next.slug}`}>{next.title.slice(0, 26)} →</Link> : <span />}
              </footer>
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
