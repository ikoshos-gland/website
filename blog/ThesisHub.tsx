import React from 'react';
import { Link } from 'react-router-dom';
import './blog.css';
import { getMeta } from './posts';
import { useLang, useContent } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';

// One entry per column of the colonnade, in thesis order — NOT derived from
// getPosts(), whose date sort is descending and unstable for the 004/005 tie.
// A section whose post is not written yet (or not translated into the current
// language) has no meta to resolve and is raised as an unbuilt bay; it turns
// into a link on its own the day the .mdx lands. Slugs are language-invariant:
// posts.ts strips the NNN- prefix and the .tr/.de suffix.
const SECTION_SLUGS: (string | null)[] = [
  'introduction-to-exm-connectomics',
  'a-brain-is-its-connections',
  'two-walls-diffraction-limit-connectome',
  'recipe-for-a-brain-glove-box-to-supercomputer',
  null,
  null,
];

// Horizontal centre of each painted column in colonnade.webp, as a percentage
// of the plate width, measured off the engraving itself. The stage is locked to
// the plate's aspect ratio and the plate is never cropped, so these stay true at
// every viewport size without any JS.
const COLUMN_X = [11.83, 26.68, 41.53, 56.38, 71.23, 86.08];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export default function ThesisHub() {
  const { lang } = useLang();
  const c = useContent();
  const t = c.thesisHub;

  const bays = t.sections.map((section, i) => {
    const slug = SECTION_SLUGS[i];
    const meta = slug ? getMeta(slug, lang) : undefined;
    return {
      label: section.label,
      blurb: section.blurb,
      // The frieze always carries the short section label; the card that opens
      // on hover adds the post's own title, once there is a post.
      title: meta?.title ?? null,
      href: meta ? `/blog/${slug}` : null,
    };
  });

  return (
    <div className="blog-root blg-thesis-page">
      <div className="blg-topbar">
        <Link to="/">← Mertoshi</Link>
        <span className="blg-topbar-right">
          <Link to="/blog">{c.blog.logbook}</Link>
          <LanguageSwitcher />
        </span>
      </div>

      <div className="blg-thesis">
        <header className="blg-thesis-masthead">
          <div className="blg-thesis-mast-title">
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.title}</h1>
          </div>
          <p className="blg-thesis-intro">{t.intro}</p>
        </header>

        <div className="blg-colonnade">
          <img className="blg-colonnade-plate" src="/img/colonnade.webp" alt="" />
          <div className="blg-colonnade-veil" aria-hidden="true" />

          {bays.map((bay, i) => {
            const style = { '--x': `${COLUMN_X[i]}%` } as React.CSSProperties;
            const inner = (
              <>
                <span className="shaft" aria-hidden="true" />
                <span className="frieze">
                  <span className="num" aria-hidden="true">{ROMAN[i]}</span>
                  <span className="label">{bay.label}</span>
                </span>
                {/* the chip is the card's status repeated as a rest-state
                    affordance, so it stays out of the accessibility tree */}
                <span className="chip" aria-hidden="true">
                  {bay.href ? `${t.readCta} →` : t.comingSoon}
                </span>
                <span className="card">
                  {bay.title && <span className="ct">{bay.title}</span>}
                  {bay.blurb && <span className="cb">{bay.blurb}</span>}
                  <span className="cc">{bay.href ? `${t.readCta} →` : t.comingSoon}</span>
                </span>
              </>
            );

            return bay.href ? (
              <Link key={i} className="blg-bay" style={style} to={bay.href}>
                {inner}
              </Link>
            ) : (
              <div key={i} className="blg-bay is-locked" style={style} aria-disabled="true">
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
