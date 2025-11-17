// src/components/HomePage.jsx
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataSync } from '../context/DataSyncContext';
import { useUIState } from '../context/UIStateContext';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Brain, Pin, Plus, BookOpen, Layers, Library } from 'lucide-react';

const HomePage = () => {
  const { cards = [], memos = [], subjects = [], getCardsToReview } = useDataSync();
  const { session } = useAuth();
  const { setShowAddContentModal, setMemoToEdit, setShowMemoModal, setShowReviewSetupModal } = useUIState();
  const navigate = useNavigate();
  const [dueCardsCount, setDueCardsCount] = useState(0);
  const [userCardProgress, setUserCardProgress] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger la progression depuis IndexedDB
  useEffect(() => {
    const loadProgress = async () => {
      if (!session?.user?.id) return;
      
      try {
        const { db } = await import('../db');
        const progress = await db.user_card_progress
          .where('userId')
          .equals(session.user.id)
          .toArray();
        
        setUserCardProgress(progress);
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur chargement progression:', error);
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [session, cards]); // Re-charger si les cartes changent

  useEffect(() => {
    const calculateDueCards = async () => {
      if (!cards || cards.length === 0) {
        setDueCardsCount(0);
        return;
      }
      
      try {
        const dueTodayCards = await getCardsToReview(['all'], { includeFuture: false });
        setDueCardsCount(dueTodayCards.length);
      } catch (error) {
        console.error('Erreur calcul cartes dues:', error);
        setDueCardsCount(0);
      }
    };
    
    calculateDueCards();
  }, [cards, getCardsToReview, userCardProgress]);

  const {
    totalCards,
    totalSubjects,
    forecast,
    pinnedMemos,
    cardStatusData,
  } = useMemo(() => {
    // Valeurs par défaut si pas de données
    if (!cards || !memos || !userCardProgress) {
      return { 
        totalCards: 0, 
        totalSubjects: 0, 
        forecast: [], 
        pinnedMemos: [], 
        cardStatusData: [] 
      };
    }

    const progressMap = new Map(userCardProgress.map(p => [p.cardId, p]));

    // Prévisions sur 7 jours
    const forecastData = Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });

      const count = cards.reduce((acc, card) => {
        const progress = progressMap.get(card.id);
        if (!progress || !progress.dueDate) return acc;

        const reviewDate = new Date(progress.dueDate);
        reviewDate.setHours(0, 0, 0, 0);

        if (reviewDate.getTime() === date.getTime()) {
          return acc + 1;
        }
        return acc;
      }, 0);

      return { day: dayName, cartes: count };
    });

    // Statuts des cartes
    const statusCounts = { 'Nouvelle': 0, 'En apprentissage': 0, 'Maîtrisée': 0 };
    cards.forEach(card => {
      const progress = progressMap.get(card.id);
      const status = progress?.status || 'Nouvelle';
      
      if (status === 'new' || status === 'Nouvelle') {
        statusCounts['Nouvelle']++;
      } else if (status === 'learning' || status === 'En apprentissage') {
        statusCounts['En apprentissage']++;
      } else if (status === 'review' || status === 'Maîtrisée') {
        statusCounts['Maîtrisée']++;
      } else {
        statusCounts['Nouvelle']++;
      }
    });

    const cardStatusData = Object.entries(statusCounts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
    
    const pinned = memos.filter(memo => memo.isPinned).slice(0, 8);

    return {
      totalCards: cards.length,
      totalSubjects: subjects?.length || 0,
      forecast: forecastData,
      pinnedMemos: pinned,
      cardStatusData,
    };
  }, [cards, memos, subjects, userCardProgress]);

  const COLORS = ['#FFBB28', '#00C49F', '#0088FE'];

  const handleStartReview = () => {
    setShowReviewSetupModal(true);
  };

  const handleMemoClick = (memo) => {
    setMemoToEdit(memo);
    setShowMemoModal(true);
  };

  if (isLoading) {
    return (
      <div className="home-page-container">
        <div className="home-page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page-container">
      <div className="home-page-content">
        
        {/* Stats compactes */}
        <div className="home-stats-compact">
          <div className="glass-card">
            <div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <Layers size={20} style={{ color: 'var(--stat-value-total)' }} />
              </div>
              <div className="stat-info">
                <h3>{totalCards}</h3>
                <p>Flashcards</p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <Brain size={20} style={{ color: 'var(--stat-value-review)' }} />
              </div>
              <div className="stat-info">
                <h3>{dueCardsCount}</h3>
                <p>À réviser</p>
              </div>
            </div>
          </div>

          <div className="glass-card">
            <div>
              <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                <Library size={20} style={{ color: 'var(--stat-value-subjects)' }} />
              </div>
              <div className="stat-info">
                <h3>{totalSubjects}</h3>
                <p>Matières</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Section principale */}
        <div className="home-charts-section">
          <div className="home-forecast-card">
            <h2>Prévisions (7j)</h2>
            {forecast.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={forecast} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-color)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-color)' }} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--text-color)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-color)' }} width={30} />
                  <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem', padding: '0.5rem' }} />
                  <Bar dataKey="cartes" fill="var(--primary-color)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Aucune révision planifiée
              </div>
            )}
          </div>
          <div className="home-status-card">
            <h2>Répartition</h2>
            {cardStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie 
                    data={cardStatusData} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={80} 
                    labelLine={false} 
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {cardStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        <div className="home-actions-section">
          <div className="home-actions-card">
            <button
              onClick={handleStartReview}
              className="home-action-btn"
            >
              <div className="home-action-icon">
                <Brain size={18} />
              </div>
              <span>Réviser ({dueCardsCount})</span>
            </button>
            <button
              onClick={() => setShowAddContentModal(true)}
              className="home-action-btn"
            >
              <div className="home-action-icon">
                <Plus size={18} />
              </div>
              <span>Ajouter</span>
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="home-action-btn"
            >
              <div className="home-action-icon">
                <BookOpen size={18} />
              </div>
              <span>Cours</span>
            </button>
          </div>
        </div>

        {/* Mémos épinglés */}
        {pinnedMemos.length > 0 && (
          <div className="home-memos-section">
            <h2 className="home-section-title">
              <Pin size={16} style={{ transform: 'rotate(45deg)' }} />
              Mémos épinglés
            </h2>
            <div className="home-memos-grid home-pinned-memos">
              {pinnedMemos.map(memo => (
                <div
                  key={memo.id}
                  className={`memo-card memo-${memo.color}`}
                  onClick={() => handleMemoClick(memo)}
                >
                  <p>{memo.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;