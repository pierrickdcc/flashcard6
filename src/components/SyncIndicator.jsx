// src/components/SyncIndicator.jsx
import React from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SyncIndicator = () => {
  const { isOnline, isSyncing, lastSync } = useDataSync();

  const getTimeAgo = (date) => {
    if (!date) return 'Jamais';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    return `Il y a ${Math.floor(seconds / 86400)} j`;
  };

  return (
    <div className="sync-indicator" style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              background: 'var(--background-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: 'var(--shadow-lg)',
              fontSize: '0.875rem',
              color: 'var(--text-heading-color)'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <RefreshCw size={16} style={{ color: 'var(--primary-color)' }} />
            </motion.div>
            Synchronisation...
          </motion.div>
        )}
      </AnimatePresence>

      <div
        style={{
          background: 'var(--background-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.5rem 0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: 'var(--shadow-sm)',
          fontSize: '0.75rem',
          color: 'var(--text-color)',
          cursor: 'pointer'
        }}
        title={`Dernière sync: ${getTimeAgo(lastSync)}`}
      >
        {isOnline ? (
          <Cloud size={14} style={{ color: '#10b981' }} />
        ) : (
          <CloudOff size={14} style={{ color: '#ef4444' }} />
        )}
        <span style={{ fontSize: '0.75rem' }}>
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
      </div>
    </div>
  );
};

export default SyncIndicator;