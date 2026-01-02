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
import ChatWidget from './components/ChatWidget';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    // Smart loading: wait for critical resources - non-blocking approach
    const preloadCriticalResources = async () => {
      const criticalImages = [
        'https://i.ibb.co/rfqN2BC2/Whats-App-mage-2024-10-04-at-20-37-32-526fd566.jpg'
      ];

      // Wait for fonts to be ready
      await document.fonts.ready;

      // Preload critical images
      await Promise.all(criticalImages.map(src => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        });
      }));

      // Minimum 500ms for nice loader animation (reduced from 1.5s)
      // Spline now loads independently in Hero.tsx, no blocking
      await new Promise(r => setTimeout(r, 500));
      setIsLoading(false);
    };

    preloadCriticalResources();
  }, []);

  return (
    <>
      {/* Loader overlay */}
      {isLoading && <Loader />}

      {/* Main content - mounted immediately but hidden until loading done */}
      <div
        className="max-w-[1600px] mx-auto min-h-screen bg-[#0E0F11] relative overflow-hidden text-[#A1A1A6]"
        style={{
          opacity: isLoading ? 0 : 1,
          visibility: isLoading ? 'hidden' : 'visible',
          transition: 'opacity 0.3s ease-out'
        }}
      >
        <Navbar onChatClick={() => setIsChatOpen(true)} />
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
            <Footer />
          </Suspense>
        </main>
      </div>
      <ChatWidget isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}

export default App;