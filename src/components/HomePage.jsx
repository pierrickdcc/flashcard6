// src/components/HomePage.jsx
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataSync } from '../context/DataSyncContext';
import { useUIState } from '../context/UIStateContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Brain, Pin, Plus, BookOpen, Layers, Library } from 'lucide-react';

const HomePage = () => {
  const { cards, memos, subjects, getCardsToReview, user_card_progress } = useDataSync();
  const { setShowAddContentModal, setMemoToEdit, setShowMemoModal, setShowReviewSetupModal } = useUIState();
  const navigate = useNavigate();
  const [dueCardsCount, setDueCardsCount] = useState(0);

  useEffect(() => {
    const calculateDueCards = async () => {
      const dueTodayCards = await getCardsToReview(['all'], { includeFuture: false });
      setDueCardsCount(dueTodayCards.length);
    };
    
    if (cards) {
      calculateDueCards();
    }
  }, [cards, getCardsToReview]);

  const {
    totalCards,
    totalSubjects,
    forecast,
    pinnedMemos,
    cardStatusData,
  } = useMemo(() => {
    if (!cards || !memos || !user_card_progress) {
      return { totalCards: 0, totalSubjects: 0, forecast: [], pinnedMemos: [], cardStatusData: [] };
    }

    const progressMap = new Map(user_card_progress.map(p => [p.cardId, p]));

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

    const statusCounts = { 'Nouvelle': 0, 'En apprentissage': 0, 'Maîtrisée': 0 };
    cards.forEach(card => {
      const progress = progressMap.get(card.id);
      const status = progress?.status || 'Nouvelle';
      if (status in statusCounts) {
        statusCounts[status]++;
      } else {
        statusCounts['Nouvelle']++;
      }
    });

    const cardStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
    const pinned = memos.filter(memo => memo.isPinned).slice(0, 8);

    return {
      totalCards: cards.length,
      totalSubjects: subjects?.length || 0,
      forecast: forecastData,
      pinnedMemos: pinned,
      cardStatusData,
    };
  }, [cards, memos, subjects, user_card_progress]);

  const COLORS = ['#FFBB28', '#00C49F', '#0088FE'];

  const handleStartReview = () => {
    setShowReviewSetupModal(true);
  };

  const handleMemoClick = (memo) => {
    setMemoToEdit(memo);
    setShowMemoModal(true);
  };

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
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={forecast} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-color)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-color)' }} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-color)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-color)' }} width={30} />
                <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem', padding: '0.5rem' }} />
                <Bar dataKey="cartes" fill="var(--primary-color)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="home-status-card">
            <h2>Répartition</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={cardStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {cardStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
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