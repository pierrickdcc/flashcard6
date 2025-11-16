import React from 'react';
import { useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import NavigationBar from './NavigationBar';
import FloatingActionButton from './FloatingActionButton';
import StatsBanner from './StatsBanner';
import SyncIndicator from './SyncIndicator'; // ← NOUVEAU
import { useUIState } from '../context/UIStateContext';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/DataSyncContext';
import ProfileSideMenu from './ProfileSideMenu';
import { useState } from 'react';

// Import all modals
import AddContentModal from './AddContentModal';
import AddSubjectModal from './AddSubjectModal';
import ConfigModal from './ConfigModal';
import DeleteSubjectModal from './DeleteSubjectModal';
import SignOutConfirmationModal from './SignOutConfirmationModal';
import MemoModal from './MemoModal';

const MainLayout = ({ children }) => {
  const {
    showAddContentModal,
    setShowAddContentModal,
    cardToEdit,
    courseToEdit,
    showAddSubjectModal,
    setShowAddSubjectModal,
    showConfigModal,
    setShowConfigModal,
    showDeleteSubjectModal,
    setShowDeleteSubjectModal,
    showSignOutModal,
    setShowSignOutModal,
    showMemoModal,
    setShowMemoModal,
    memoToEdit,
    subjectToDelete,
  } = useUIState();

  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const { session } = useAuth();
  const { signOut } = useDataSync();

  const toggleSideMenu = () => {
    console.log("Toggling side menu from MainLayout");
    setIsSideMenuOpen(!isSideMenuOpen);
  };

  const location = useLocation();
  const currentPath = location.pathname;

  let fabOnClick = () => setShowAddContentModal(true);
  let isFabVisible = true;

  if (currentPath === '/memos') {
    fabOnClick = () => setShowMemoModal(true);
  } else if (currentPath === '/stats') {
    isFabVisible = false;
  }

  return (
    <div className="relative min-h-screen bg-background-body">
      {location.pathname !== '/login' && <AppHeader onProfileClick={toggleSideMenu} />}
      <StatsBanner />
      <NavigationBar onProfileClick={toggleSideMenu} />
      <main className="pb-20 md:pb-0">
          {children}
      </main>
      
      {isFabVisible && <FloatingActionButton onClick={fabOnClick} />}
      
      {/* NOUVEAU : Indicateur de synchronisation */}
      <SyncIndicator />

      {/* Render all modals here */}
      <AddContentModal
        isOpen={showAddContentModal}
        onClose={() => setShowAddContentModal(false)}
        cardToEdit={cardToEdit}
        courseToEdit={courseToEdit}
      />
      <AddSubjectModal isOpen={showAddSubjectModal} onClose={() => setShowAddSubjectModal(false)} />
      <ConfigModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
      <DeleteSubjectModal
        isOpen={showDeleteSubjectModal}
        onClose={() => setShowDeleteSubjectModal(false)}
        subjectToDelete={subjectToDelete}
      />
      <SignOutConfirmationModal isOpen={showSignOutModal} onClose={() => setShowSignOutModal(false)} />
      
      <MemoModal
        isOpen={showMemoModal}
        onClose={() => setShowMemoModal(false)}
        memoToEdit={memoToEdit}
      />

      <ProfileSideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        userEmail={session?.user?.email}
        onSignOut={signOut}
      />
    </div>
  );
};

export default MainLayout;