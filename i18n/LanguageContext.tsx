import React, { createContext, useContext, useEffect, useState } from 'react';
import { CONTENT, LANGS, type Lang, type ContentShape } from './content';

const KEY = 'mertoshi-lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY) as Lang | null;
    if (saved && (LANGS as string[]).includes(saved)) return saved;
  } catch { /* ignore */ }
  return 'en'; // default: English
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LangCtx = createContext<Ctx>({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    try { localStorage.setItem(KEY, lang); } catch { /* ignore */ }
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang]);

  return <LangCtx.Provider value={{ lang, setLang: setLangState }}>{children}</LangCtx.Provider>;
}

export function useLang() { return useContext(LangCtx); }

export function useContent(): ContentShape { return CONTENT[useContext(LangCtx).lang]; }
