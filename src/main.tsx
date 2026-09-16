import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA service worker via VitePWA
try {
  registerSW({
    immediate: true,
    onRegistered(r) {
      console.log('[Reco] VitePWA SW registered:', r);
    },
    onRegisterError(error) {
      console.warn('[Reco] VitePWA SW registration error:', error);
    },
  });
} catch (e) {
  console.warn('[Reco] virtual:pwa-register init notice:', e);
}

// Ensure native navigator service worker is registered for standalone WebAPK compliance
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[Reco] Native SW active:', reg.scope);
      })
      .catch((err) => {
        console.log('[Reco] Native SW register notice:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
