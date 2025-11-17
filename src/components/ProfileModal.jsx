// src/components/ProfileModal.jsx
import React, { useRef } from 'react';
import { LogOut, Download, Upload, Settings, User, X } from 'lucide-react';
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
        dataToExport = courses.map(course => ({
          ...course,
          subject_name: getSubjectName(course.subject_id),
        }));
        fileName = 'courses_export.json';
        break;
      case 'flashcards':
        dataToExport = cards.map(card => ({
          ...card,
          subject_name: getSubjectName(card.subject_id),
        }));
        fileName = 'flashcards_export.json';
        break;
      case 'all':
      default:
        dataToExport = {
          courses: courses.map(course => ({
            ...course,
            subject_name: getSubjectName(course.subject_id),
          })),
          cards: cards.map(card => ({
            ...card,
            subject_name: getSubjectName(card.subject_id),
          })),
        };
        break;
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = fileName;
    link.click();
    toast.success('Exportation réussie !');
    onClose();
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100vh' }}
            animate={{ y: 0 }}
            exit={{ y: '100vh' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="bg-background-card rounded-t-2xl shadow-xl w-full max-w-md mx-auto fixed bottom-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-divider">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Menu Profil</h2>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-background-body">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-text-secondary truncate mt-1">{userEmail}</p>
            </div>

            <nav className="p-2">
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-body">
                <User size={20} />
                <span>Mon Compte</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-body">
                <Settings size={20} />
                <span>Paramètres</span>
              </a>
            </nav>

            <div className="p-2 border-t border-divider">
              <h3 className="px-3 text-sm font-semibold text-text-secondary mb-1">Importer / Exporter</h3>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileSelected} />
              <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-background-body">
                <Upload size={20} />
                <span>Importer</span>
              </button>
              <div className="px-3 py-2.5">
                <p className="text-sm mb-2">Exporter vos données :</p>
                <div className="flex gap-2">
                  <button onClick={() => handleExport('courses')} className="export-button">Cours</button>
                  <button onClick={() => handleExport('flashcards')} className="export-button">Flashcards</button>
                  <button onClick={() => handleExport('all')} className="export-button">Tout</button>
                </div>
              </div>
            </div>

            <div className="p-2 border-t border-divider">
              <button onClick={onSignOut} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10">
                <LogOut size={20} />
                <span>Se déconnecter</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
