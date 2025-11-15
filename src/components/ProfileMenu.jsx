import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/DataSyncContext';
import { motion, AnimatePresence } from 'framer-motion';

const ProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const menuRef = useRef(null);
  const { session } = useAuth();
  const { signOut } = useDataSync();

  // Fermer le menu si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsConfirming(false); // Reset confirmation aussi
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
  };

  const toggleMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
    setIsConfirming(false); // Reset confirmation quand on ouvre/ferme
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        className="avatar"
        onClick={toggleMenu}
        onMouseDown={(e) => e.preventDefault()}
        aria-label="Menu profil"
        type="button"
      >
        <User size={20} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-background-card border border-border rounded-xl shadow-xl overflow-hidden z-50"
            style={{ pointerEvents: 'auto' }}
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium text-text-heading-color">
                {session?.user?.email}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Compte utilisateur
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {!isConfirming ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsConfirming(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 hover:bg-muted-bg transition-colors text-red-400 hover:text-red-300"
                >
                  <LogOut size={16} />
                  <span>Se déconnecter</span>
                </button>
              ) : (
                <div className="px-4 py-3">
                  <p className="text-sm text-text-heading-color mb-3">
                    Êtes-vous sûr de vouloir vous déconnecter ?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSignOut();
                      }}
                      className="btn btn-danger flex-1 text-xs py-2"
                    >
                      Oui, déconnecter
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsConfirming(false);
                      }}
                      className="btn btn-secondary flex-1 text-xs py-2"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileMenu;