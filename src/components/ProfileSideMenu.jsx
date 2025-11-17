// src/components/ProfileSideMenu.jsx
import React from 'react';
import { LogOut, Download, Upload, Settings, User } from 'lucide-react';
import { motion } from 'framer-motion';

const ProfileSideMenu = ({ userEmail, onSignOut, onImport, onExport }) => {
  const handleExportChoice = (exportType) => {
    onExport(exportType);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full right-0 mt-2 w-80 bg-background-card border border-border-color rounded-2xl shadow-lg z-50 overflow-hidden"
    >
      <div className="p-4">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm text-text-muted">Connecté en tant que</p>
          <p className="text-base font-semibold text-text-heading-color truncate" title={userEmail}>
            {userEmail}
          </p>
        </div>

        <nav className="flex flex-col gap-1 mb-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-hover transition-colors">
            <User size={18} className="text-text-muted" />
            <span className="text-text-color font-medium">Mon Compte</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-hover transition-colors">
            <Settings size={18} className="text-text-muted" />
            <span className="text-text-color font-medium">Paramètres</span>
          </a>
        </nav>

        <div className="border-t border-border-color my-2"></div>

        <div className="flex flex-col gap-1 mb-2">
          <button onClick={onImport} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-hover transition-colors text-left">
            <Upload size={18} className="text-text-muted" />
            <span className="text-text-color font-medium">Importer</span>
          </button>

          <div className="relative group">
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-background-hover transition-colors text-left">
              <div className="flex items-center gap-3">
                <Download size={18} className="text-text-muted" />
                <span className="text-text-color font-medium">Exporter</span>
              </div>
            </button>
            <div className="absolute left-full top-0 ml-2 mt-[-40px] w-48 bg-background-body border border-border-color rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
              <button onClick={() => handleExportChoice('all')} className="block w-full text-left px-4 py-2 hover:bg-background-hover text-text-color">Tout Exporter</button>
              <button onClick={() => handleExportChoice('courses')} className="block w-full text-left px-4 py-2 hover:bg-background-hover text-text-color">Cours Uniquement</button>
              <button onClick={() => handleExportChoice('cards')} className="block w-full text-left px-4 py-2 hover:bg-background-hover text-text-color">Flashcards Uniquement</button>
            </div>
          </div>
        </div>

        <div className="border-t border-border-color my-2"></div>

        <button onClick={onSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
          <LogOut size={18} />
          <span className="font-medium">Se déconnecter</span>
        </button>
      </div>
    </motion.div>
  );
};

export default ProfileSideMenu;
