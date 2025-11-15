import React, { StrictMode } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import './NewStyles.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { DataSyncProvider } from './context/DataSyncContext.jsx';
import { UIStateProvider } from './context/UIStateContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { db } from './db.js';

// ========================================
// ENREGISTREMENT DU SERVICE WORKER (PWA)
// ========================================
// Ceci enregistrera le Service Worker généré par vite-plugin-pwa
// avec une mise à jour automatique.
registerSW({ immediate: true });

// Détecter les changements de connexion
window.addEventListener('online', () => {
  console.log('🌐 Connexion rétablie');
});

window.addEventListener('offline', () => {
  console.log('📡 Mode hors ligne');
});
window.db = db;
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <UIStateProvider>
          <DataSyncProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </DataSyncProvider>
        </UIStateProvider>
      </AuthProvider>
    </Router>
  </StrictMode>
);