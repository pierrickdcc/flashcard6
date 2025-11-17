// src/components/HomePage.jsx
import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataSync } from '../context/DataSyncContext';
import { useUIState } from '../context/UIStateContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Brain, Pin, Plus, BookOpen, Layers, Library } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

const PIE_COLORS = {
  "Nouvelles": "#3B82F6",
  "En cours": "#F59E0B",
  "Acquises": "#10B981",
};

const HomePage = () => {
  const { cards, memos, subjects, getCardsToReview } = useDataSync();
  const { setShowAddContentModal, setMemoToEdit, setShowMemoModal, setShowReviewSetupModal } = useUIState();
  const navigate = useNavigate();
  const [dueCardsCount, setDueCardsCount] = useState(0);

  const userCardProgress = useLiveQuery(() => db.user_card_progress.toArray(), []);

  useEffect(() => {
    const calculateDueCards = async () => {
      const dueTodayCards = await getCardsToReview(['all'], { includeFuture: false });
      setDueCardsCount(dueTodayCards.length);
    };
    
    if (cards) {
      calculateDueCards();
    }
  }, [cards, getCardsToReview, userCardProgress]);

  const {
    totalCards,
    totalSubjects,
    forecast,
    pinnedMemos,
    cardMasteryData,
  } = useMemo(() => {
    if (!cards || !memos) return { totalCards: 0, totalSubjects: 0, forecast: [], pinnedMemos: [], cardMasteryData: [] };

    const forecastData = Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      return { day: dayName, cartes: 0, date: date.getTime() };
    });

    userCardProgress?.forEach(p => {
      if (p.dueDate) {
        const reviewDate = new Date(p.dueDate);
        reviewDate.setHours(0, 0, 0, 0);
        const reviewTime = reviewDate.getTime();
        const dayData = forecastData.find(d => d.date === reviewTime);
        if (dayData) dayData.cartes++;
      }
    });

    const pinned = memos.filter(memo => memo.isPinned).slice(0, 8);

    const masteryCounts = { "Nouvelles": 0, "En cours": 0, "Acquises": 0 };
    if (!userCardProgress) {
        masteryCounts.Nouvelles = cards.length;
    } else {
        const progressMap = new Map(userCardProgress.map(p => [p.cardId, p.status]));
        cards.forEach(card => {
            const status = progressMap.get(card.id);
            if (status === 'learning' || status === 'relearning') masteryCounts["En cours"]++;
            else if (status === 'review') masteryCounts["Acquises"]++;
            else masteryCounts["Nouvelles"]++;
        });
    }
    const masteryData = Object.entries(masteryCounts).map(([name, value]) => ({ name, value }));

    return {
      totalCards: cards.length,
      totalSubjects: subjects?.length || 0,
      forecast: forecastData,
      pinnedMemos: pinned,
      cardMasteryData: masteryData,
    };
  }, [cards, memos, subjects, userCardProgress]);

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
        <div className="home-main-grid">
          {/* Prévisions */}
          <div className="glass-card home-chart-card" style={{minHeight: '300px'}}>
            <h2>Prévisions (7j)</h2>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecast} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-color)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-color)' }} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-color)', fontSize: 11 }} axisLine={{ stroke: 'var(--border-color)' }} width={30} />
                <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.8rem', padding: '0.5rem' }} />
                <Bar dataKey="cartes" fill="var(--primary-color)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Maturité des Cartes */}
          <div className="glass-card home-chart-card" style={{minHeight: '300px'}}>
            <h2>Maturité des Cartes</h2>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                  <Pie data={cardMasteryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5}>
                      {cardMasteryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} />
                      ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Actions rapides */}
          <div className="home-actions-card glass-card">
            <button onClick={handleStartReview} className="home-action-btn">
              <div className="home-action-icon"><Brain size={18} /></div>
              <span>Réviser ({dueCardsCount})</span>
            </button>
            <button onClick={() => setShowAddContentModal(true)} className="home-action-btn">
              <div className="home-action-icon"><Plus size={18} /></div>
              <span>Ajouter</span>
            </button>
            <button onClick={() => navigate('/courses')} className="home-action-btn">
              <div className="home-action-icon"><BookOpen size={18} /></div>
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
                <div key={memo.id} className={`memo-card memo-${memo.color}`} onClick={() => handleMemoClick(memo)}>
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
