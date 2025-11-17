// src/components/ProfileSideMenu.jsx
import React, { useRef } from 'react';
import { LogOut, Download, Upload, Settings, User } from 'lucide-react';
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
    toast.success('Exportation réussie !');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute top-full right-0 mt-2 w-72 origin-top-right bg-background-card border border-divider rounded-xl shadow-lg z-50"
          onClick={onClose}
        >
          <div className="p-3">
            <div className="px-2 py-1">
              <p className="text-sm font-medium text-text-primary">Connecté en tant que</p>
              <p className="text-sm text-text-secondary truncate" title={userEmail}>{userEmail}</p>
            </div>

            <nav className="mt-2">
              <a href="#" className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-background-body">
                <User size={16} />
                <span>Mon Compte</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-background-body">
                <Settings size={16} />
                <span>Paramètres</span>
              </a>
            </nav>

            <div className="mt-2 pt-2 border-t border-divider">
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileSelected} />
              <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-3 w-full px-2 py-2 text-sm rounded-md hover:bg-background-body">
                <Upload size={16} />
                <span>Importer</span>
              </button>
              <div className="text-sm px-2 py-2">
                <p className="font-medium text-text-primary mb-2">Exporter</p>
                <div className="flex flex-col gap-1">
                  <button onClick={() => handleExport('courses')} className="export-button-dropdown">Exporter les cours</button>
                  <button onClick={() => handleExport('flashcards')} className="export-button-dropdown">Exporter les flashcards</button>
                  <button onClick={() => handleExport('all')} className="export-button-dropdown">Exporter tout</button>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-divider">
              <button onClick={onSignOut} className="flex items-center gap-3 w-full px-2 py-2 text-sm rounded-md text-red-500 hover:bg-red-500/10">
                <LogOut size={16} />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileSideMenu;
