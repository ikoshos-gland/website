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

interface ScrubSection {
  id: string;
  title: string;
  level: 2 | 3;
  marker: number;
  top: number;
}

const makeSectionId = (text: string, index: number) => {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return `section-${slug || index}`;
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

function SectionScrubber({
  sections,
  activeId,
  progress,
  label,
  onJump,
}: {
  sections: ScrubSection[];
  activeId: string;
  progress: number;
  label: string;
  onJump: (id: string) => void;
}) {
  if (sections.length < 2) return null;

  return (
    <nav
      className="blg-scrub"
      aria-label={label}
      style={{ '--scrub-progress': `${progress}%` } as React.CSSProperties}
    >
      <div className="blg-scrub-rail" aria-hidden="true" />
      <div className="blg-scrub-fill" aria-hidden="true" />
      <div className="blg-scrub-thumb" aria-hidden="true" />
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          className={`blg-scrub-point level-${section.level}${section.id === activeId ? ' is-active' : ''}`}
          style={{ '--scrub-marker': `${section.marker}%` } as React.CSSProperties}
          onClick={() => onJump(section.id)}
          aria-label={section.title}
          aria-current={section.id === activeId ? 'location' : undefined}
        >
          <span className="blg-scrub-dot" aria-hidden="true" />
          <span className="blg-scrub-label">{section.title}</span>
        </button>
      ))}
    </nav>
  );
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { lang } = useLang();
  const c = useContent();
  const meta = slug ? getMeta(slug, lang) : undefined;
  const [Body, setBody] = useState<React.ComponentType | null>(null);
  const nibRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [scrubSections, setScrubSections] = useState<ScrubSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState('');
  const [scrubProgress, setScrubProgress] = useState(0);
  const ct = (t: string) => (c.blog.contentType as Record<string, string>)[t] ?? t;

  useEffect(() => {
    const cls = 'blg-hide-native-scrollbar';
    document.documentElement.classList.add(cls);
    document.body.classList.add(cls);
    return () => {
      document.documentElement.classList.remove(cls);
      document.body.classList.remove(cls);
    };
  }, []);

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
  const [introExitRequested, setIntroExitRequested] = useState(false);
  const [revealed, setRevealed] = useState(!deckDecision);
  const [bodyPrimed, setBodyPrimed] = useState(!deckDecision);
  useEffect(() => {
    setIntroExitRequested(false);
    setRevealed(!deckDecision);
    setBodyPrimed(!deckDecision);
  }, [deckDecision, metaSlug]);
  const handleDeckDone = () => {
    setDoneSlug(metaSlug ?? null);
    if (metaSlug) markDeckSeen(metaSlug);
    if (introBackdrop) {
      setIntroExitRequested(true);
      if (!animateDeck) {
        setBodyPrimed(true);
        setRevealed(true);
      }
    } else {
      setBodyPrimed(true);
      setRevealed(true);
    }
  };
  const handleIntroDone = () => {
    setBodyPrimed(true);
    setRevealed(true);
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
  const cinematicEntry = deckDecision && !revealed;

  useEffect(() => {
    let active = true;
    setBody(null);
    const loader = slug ? loadPostBody(slug, lang) : undefined;
    if (loader) loader().then((m) => { if (active) setBody(() => m.default); });
    return () => { active = false; };
  }, [slug, lang]);

  // Prepare the potentially long MDX tree while the calm middle of the intro is
  // playing. React's transition lane can yield between frames; the final handoff
  // then only unhides an existing tree instead of constructing it synchronously.
  useEffect(() => {
    if (!deckDecision || revealed || bodyPrimed || !Body) return;
    const id = window.setTimeout(() => {
      React.startTransition(() => setBodyPrimed(true));
    }, 900);
    return () => clearTimeout(id);
  }, [Body, bodyPrimed, deckDecision, revealed, metaSlug]);

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

  useEffect(() => {
    const body = bodyRef.current;
    if (!revealed || !Body || !body) {
      setScrubSections([]);
      setActiveSectionId('');
      setScrubProgress(0);
      return;
    }

    let frame = 0;
    let latestSections: ScrubSection[] = [];

    const updateScrollState = () => {
      const currentBody = bodyRef.current;
      if (!currentBody || latestSections.length === 0) return;

      const bodyTop = currentBody.getBoundingClientRect().top + window.scrollY;
      const bodyBottom = bodyTop + currentBody.offsetHeight;
      const span = Math.max(1, bodyBottom - bodyTop - window.innerHeight * 0.45);
      const focusY = window.scrollY + Math.min(260, window.innerHeight * 0.34);
      const progress = clampPercent(((focusY - bodyTop) / span) * 100);

      let active = latestSections[0]?.id || '';
      for (const section of latestSections) {
        if (section.top <= focusY) active = section.id;
        else break;
      }

      setScrubProgress(progress);
      setActiveSectionId(active);
    };

    const collectSections = () => {
      const currentBody = bodyRef.current;
      if (!currentBody) return;

      const headings = Array.from(
        currentBody.querySelectorAll<HTMLHeadingElement>('h2, h3')
      ).filter((heading) => heading.textContent?.trim());

      const used = new Set<string>();
      const bodyTop = currentBody.getBoundingClientRect().top + window.scrollY;
      const bodyBottom = bodyTop + currentBody.offsetHeight;
      const span = Math.max(1, bodyBottom - bodyTop - window.innerHeight * 0.45);

      latestSections = headings.map((heading, index) => {
        const title = (heading.textContent || '').replace(/\s+/g, ' ').trim();
        let id = heading.id || makeSectionId(title, index);
        while (used.has(id)) id = `${id}-${index + 1}`;
        used.add(id);
        heading.id = id;

        const top = heading.getBoundingClientRect().top + window.scrollY;
        return {
          id,
          title,
          level: heading.tagName === 'H3' ? 3 : 2,
          marker: clampPercent(((top - bodyTop) / span) * 100),
          top,
        };
      });

      setScrubSections(latestSections);
      updateScrollState();
    };

    const scheduleCollect = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(collectSections);
    };

    const scheduleScrollState = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateScrollState);
    };

    const imageNodes = Array.from(body.querySelectorAll('img'));
    imageNodes.forEach((img) => img.addEventListener('load', scheduleCollect));

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(scheduleCollect)
      : null;
    resizeObserver?.observe(body);

    scheduleCollect();
    window.addEventListener('scroll', scheduleScrollState, { passive: true });
    window.addEventListener('resize', scheduleCollect);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleScrollState);
      window.removeEventListener('resize', scheduleCollect);
      resizeObserver?.disconnect();
      imageNodes.forEach((img) => img.removeEventListener('load', scheduleCollect));
    };
  }, [Body, revealed, metaSlug, lang]);

  const jumpToSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      behavior: reducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

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
    <div className={'blog-root' + (cinematicEntry ? ' blg-post-cinematic' : '')}>
      {introBackdrop && heroReady && (
        <BlogIntro
          key={metaSlug}
          mode="backdrop"
          dissolve={introExitRequested}
          onDone={handleIntroDone}
        />
      )}
      <div className="blg-nib-track"><div className="blg-nib-fill" ref={nibRef} /></div>
      {revealed && (
        <SectionScrubber
          sections={scrubSections}
          activeId={activeSectionId}
          progress={scrubProgress}
          label={c.blog.tableOfContents}
          onJump={jumpToSection}
        />
      )}
      {topbar}
      <article className="blg-article">
        <div className="blg-col">
          <div className="blg-hero" ref={heroRef} style={heroStyle}>
            <div className="blg-kicker">{ct(meta.contentType)}{meta.tags[0] ? ' · ' + meta.tags[0] : ''}</div>
            <h1 className="blg-title">{meta.title}</h1>
            {meta.excerpt && (
              <p className="blg-deck">
                <DeckReveal
                  key={metaSlug}
                  text={meta.excerpt}
                  animate={animateDeck}
                  onDone={handleDeckDone}
                />
              </p>
            )}
          </div>
          {(revealed || bodyPrimed) && (
            <div
              className={'blg-reveal ' + (revealed ? 'is-visible' : 'is-primed')}
              aria-hidden={!revealed}
              inert={!revealed}
            >
              <div className="blg-byline">
                <span className="name">Mert Koca</span>
                <span>{fmtDate(meta.date)}</span>
                <span className={'blg-chip ' + meta.contentType}>{ct(meta.contentType)}</span>
              </div>
              <div className="blg-body" ref={bodyRef}>
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
