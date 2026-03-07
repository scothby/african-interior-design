import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './i18n';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <React.Suspense fallback={<div style={{ background: '#0C0806', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B8860B' }}>Loading...</div>}>
        <App />
      </React.Suspense>
    </HelmetProvider>
  </React.StrictMode>
);
