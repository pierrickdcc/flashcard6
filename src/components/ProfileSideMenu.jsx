import React, { useState, useRef } from 'react';
import { X, LogOut, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataSync } from '../context/DataSyncContext';
import toast from 'react-hot-toast';

const ProfileSideMenu = ({ isOpen, onClose, userEmail, onSignOut }) => {
  const [exportCourses, setExportCourses] = useState(true);
  const [exportFlashcards, setExportFlashcards] = useState(true);
  const { courses, cards, handleImport } = useDataSync();
  const fileInputRef = useRef(null);

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      handleImport(content);
      // Reset file input
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (!exportCourses && !exportFlashcards) {
      toast.error('Veuillez sélectionner au moins un type de données à exporter.');
      return;
    }

    const dataToExport = {};
    if (exportCourses) {
      dataToExport.courses = courses;
    }
    if (exportFlashcards) {
      dataToExport.cards = cards;
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "flash_export.json";

    link.click();
    toast.success('Exportation réussie !');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Side Menu */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-background-card shadow-lg z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-text-heading-color">Profil</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-muted-bg"
                aria-label="Fermer le menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-grow p-4 overflow-y-auto">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Connecté en tant que</p>
                <p className="font-medium text-text-color">{userEmail}</p>
              </div>

              {/* Import/Export Section */}
              <div className="space-y-4">
                <h3 className="text-md font-semibold text-text-heading-color border-t border-border pt-4">Exporter vos données</h3>
                <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportCourses}
                        onChange={(e) => setExportCourses(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Exporter les cours</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={exportFlashcards}
                        onChange={(e) => setExportFlashcards(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Exporter les flashcards</span>
                    </label>
                </div>
                <button
                  onClick={handleExport}
                  className="w-full btn btn-secondary justify-start mt-2"
                >
                  <Download size={16} />
                  <span>Exporter en JSON</span>
                </button>

                <h3 className="text-md font-semibold text-text-heading-color border-t border-border pt-4">Importer des données</h3>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".json"
                  onChange={handleFileSelected}
                />
                <button
                  className="w-full btn btn-secondary justify-start"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Upload size={16} />
                  <span>Importer un fichier JSON</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border">
                <button
                  onClick={onSignOut}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-muted-bg transition-colors text-red-400 hover:text-red-300"
                >
                  <LogOut size={16} />
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