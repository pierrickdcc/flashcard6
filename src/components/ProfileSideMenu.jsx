
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
          className="profile-menu"
        >
          <div className="profile-menu-header">
            <p className="profile-menu-user-label">Connecté en tant que</p>
            <p className="profile-menu-user-email" title={userEmail}>{userEmail}</p>
          </div>

          <nav className="profile-menu-section">
            <a href="#" className="profile-menu-item">
              <User size={16} />
              <span>Mon Compte</span>
            </a>
            <a href="#" className="profile-menu-item">
              <Settings size={16} />
              <span>Paramètres</span>
            </a>
          </nav>

          <div className="profile-menu-section">
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileSelected} />
            <button onClick={() => fileInputRef.current.click()} className="profile-menu-item">
              <Upload size={16} />
              <span>Importer</span>
            </button>
            <button onClick={handleExport} className="profile-menu-item">
              <Download size={16} />
              <span>Exporter</span>
            </button>
          </div>

          <div className="profile-menu-section">
            <button onClick={onSignOut} className="profile-menu-item profile-menu-item-logout">
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
