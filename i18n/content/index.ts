import { en, type ContentShape } from './en';
import { tr } from './tr';
import { de } from './de';

export type Lang = 'en' | 'tr' | 'de';
export type { ContentShape };

export const LANGS: Lang[] = ['en', 'tr', 'de'];
export const LANG_LABEL: Record<Lang, string> = { en: 'EN', tr: 'TR', de: 'DE' };
export const CONTENT: Record<Lang, ContentShape> = { en, tr, de };
