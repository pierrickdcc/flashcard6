import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppHeader from './AppHeader';
import NavigationBar from './NavigationBar';
import FloatingActionButton from './FloatingActionButton';
import StatsBanner from './StatsBanner';
import SyncIndicator from './SyncIndicator'; // ← NOUVEAU
import { useUIState } from '../context/UIStateContext';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/DataSyncContext';

// Import all modals
import ProfileModal from './ProfileModal';
import AddContentModal from './AddContentModal';
import AddSubjectModal from './AddSubjectModal';
import ConfigModal from './ConfigModal';
import DeleteSubjectModal from './DeleteSubjectModal';
import SignOutConfirmationModal from './SignOutConfirmationModal';
import MemoModal from './MemoModal';
import ReviewSessionSetup from './ReviewSessionSetup';

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
    showReviewSetupModal,
    setShowReviewSetupModal,
  } = useUIState();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { session } = useAuth();
  const { signOut, subjects, startReview } = useDataSync();

  const handleStartReview = async (options) => {
    const subjectFilter = options.subjectId === 'all' ? ['all'] : [options.subjectId];
    const success = await startReview(subjectFilter, options.isCramMode, options.includeFuture);
    if (success) {
      setShowReviewSetupModal(false);
    }
  };

  const toggleProfileModal = () => setIsProfileModalOpen(!isProfileModalOpen);

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