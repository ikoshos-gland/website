import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, BookOpen, FlaskConical } from 'lucide-react';
import './blog.css';
import { getPosts } from './posts';
import { useLang, useContent } from '../i18n/LanguageContext';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import LightningBolt from './LightningBolt';

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
  const [strike, setStrike] = useState(0);
  const fire = () => setStrike((s) => s + 1);
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
    return (
      <div className="blog-root">
        {topbar}
        <div className="blg-index blg-library">
          <div className="blg-index-head">
            <div className="eyebrow">{c.blog.entryEyebrow}</div>
            <h1>{c.blog.chooseTitle}</h1>
            <p className="blg-index-intro">{c.blog.chooseIntro}</p>
          </div>

          <div className="blg-choice-grid" aria-label={c.blog.chooseTitle}>
            <LightningBolt run={strike} />
            <Link className="blg-choice-card lab" to="/blog?section=lab" onMouseEnter={fire} onFocus={fire}>
              <span className="blg-choice-icon" aria-hidden="true">
                <FlaskConical size={24} strokeWidth={1.7} />
              </span>
              <span className="blg-choice-kicker">{labPosts.length} {c.blog.postsLabel}</span>
              <span className="blg-choice-title">{c.blog.labChoiceTitle}</span>
              <span className="blg-choice-body">{c.blog.labChoiceBody}</span>
              <span className="blg-choice-cta">{c.blog.openSection}<ArrowRight size={15} strokeWidth={1.8} /></span>
            </Link>

            <Link className="blg-choice-card thesis" to="/thesis" onMouseEnter={fire} onFocus={fire}>
              <span className="blg-choice-icon" aria-hidden="true">
                <BookOpen size={24} strokeWidth={1.7} />
              </span>
              <span className="blg-choice-kicker">3 {c.blog.chaptersLabel}</span>
              <span className="blg-choice-title">{c.blog.thesisChoiceTitle}</span>
              <span className="blg-choice-body">{c.blog.thesisChoiceBody}</span>
              <span className="blg-choice-cta">{c.blog.openSection}<ArrowRight size={15} strokeWidth={1.8} /></span>
            </Link>
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
              <Link className="blg-row" to={`/blog/${p.slug}`}>
                <div className="meta">
                  <span>{p.date.replace(/-/g, ' · ')}</span>
                  <span className={'blg-chip ' + p.contentType}>{ct(p.contentType)}</span>
                </div>
                <h2>{p.title}</h2>
                <p>{p.excerpt}</p>
              </Link>
            </li>
          ))}
          {labPosts.length === 0 && <li className="blg-loading">{c.blog.noPosts}</li>}
        </ul>
      </div>
    </div>
  );
}
