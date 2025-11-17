// src/components/ProfileModal.jsx
import React, { useState } from 'react';
import { LogOut, Download, Upload, Settings, User, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileModal = ({ isOpen, onClose, userEmail, onSignOut, onImport, onExport }) => {
  const [showExportOptions, setShowExportOptions] = useState(false);

  const handleExportChoice = (exportType) => {
    onExport(exportType);
    setShowExportOptions(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-background-card border border-border-color rounded-2xl shadow-lg w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-text-heading-color">Menu Profil</h2>
                <button onClick={onClose} className="text-text-muted hover:text-text-color transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="mb-6 text-center">
                <p className="text-sm text-text-muted mb-1">Connecté en tant que</p>
                <p className="text-base font-medium text-text-color truncate" title={userEmail}>
                  {userEmail}
                </p>
              </div>

              <nav className="space-y-2 mb-6">
                <a href="#" className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors">
                  <User size={20} className="text-text-muted" />
                  <span className="text-text-color font-medium">Mon Compte</span>
                </a>
                <a href="#" className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors">
                  <Settings size={20} className="text-text-muted" />
                  <span className="text-text-color font-medium">Paramètres</span>
                </a>
              </nav>

              <div className="space-y-2">
                <button onClick={onImport} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors text-left">
                  <Upload size={20} className="text-text-muted" />
                  <span className="text-text-color font-medium">Importer</span>
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowExportOptions(!showExportOptions)}
                        className="w-full flex justify-between items-center gap-4 p-3 rounded-lg hover:bg-background-hover transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <Download size={20} className="text-text-muted" />
                            <span className="text-text-color font-medium">Exporter</span>
                        </div>
                        <ChevronDown size={16} className={`text-text-muted transition-transform ${showExportOptions ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {showExportOptions && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-2 pl-8 pr-2 py-2 bg-background-body rounded-lg"
                            >
                                <button onClick={() => handleExportChoice('all')} className="block w-full text-left px-4 py-2 rounded-md hover:bg-background-hover text-text-color">Tout Exporter</button>
                                <button onClick={() => handleExportChoice('courses')} className="block w-full text-left px-4 py-2 rounded-md hover:bg-background-hover text-text-color">Cours Uniquement</button>
                                <button onClick={() => handleExportChoice('cards')} className="block w-full text-left px-4 py-2 rounded-md hover:bg-background-hover text-text-color">Flashcards Uniquement</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
              </div>

              <div className="border-t border-border-color my-6"></div>

              <button onClick={onSignOut} className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors">
                <LogOut size={20} />
                <span className="font-medium">Se déconnecter</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;
