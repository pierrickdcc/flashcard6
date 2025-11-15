import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useDataSync } from './context/DataSyncContext';
import { useUIState } from './context/UIStateContext';

import Auth from './components/Auth';
import ReviewMode from './components/ReviewMode';
import ReviewSessionSetup from './components/ReviewSessionSetup';
import HomePage from './components/HomePage';
import CoursePage from './components/CoursePage';
import CourseViewer from './components/CourseViewer';
import FlashcardsPage from './components/FlashcardsPage';
import MainLayout from './components/MainLayout';
import MemoWallPage from './components/MemoWallPage'; 
import StatsPage from './components/StatsPage'; // Assurez-vous que ce fichier existe

const App = () => {
  const { session, isConfigured } = useAuth();
  const { startReview } = useDataSync();
  const { reviewMode, reviewCards, selectedSubjects } = useUIState();
  const navigate = useNavigate();

  if (!session) {
    return <Auth />;
  }

  const handleStartReview = async (options) => {
    const success = await startReview(selectedSubjects, options.isCramMode, options.includeFuture);
    if (success) {
      navigate('/'); 
    }
  };

  if (reviewMode && reviewCards.length > 0) {
    return <ReviewMode />;
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={ <HomePage isConfigured={isConfigured} /> } />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/courses" element={<CoursePage />} />
        <Route path="/courses/:courseId" element={<CourseViewer />} />
        
        {/* Assurez-vous que ces routes sont ici */}
        <Route path="/memos" element={<MemoWallPage />} />
        <Route path="/stats" element={<StatsPage />} />
        
        <Route path="/review/setup" element={
          <ReviewSessionSetup
            onStartReview={handleStartReview}
            onClose={() => navigate('/')}
          />}
        />
      </Routes>
    </MainLayout>
  );
};

export default App;