import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Categories from './components/Categories';
import MyStory from './components/MyStory';
import FilterBar from './components/FilterBar';
import CaseStudies from './components/CaseStudies';
import Process from './components/Process';
import Publications from './components/Philosophy';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import Loader from './components/Loader';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading sequence
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="max-w-[1600px] mx-auto min-h-screen bg-[#0E0F11] relative overflow-hidden text-[#A1A1A6] animate-[fadeIn_1s_ease-out]">
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; filter: blur(10px); }
              to { opacity: 1; filter: blur(0); }
            }
          `}</style>
          <Navbar />
          <main className="w-full mt-20">
            <Hero />
            <Categories />
            <MyStory />
            <FilterBar />
            <CaseStudies />
            <Publications />
            <Process />
            <Testimonials />
            <Footer />
          </main>
        </div>
      )}
    </>
  );
}

export default App;