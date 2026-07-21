import React from 'react';
import { useLang } from '../i18n/LanguageContext';
import { GLOSSARY } from './glossary';
import SlurmFlow from './SlurmFlow';
import PartitionQueue from './PartitionQueue';
import WallClock from './WallClock';
import InodeContainer from './InodeContainer';
import ExpansionMicro from './ExpansionMicro';
import ScaleEscalation from './ScaleEscalation';
import FFNFlood from './FFNFlood';
import DiffractionLimit from './DiffractionLimit';
import ExpansionChemistry from './ExpansionChemistry';
import ExpansionSlice from './ExpansionSlice';
import MouseBrainExpansion from './MouseBrainExpansion';
import SplitMerge from './SplitMerge';
import FFNvsLSD from './FFNvsLSD';
import LabPipeline from './LabPipeline';
import GloveBoxGelation from './GloveBoxGelation';
import ClaheHistogram from './ClaheHistogram';
import SofimaMontage from './SofimaMontage';
import ConnectomicsComparison from './ConnectomicsComparison';
import VolumeLeap from './VolumeLeap';
import NeuronViewer from './NeuronViewer';
import NeuronCompare from './NeuronCompare';

export const DropCap: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <span className="blg-dropcap">{children}</span>
);

export const Aside: React.FC<{ title?: string; children?: React.ReactNode }> = ({ title, children }) => (
  <aside className="blg-aside">{title && <b>{title}</b>}{children}</aside>
);

export const Console: React.FC<{ title?: string; body?: string }> = ({ title, body }) => (
  <div className="blg-console">
    <div className="bar"><span className="dot" /><span className="dot" /><span className="dot" /><span className="ttl">{title}</span></div>
    <pre>{body}</pre>
  </div>
);

// Altyazi iki yolla verilebilir:
//   caption="düz metin"                 → basit, ama [@atif] burada islenmez (prop bir string).
//   <Figure ...>Şekil 4. ... [@key]</Figure> → cocuk icerik markdown olarak islenir,
//                                             yani atif numaralanir ve kaynakcaya girer.
// caption verilirse o kazanir, yoksa cocuk icerik altyaziya duser.
export const Figure: React.FC<{ src: string; alt?: string; caption?: string; children?: React.ReactNode }> = ({ src, alt, caption, children }) => (
  <figure className="blg-specimen">
    <div className="frame"><img src={src} alt={alt || ''} loading="lazy" decoding="async" /></div>
    {caption ? <figcaption>{caption}</figcaption> : children ? <figcaption>{children}</figcaption> : null}
  </figure>
);

export const Pull: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <p className="blg-pull">{children}</p>
);

// Inline glossary term: dotted-underlined text with a hover/focus tooltip whose
// definition follows the reader's language. Falls back to plain text if the key
// is unknown. Usage in MDX: <Term k="connectome">connectome</Term>
export const Term: React.FC<{ k: string; children?: React.ReactNode }> = ({ k, children }) => {
  const { lang } = useLang();
  const entry = GLOSSARY[k];
  if (!entry) return <>{children}</>;
  const def = entry.def[lang] || entry.def.en;
  return (
    <span className="blg-term" tabIndex={0} role="note" aria-label={def}>
      {children}
      <span className="blg-term-pop" aria-hidden="true">{def}</span>
    </span>
  );
};

// Map passed to MDXProvider: lowercase tags are restyled, custom components are
// made available to every post without an explicit import.
export const mdxComponents = {
  h2: (props: any) => <h2 className="blg-sec" {...props} />,
  a: (props: any) => <a className="blg-link" {...props} />,
  DropCap,
  Aside,
  Console,
  Figure,
  Pull,
  Term,
  SlurmFlow,
  PartitionQueue,
  WallClock,
  InodeContainer,
  ExpansionMicro,
  ScaleEscalation,
  FFNFlood,
  DiffractionLimit,
  ExpansionChemistry,
  ExpansionSlice,
  MouseBrainExpansion,
  SplitMerge,
  FFNvsLSD,
  LabPipeline,
  GloveBoxGelation,
  ClaheHistogram,
  SofimaMontage,
  ConnectomicsComparison,
  VolumeLeap,
  NeuronViewer,
  NeuronCompare,
};
