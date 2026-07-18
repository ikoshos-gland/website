import React, { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Loader from './components/Loader';

// Lazy load below-the-fold components for better initial load
const Categories = lazy(() => import('./components/Categories'));
const MyStory = lazy(() => import('./components/MyStory'));
const FilterBar = lazy(() => import('./components/FilterBar'));
const CaseStudies = lazy(() => import('./components/CaseStudies'));
const Process = lazy(() => import('./components/Process'));
const Publications = lazy(() => import('./components/Philosophy'));
const Testimonials = lazy(() => import('./components/Testimonials'));
const Footer = lazy(() => import('./components/Footer'));
const HomeBlog = lazy(() => import('./components/HomeBlog'));
// Lazy: pulls the react-markdown / remark-gfm stack out of the entry chunk
const ChatWidget = lazy(() => import('./components/ChatWidget'));

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  // Defer mounting the chat (and its markdown chunk) until the user first opens it
  const [chatMounted, setChatMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const after = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

    // Reveal as soon as fonts are ready, but never block on the font CDN for
    // more than 800ms (display=swap already prevents invisible text). Keep a
    // small 400ms floor so the loader doesn't flash — NOT a 500ms floor stacked
    // on top of fonts + an image. The below-the-fold MyStory image is lazy-loaded
    // by its own component, so it no longer gates the reveal here.
    Promise.all([
      Promise.race([document.fonts.ready, after(800)]),
      after(400),
    ]).then(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      {/* Loader overlay */}
      {isLoading && <Loader />}

      {/* Main content - mounted immediately but hidden until loading done */}
      <div
        className="w-full min-h-screen bg-[#0E0F11] relative overflow-hidden text-[#A1A1A6]"
        style={{
          opacity: isLoading ? 0 : 1,
          visibility: isLoading ? 'hidden' : 'visible',
          transition: 'opacity 0.3s ease-out'
        }}
      >
        <Navbar onChatClick={() => { setChatMounted(true); setIsChatOpen(true); }} />
        <main className="w-full mt-20">
          <Hero />
          <Suspense fallback={<div className="min-h-[200px]" />}>
            <Categories />
            <MyStory />
            <FilterBar />
            <CaseStudies />
            <Publications />
            <Process />
            <Testimonials />
            <HomeBlog />
            <Footer />
          </Suspense>
        </main>
      </div>
      {chatMounted && (
        <Suspense fallback={null}>
          <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </Suspense>
      )}
    </>
  );
}

export default App;
