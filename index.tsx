import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import { LanguageProvider } from './i18n/LanguageContext';
import './index.css';

const BlogIndex = lazy(() => import('./blog/BlogIndex'));
const BlogPost = lazy(() => import('./blog/BlogPost'));
const ThesisHub = lazy(() => import('./blog/ThesisHub'));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/thesis" element={<ThesisHub />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>
);