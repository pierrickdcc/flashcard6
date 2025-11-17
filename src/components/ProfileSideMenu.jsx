
import React, { useState, useRef } from 'react';
import { LogOut, Download, Upload, Settings, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataSync } from '../context/DataSyncContext';
import toast from 'react-hot-toast';

const ProfileSideMenu = ({ isOpen, onClose, userEmail, onSignOut }) => {
  const { courses, cards, handleImport } = useDataSync();
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

  const handleExport = () => {
    const dataToExport = { courses, cards };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = "flash_export.json";
    link.click();
    toast.success('Exportation réussie !');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full right-0 mt-2 w-72 bg-background-card shadow-lg rounded-xl border border-border z-50"
        >
          <div className="p-4 border-b border-border">
            <p className="text-sm text-muted-foreground">Connecté en tant que</p>
            <p className="font-medium text-text-color truncate">{userEmail}</p>
          </div>

          <div className="p-2">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted-bg transition-colors">
              <User size={16} />
              <span>Mon Compte</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted-bg transition-colors">
              <Settings size={16} />
              <span>Paramètres</span>
            </button>
          </div>

          <div className="p-2 border-t border-border">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileSelected} />
            <button onClick={() => fileInputRef.current.click()} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted-bg transition-colors">
              <Upload size={16} />
              <span>Importer</span>
            </button>
            <button onClick={handleExport} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-muted-bg transition-colors">
              <Download size={16} />
              <span>Exporter</span>
            </button>
          </div>

          <div className="p-2 border-t border-border">
            <button onClick={onSignOut} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-red-500 hover:bg-red-500 hover:text-white transition-colors">
              <LogOut size={16} />
              <span>Se déconnecter</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileSideMenu;
