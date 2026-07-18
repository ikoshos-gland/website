import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import './blog.css';
import { getPosts } from './posts';
import { useLang, useContent } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

const THESIS_SLUGS = new Set([
  'a-brain-is-its-connections',
  'two-walls-diffraction-limit-connectome',
  'recipe-for-a-brain-glove-box-to-supercomputer',
]);

export default function BlogIndex() {
  const { lang } = useLang();
  const c = useContent();
  const [searchParams] = useSearchParams();
  const posts = getPosts(lang);
  const labPosts = posts.filter((p) => !p.draft && !THESIS_SLUGS.has(p.slug));
  const section = searchParams.get('section');
  const ct = (t: string) => (c.blog.contentType as Record<string, string>)[t] ?? t;

  const topbar = (
    <div className="blg-topbar">
      <Link to="/">← Mertoshi</Link>
      <span className="blg-topbar-right">
        <Link to="/thesis">{c.thesisHub.hubLink}</Link>
        <LanguageSwitcher />
      </span>
    </div>
  );

  if (section !== 'lab') {
    // Two bays, anchored to the figures measured off statues.webp. Kept here
    // rather than derived, for the same reason the colonnade hard-codes
    // COLUMN_X: the numbers come off the engraving, not off the data.
    const gates = [
      {
        x: 23,
        glyph: 'I',
        label: c.blog.thesisChoiceTitle,
        blurb: c.blog.thesisChoiceBody,
        tally: `6 ${c.blog.chaptersLabel}`,
        href: '/thesis',
      },
      {
        x: 77.5,
        glyph: 'II',
        label: c.blog.labChoiceTitle,
        blurb: c.blog.labChoiceBody,
        tally: `${labPosts.length} ${c.blog.postsLabel}`,
        href: '/blog?section=lab',
      },
    ];

    return (
      <div className="blog-root blg-gate-page">
        {topbar}
        <div className="blg-gate-wrap">
          <header className="blg-gate-masthead">
            <div className="blg-gate-mast-title">
              <div className="eyebrow">{c.blog.entryEyebrow}</div>
              <h1>{c.blog.chooseTitle}</h1>
            </div>
            <p className="blg-gate-intro">{c.blog.chooseIntro}</p>
          </header>

          <div className="blg-gate" aria-label={c.blog.chooseTitle}>
            <img className="blg-gate-plate" src="/img/statues.webp" alt="" />
            <div className="blg-gate-veil" aria-hidden="true" />

            {gates.map((g) => (
              <Link
                key={g.href}
                className="blg-gate-bay"
                style={{ '--x': `${g.x}%` } as React.CSSProperties}
                to={g.href}
              >
                <span className="shaft" aria-hidden="true" />
                <span className="plaque">
                  <span className="glyph" aria-hidden="true">{g.glyph}</span>
                  <span className="label">{g.label}</span>
                  <span className="tally">{g.tally}</span>
                </span>
                <span className="card">
                  <span className="cb">{g.blurb}</span>
                  <span className="cc">{c.blog.openSection} →</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="blog-root">
      {topbar}
      <div className="blg-index">
        <div className="blg-index-head">
          <div className="eyebrow">{c.blog.labEyebrow}</div>
          <h1>{c.blog.labTitle}</h1>
          <p className="blg-index-intro">{c.blog.labIntro}</p>
          <Link className="blg-section-switch" to="/blog">{c.blog.changeSection}</Link>
        </div>
        <ul className="blg-list">
          {labPosts.map((p) => (
            <li key={p.slug}>
              <Link className={'blg-row' + (p.cover ? ' has-cover' : '')} to={`/blog/${p.slug}`}>
                <div className="blg-row-text">
                  <div className="meta">
                    <span>{p.date.replace(/-/g, ' · ')}</span>
                    <span className={'blg-chip ' + p.contentType}>{ct(p.contentType)}</span>
                    {p.comingSoon && <span className="blg-chip soon">{c.blog.comingSoon}</span>}
                  </div>
                  <h2>{p.title}</h2>
                  <p>{p.excerpt}</p>
                </div>
                {p.cover && (
                  <span className="blg-row-cover" aria-hidden="true">
                    <img
                      src={p.cover}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const box = e.currentTarget.closest('.blg-row-cover') as HTMLElement | null;
                        if (box) box.style.display = 'none';
                      }}
                    />
                  </span>
                )}
              </Link>
            </li>
          ))}
          {labPosts.length === 0 && <li className="blg-loading">{c.blog.noPosts}</li>}
        </ul>
      </div>
    </div>
  );
}
