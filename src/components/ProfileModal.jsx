// src/components/ProfileModal.jsx
import React, { useRef } from 'react';
import { LogOut, Download, Upload, Settings, User, X, FileJson, Package, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDataSync } from '../context/DataSyncContext';
import toast from 'react-hot-toast';

const ProfileModal = ({ isOpen, onClose, userEmail, onSignOut }) => {
  const { courses, cards, subjects, handleImport } = useDataSync();
  const fileInputRef = useRef(null);

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => handleImport(e.target.result);
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getSubjectName = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject ? subject.name : 'Inconnue';
  };

  const handleExport = (type) => {
    let dataToExport;
    let fileName = 'flash_export.json';

    switch (type) {
      case 'courses':
        dataToExport = courses.map(course => ({ ...course, subject_name: getSubjectName(course.subject_id) }));
        fileName = 'courses_export.json';
        break;
      case 'flashcards':
        dataToExport = cards.map(card => ({ ...card, subject_name: getSubjectName(card.subject_id) }));
        fileName = 'flashcards_export.json';
        break;
      case 'all':
      default:
        dataToExport = {
          courses: courses.map(course => ({ ...course, subject_name: getSubjectName(course.subject_id) })),
          cards: cards.map(card => ({ ...card, subject_name: getSubjectName(card.subject_id) })),
        };
        break;
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = fileName;
    link.click();
    toast.success('✅ Exportation réussie !');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--background-card)',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Handle bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '0.75rem 0',
            }}>
              <div style={{
                width: '40px',
                height: '4px',
                backgroundColor: 'var(--border-color)',
                borderRadius: '99px',
              }} />
            </div>

            {/* Header avec dégradé */}
            <div style={{
              background: 'var(--primary-gradient)',
              padding: '1.5rem',
              position: 'relative',
            }}>
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
              >
                <X size={18} color="white" />
              </button>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                }}>
                  <User size={32} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '1rem', 
                    color: 'white',
                    marginBottom: '0.25rem',
                    fontWeight: 600,
                  }}>
                    Mon Profil
                  </p>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: 'rgba(255, 255, 255, 0.8)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }} title={userEmail}>
                    {userEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '1rem' }}>
              {/* Navigation */}
              <div style={{ 
                marginBottom: '1rem',
              }}>
                <a
                  href="#"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    fontSize: '0.95rem',
                    color: 'var(--text-heading-color)',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                    backgroundColor: 'var(--muted-bg)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Settings size={20} />
                    <span>Paramètres</span>
                  </div>
                  <ChevronRight size={18} opacity={0.5} />
                </a>
              </div>

              {/* Import/Export Section */}
              <div style={{ 
                padding: '1rem',
                background: 'var(--muted-bg)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginBottom: '1rem',
              }}>
                <p style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem',
                }}>
                  Gestion des données
                </p>

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept=".json" 
                  onChange={handleFileSelected} 
                />

                <button
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: 'var(--text-heading-color)',
                    background: 'var(--background-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '0.75rem',
                  }}
                >
                  <Upload size={20} />
                  <span>Importer un fichier JSON</span>
                </button>

                <div>
                  <p style={{
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-heading-color)',
                    marginBottom: '0.5rem',
                  }}>
                    Exporter vos données
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { label: 'Cours', icon: FileJson, action: () => handleExport('courses') },
                      { label: 'Flashcards', icon: FileJson, action: () => handleExport('flashcards') },
                      { label: 'Tout exporter', icon: Package, action: () => handleExport('all'), highlight: true },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          fontSize: '0.875rem',
                          fontWeight: item.highlight ? 600 : 500,
                          color: item.highlight ? 'white' : 'var(--text-color)',
                          background: item.highlight ? 'var(--primary-gradient)' : 'var(--background-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <item.icon size={18} />
                        <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                        <Download size={16} opacity={0.7} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={onSignOut}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  padding: '1rem',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  color: 'white',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                }}
              >
                <LogOut size={20} />
                <span>Se déconnecter</span>
              </button>
            </div>

            {/* Bottom padding for safe area */}
            <div style={{ height: '1rem' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;