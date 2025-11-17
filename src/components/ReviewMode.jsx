// src/components/ReviewMode.jsx
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDataSync } from '../context/DataSyncContext';
import { useUIState } from '../context/UIStateContext';
import { X, RotateCcw, CheckCircle, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import './ReviewMode.css';
import FitText from './FitText';

const ReviewMode = () => {
  const { reviewCard, subjects } = useDataSync();
  const { setReviewMode, reviewCards } = useUIState();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const navigate = useNavigate();

  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const currentCard = reviewCards[currentIndex];

  const handleRating = async (rating) => {
    if (!currentCard) return;
    await reviewCard(currentCard.id, rating);

    if (currentIndex < reviewCards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 300);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  const handleExit = () => {
    setReviewMode(false);
    navigate('/');
  };

  const handleCardClick = () => {
    // Toggle flip state
    setIsFlipped(!isFlipped);
  };

  if (isFinished) {
    return (
      <div className="review-finished-container">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="review-finished-content"
        >
          <CheckCircle size={80} style={{ color: '#22c55e', margin: '0 auto 1.5rem' }} />
          <h2 className="text-4xl font-bold text-heading mb-4">Session terminée !</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Bravo, vous avez terminé votre session de révision.
          </p>
          <div className="flex gap-4 justify-center">
            <button onClick={handleRestart} className="btn btn-secondary">
              <RotateCcw size={16} /> Recommencer
            </button>
            <button onClick={handleExit} className="btn btn-primary">
              <Home size={16} /> Retour à l'accueil
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Chargement des cartes...</p>
      </div>
    );
  }

  const progressPercentage = ((currentIndex + 1) / reviewCards.length) * 100;

  const ratingButtons = [
    { label: 'À revoir', rating: 1, className: 'btn-rating-1' },
    { label: 'Difficile', rating: 2, className: 'btn-rating-2' },
    { label: 'Moyen', rating: 3, className: 'btn-rating-3' },
    { label: 'Facile', rating: 4, className: 'btn-rating-4' },
    { label: 'Très facile', rating: 5, className: 'btn-rating-5' },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="review-header">
        <Link to="/" className="logo">
          <div className="logo-svg-container" />
          <span className="logo-text">Flash</span>
        </Link>
        <div className="progress-container">
          <div className="progress-bar">
            <motion.div
              className="progress-bar-inner"
              initial={{ width: `${(currentIndex / reviewCards.length) * 100}%` }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="progress-text">Carte {currentIndex + 1} sur {reviewCards.length}</p>
        </div>
        <div className="header-actions">
          <button onClick={handleRestart} className="icon-btn" title="Recommencer">
            <RotateCcw size={20} />
          </button>
          <button onClick={handleExit} className="icon-btn" title="Quitter le mode révision">
            <X size={24} />
          </button>
        </div>
      </header>

      {/* Main Card Area */}
      <main className="review-main">
        <div className="card-scene">
          <motion.div
            className="card-flipper"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            onClick={handleCardClick}
          >
            {/* Front */}
            <div className="card-face card-face-front">
              <span className="card-subject-tag">{subjectMap.get(currentCard.subject_id) || 'Sujet'}</span>
              <div className="card-inner-content">
                <FitText className="card-text">
                  {currentCard.question}
                </FitText>
                {currentCard.question_image && (
                  <img 
                    src={currentCard.question_image} 
                    alt="Question"
                    className="card-image"
                  />
                )}
              </div>
              <div className="card-spacer"></div>
            </div>
            {/* Back */}
            <div className="card-face card-face-back">
              <span className="card-subject-tag">{subjectMap.get(currentCard.subject_id) || 'Sujet'}</span>
              <div className="card-inner-content">
                <FitText className="card-text">
                  {currentCard.answer}
                </FitText>
                {currentCard.answer_image && (
                  <img 
                    src={currentCard.answer_image} 
                    alt="Réponse"
                    className="card-image"
                  />
                )}
              </div>
              <div className="card-spacer"></div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="review-footer">
        <AnimatePresence mode="wait">
          {!isFlipped ? (
            <motion.div key="show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button className="btn btn-primary px-10 py-3 text-base" onClick={() => setIsFlipped(true)}>
                Retourner la carte
              </button>
            </motion.div>
          ) : (
            <motion.div key="rate" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} exit={{ opacity: 0 }}
              className="difficulty-buttons"
            >
              {ratingButtons.map(btn => (
                <button 
                  key={btn.rating} 
                  className={`btn ${btn.className}`} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRating(btn.rating);
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </footer>
    </div>
  );
};

export default ReviewMode;