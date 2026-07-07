import React from 'react';
import { Link } from 'react-router-dom';
import './blog.css';
import { getMeta } from './posts';
import { useLang, useContent } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

// The thesis reading path is a curated, ordered sequence — NOT derived from
// getPosts(), whose date sort is descending and unstable for the 004/005 tie.
// Slugs are language-invariant (posts.ts strips the NNN- prefix and .tr/.de
// suffix), so the same array works for every language.
const CHAPTERS = [
  'a-brain-is-its-connections',
  'two-walls-diffraction-limit-connectome',
  'recipe-for-a-brain-glove-box-to-supercomputer',
];

export default function ThesisHub() {
  const { lang } = useLang();
  const c = useContent();
  const t = c.thesisHub;

  return (
    <div className="blog-root">
      <div className="blg-topbar">
        <Link to="/">← Mertoshi</Link>
        <span className="blg-topbar-right">
          <Link to="/blog">{c.blog.logbook}</Link>
          <LanguageSwitcher />
        </span>
      </div>

      <div className="blg-index blg-thesis">
        <div className="blg-index-head">
          <div className="eyebrow">{t.eyebrow}</div>
          <h1>{t.title}</h1>
          <p className="blg-thesis-intro">{t.intro}</p>
        </div>

        <ol className="blg-thesis-path">
          {CHAPTERS.map((slug, i) => {
            const meta = getMeta(slug, lang);
            if (!meta) return null;
            return (
              <li key={slug}>
                <Link className="blg-thesis-card" to={`/blog/${slug}`}>
                  <span className="num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <div className="body">
                    <div className="ch">{t.chapterLabel} {i + 1}</div>
                    <h2>{meta.title}</h2>
                    <p>{t.steps[i]}</p>
                    <span className="cta">{t.readCta} →</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
