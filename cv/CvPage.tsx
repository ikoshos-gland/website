import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Download, Printer, ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useLang } from '../i18n/LanguageContext';

const ChatWidget = lazy(() => import('../components/ChatWidget'));

const CV_EMBED = '/cv-assets/mert-koca-cv-embed.html';
const CV_HTML = '/cv-assets/mert-koca-cv.html';
const CV_PDF = '/cv-assets/mert-koca-cv.pdf';

const T = {
  en: {
    eyebrow: 'Curriculum Vitae',
    sub: 'Molecular Biotechnology · Neuroscience · AI & Connectomics',
    download: 'Download PDF', print: 'Print', open: 'Open in new tab', back: '← Back to Mertoshi',
    lundoMsg: 'Curious about something that is not on the CV? Ask Lundo, Mert’s AI assistant, anything.',
    lundoBtn: 'Ask Lundo',
  },
  tr: {
    eyebrow: 'Özgeçmiş',
    sub: 'Moleküler Biyoteknoloji · Nörobilim · YZ & Konnektomik',
    download: 'PDF İndir', print: 'Yazdır', open: 'Yeni sekmede aç', back: '← Mertoshi’ye dön',
    lundoMsg: 'Merak ettiğiniz, CV’de yer almayan konuları Lundo’ya, Mert’in yapay zekâ asistanına sorabilirsiniz.',
    lundoBtn: 'Lundo’ya sor',
  },
  de: {
    eyebrow: 'Lebenslauf',
    sub: 'Molekulare Biotechnologie · Neurowissenschaft · KI & Konnektomik',
    download: 'PDF herunterladen', print: 'Drucken', open: 'In neuem Tab öffnen', back: '← Zurück zu Mertoshi',
    lundoMsg: 'Neugierig auf etwas, das nicht im Lebenslauf steht? Fragen Sie Lundo, Merts KI-Assistenten.',
    lundoBtn: 'Frag Lundo',
  },
};

export default function CvPage() {
  const { lang } = useLang();
  const t = T[lang as keyof typeof T] ?? T.en;

  const [isChatOpen, setChatOpen] = useState(false);
  const [chatMounted, setChatMounted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const openChat = () => { setChatMounted(true); setChatOpen(true); };

  const fit = useCallback(() => {
    const f = iframeRef.current;
    try {
      const doc = f?.contentDocument;
      if (doc) f!.style.height = doc.documentElement.scrollHeight + 'px';
    } catch {
      /* cross-origin guard, never happens same-origin */
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(fit, 350);
    window.addEventListener('resize', fit);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('resize', fit);
    };
  }, [fit]);

  const printCv = () => {
    try {
      iframeRef.current?.contentWindow?.focus();
      iframeRef.current?.contentWindow?.print();
    } catch {
      window.open(CV_HTML, '_blank', 'noopener');
    }
  };

  return (
    <>
      <div className="max-w-[1600px] mx-auto min-h-screen bg-[#0E0F11] relative overflow-hidden text-[#A1A1A6]">
        <Navbar onChatClick={openChat} />

        <main className="w-full mt-24 sm:mt-28 px-4 md:px-8 pb-24">
          <div className="max-w-[900px] mx-auto">
            <Link
              to="/"
              className="text-[10px] font-mono uppercase tracking-widest text-[#A1A1A6] hover:text-[#D6FF4F] transition-colors"
            >
              {t.back}
            </Link>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 border-b border-[#23252B] pb-8">
              <div>
                <span className="text-[10px] font-mono text-[#F5F5F5] uppercase tracking-widest">{t.eyebrow}</span>
                <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl text-[#F5F5F5] mt-3 leading-none">Mert Koca</h1>
                <p className="text-sm text-[#A1A1A6] mt-3">{t.sub}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={CV_PDF}
                  download="Mert-Koca-CV.pdf"
                  className="inline-flex items-center gap-2 bg-[#F5F5F5] text-[#0E0F11] px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors"
                >
                  <Download size={15} strokeWidth={2} /> {t.download}
                </a>
                <button
                  onClick={printCv}
                  className="inline-flex items-center gap-2 border border-[#2c2f36] text-[#F5F5F5] px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider hover:border-[#D6FF4F] hover:text-[#D6FF4F] transition-colors"
                >
                  <Printer size={15} strokeWidth={2} /> {t.print}
                </button>
                <a
                  href={CV_HTML}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#A1A1A6] px-2 py-2.5 text-xs font-semibold uppercase tracking-wider hover:text-[#F5F5F5] transition-colors"
                >
                  <ExternalLink size={15} strokeWidth={2} /> {t.open}
                </a>

                {/* small, subtle "ask Lundo about anything not on the CV" affordance */}
                <span className="hidden sm:block w-px h-5 bg-[#2c2f36]" aria-hidden="true" />
                <button
                  onClick={openChat}
                  title={t.lundoMsg}
                  className="group inline-flex items-center gap-2 text-[#A1A1A6] px-1.5 py-2.5 text-xs font-semibold uppercase tracking-wider hover:text-[#D6FF4F] transition-colors"
                >
                  <img
                    src="/lundo-logo.png"
                    alt=""
                    width={20}
                    height={20}
                    loading="lazy"
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-[#2c2f36] group-hover:ring-[#D6FF4F] transition-colors"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  {t.lundoBtn}
                </button>
              </div>
            </div>
          </div>

          {/* The CV document, rendered as a light "paper" on the dark page */}
          <div className="max-w-[900px] mx-auto mt-8">
            <iframe
              ref={iframeRef}
              src={CV_EMBED}
              title="Mert Koca — CV"
              loading="eager"
              onLoad={fit}
              className="w-full block"
              style={{ border: 'none', background: 'transparent', minHeight: '80vh' }}
            />
          </div>
        </main>
      </div>

      {chatMounted && (
        <Suspense fallback={null}>
          <ChatWidget isOpen={isChatOpen} onClose={() => setChatOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
