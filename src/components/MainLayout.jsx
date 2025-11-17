// src/components/MainLayout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import NavigationBar from './NavigationBar';
import FloatingActionButton from './FloatingActionButton';
import StatsBanner from './StatsBanner';
import SyncIndicator from './SyncIndicator';
import { useUIState } from '../context/UIStateContext';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/DataSyncContext';
import { useState } from 'react';

// Import all modals
import ProfileModal from './ProfileModal';
import AddContentModal from './AddContentModal';
import AddSubjectModal from './AddSubjectModal';
import ConfigModal from './ConfigModal';
import DeleteSubjectModal from './DeleteSubjectModal';
import SignOutConfirmationModal from './SignOutConfirmationModal';
import MemoModal from './MemoModal';
import ReviewSessionSetup from './ReviewSessionSetup';

// Hook pour la détection de la taille de l'écran
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

const MainLayout = ({ children }) => {
  const {
    showAddContentModal, setShowAddContentModal, cardToEdit, courseToEdit,
    showAddSubjectModal, setShowAddSubjectModal,
    showConfigModal, setShowConfigModal,
    showDeleteSubjectModal, setShowDeleteSubjectModal,
    showSignOutModal, setShowSignOutModal,
    showMemoModal, setShowMemoModal, memoToEdit,
    subjectToDelete,
    showReviewSetupModal, setShowReviewSetupModal,
  } = useUIState();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { session } = useAuth();
  const { signOut, subjects, startReview, cards, courses, handleImport } = useDataSync();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const profileMenuRef = useRef(null);

  const handleStartReview = async (options) => {
    const subjectFilter = options.subjectId === 'all' ? ['all'] : [options.subjectId];
    const success = await startReview(subjectFilter, options.isCramMode, options.includeFuture);
    if (success) setShowReviewSetupModal(false);
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(prev => !prev);
  };

  const closeProfileMenu = () => {
    setProfileMenuOpen(false);
  };

  // Fermer le menu si on clique en dehors (pour desktop)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        const profileButton = document.querySelector('.header-profile-button');
        if (profileButton && !profileButton.contains(event.target)) {
          closeProfileMenu();
        }
      }
    };

    if (isProfileMenuOpen && isDesktop) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileMenuOpen, isDesktop]);

  const handleExport = (exportType) => {
    let dataToExport;
    let fileName = 'flash_export.json';

    switch (exportType) {
      case 'courses':
        dataToExport = { courses };
        fileName = 'flash_export_courses.json';
        break;
      case 'cards':
        dataToExport = { cards };
        fileName = 'flash_export_cards.json';
        break;
      case 'all':
      default:
        dataToExport = { courses, cards };
        break;
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = fileName;
    link.click();
    toast.success('Exportation réussie !');
    closeProfileMenu();
  };

  const fileInputRef = useRef(null);

  const handleFileSelected = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => handleImport(e.target.result);
      reader.readAsText(file);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
    closeProfileMenu();
  };

  const toggleProfileModal = () => setIsProfileModalOpen(!isProfileModalOpen);

  const location = useLocation();
  const currentPath = location.pathname;
  let fabOnClick = () => setShowAddContentModal(true);
  let isFabVisible = true;

  if (currentPath === '/memos') fabOnClick = () => setShowMemoModal(true);
  else if (currentPath === '/stats') isFabVisible = false;

  return (
    <div className="min-h-screen bg-background-body">
      {location.pathname !== '/login' && <AppHeader />}

      <StatsBanner />
      <NavigationBar onProfileClick={toggleProfileModal} />
      <main className="pb-20 md:pb-0">
          {children}
      </main>
      
      {isFabVisible && <FloatingActionButton onClick={fabOnClick} />}
      
      <SyncIndicator />

      {/* Render all modals here */}
      <AnimatePresence>
        {!isDesktop && (
          <ProfileModal
            isOpen={isProfileMenuOpen}
            onClose={closeProfileMenu}
            userEmail={session?.user?.email}
            onSignOut={() => { closeProfileMenu(); signOut(); }}
            onImport={triggerImport}
            onExport={handleExport}
          />
        )}
      </AnimatePresence>

      <AddContentModal isOpen={showAddContentModal} onClose={() => setShowAddContentModal(false)} cardToEdit={cardToEdit} courseToEdit={courseToEdit} />
      <AddSubjectModal isOpen={showAddSubjectModal} onClose={() => setShowAddSubjectModal(false)} />
      <ConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
      <DeleteSubjectModal isOpen={showDeleteSubjectModal} onClose={() => setShowDeleteSubjectModal(false)} subjectToDelete={subjectToDelete} />
      <SignOutConfirmationModal isOpen={showSignOutModal} onClose={() => setShowSignOutModal(false)} />
      
      <MemoModal
        isOpen={showMemoModal}
        onClose={() => setShowMemoModal(false)}
        memoToEdit={memoToEdit}
      />
      <ReviewSessionSetup
        isOpen={showReviewSetupModal}
        onClose={() => setShowReviewSetupModal(false)}
        onStartReview={handleStartReview}
        subjects={subjects}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userEmail={session?.user?.email}
        onSignOut={signOut}
      />
    </div>
  );
};

export default MainLayout;
