import React from 'react';
import { useLang } from './LanguageContext';
import { LANGS, LANG_LABEL } from './content';

// Self-contained EN/TR/DE pill switcher. Tailwind utilities apply globally (the
// blog's scoped .blog-root CSS doesn't override them), so one component works in
// both the site navbar and the blog topbar.
export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex items-center gap-0.5 rounded-full border border-white/10 p-0.5 ${className}`} role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={l === lang}
          className={`px-2 py-0.5 text-[11px] font-mono tracking-[0.15em] rounded-full transition-colors ${l === lang ? 'text-white bg-white/15' : 'text-[#7C7E85] hover:text-white'}`}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
