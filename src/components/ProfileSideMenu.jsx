// src/components/ProfileSideMenu.jsx
import React, { useRef } from 'react';
import { LogOut, Download, Upload, Settings, User, FileJson, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataSync } from '../context/DataSyncContext';
import toast from 'react-hot-toast';

const ProfileSideMenu = ({ isOpen, onClose, userEmail, onSignOut }) => {
  const { courses, cards, subjects, handleImport } = useDataSync();
  const fileInputRef = useRef(null);

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => handleImport(e.target.result);
      reader.readAsText(file);
      if(fileInputRef.current) fileInputRef.current.value = "";
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
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 999,
            }}
          />
          
          {/* Menu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20, y: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 20, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '4.5rem',
              right: '1.5rem',
              width: '320px',
              maxHeight: 'calc(100vh - 6rem)',
              overflowY: 'auto',
              backgroundColor: 'var(--background-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              zIndex: 1000,
            }}
          >
            {/* Header avec dégradé */}
            <div style={{
              background: 'var(--primary-gradient)',
              padding: '1.5rem',
              borderRadius: '16px 16px 0 0',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.5rem',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                }}>
                  <User size={24} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: 'rgba(255, 255, 255, 0.9)',
                    marginBottom: '0.25rem',
                    fontWeight: 500,
                  }}>
                    Connecté en tant que
                  </p>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'rgba(255, 255, 255, 0.7)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }} title={userEmail}>
                    {userEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div style={{ padding: '0.5rem' }}>
              <a
                href="#"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-color)',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted-bg)';
                  e.currentTarget.style.color = 'var(--text-heading-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-color)';
                }}
              >
                <Settings size={18} />
                <span>Paramètres</span>
              </a>
            </div>

            {/* Import/Export Section */}
            <div style={{ 
              padding: '0.5rem',
              borderTop: '1px solid var(--border-color)',
              marginTop: '0.5rem',
            }}>
              <p style={{
                padding: '0.75rem 1rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Données
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
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  color: 'var(--text-color)',
                  background: 'none',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted-bg)';
                  e.currentTarget.style.color = 'var(--text-heading-color)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-color)';
                }}
              >
                <Upload size={18} />
                <span>Importer</span>
              </button>

              <div style={{ padding: '0.5rem 1rem' }}>
                <p style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--text-heading-color)',
                  marginBottom: '0.5rem',
                }}>
                  Exporter
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {[
                    { label: 'Cours', icon: FileJson, action: () => handleExport('courses') },
                    { label: 'Flashcards', icon: FileJson, action: () => handleExport('flashcards') },
                    { label: 'Tout', icon: Package, action: () => handleExport('all') },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-color)',
                        background: 'var(--muted-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = 'var(--primary-color)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--muted-bg)';
                        e.currentTarget.style.color = 'var(--text-color)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <item.icon size={14} />
                      <span>{item.label}</span>
                      <Download size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logout */}
            <div style={{ 
              padding: '0.5rem',
              borderTop: '1px solid var(--border-color)',
              marginTop: '0.5rem',
            }}>
              <button
                onClick={onSignOut}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  fontSize: '0.875rem',
                  color: '#ef4444',
                  background: 'none',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.currentTarget.style.color = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#ef4444';
                }}
              >
                <LogOut size={18} />
                <span>Se déconnecter</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileSideMenu;