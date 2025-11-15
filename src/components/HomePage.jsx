import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataSync } from '../context/DataSyncContext';
import { useUIState } from '../context/UIStateContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, Pin, Plus, BookOpen } from 'lucide-react';

const HomePage = () => {
  const { cards, memos, subjects } = useDataSync();
  const { setShowAddContentModal, setMemoToEdit, setShowMemoModal } = useUIState();
  const navigate = useNavigate();

  const {
    dueCardsCount,
    forecast,
    pinnedMemos,
  } = useMemo(() => {
    if (!cards || !memos) return { dueCardsCount: 0, forecast: [], pinnedMemos: [] };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueCards = cards.filter(c => {
      if (!c.nextReview) return true;
      return new Date(c.nextReview) <= today;
    });

    const forecastData = Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      const count = cards.filter(c => {
        if (!c.nextReview) return false;
        const reviewDate = new Date(c.nextReview);
        reviewDate.setHours(0, 0, 0, 0);
        return reviewDate.getTime() === date.getTime();
      }).length;
      return { day: dayName, cartes: count };
    });

    const pinned = memos.filter(memo => memo.isPinned).slice(0, 8);

    return {
      dueCardsCount: dueCards.length,
      forecast: forecastData,
      pinnedMemos: pinned,
    };
  }, [cards, memos]);

  const handleStartReview = () => {
    navigate('/review/setup');
  };

  const handleMemoClick = (memo) => {
    setMemoToEdit(memo);
    setShowMemoModal(true);
  };

  return (
    <div className="home-page-container">
      <div className="home-page-content">
        
        {/* Section principale - Révision + Prévisions */}
        <div className="home-top-section">
          {/* Carte de révision */}
          <div className="home-review-card">
            <h2>À réviser</h2>
            <div className="review-count">{dueCardsCount}</div>
            <p>{dueCardsCount > 1 ? 'cartes' : 'carte'}</p>
            <button 
              className="btn btn-primary w-full justify-center"
              onClick={handleStartReview}
              disabled={dueCardsCount === 0}
            >
              <Brain size={18} />
              <span>Commencer</span>
            </button>
          </div>

          {/* Prévisions compactes */}
          <div className="home-forecast-card">
            <h2>Prévisions (7j)</h2>
            {forecast.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecast} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis 
                    dataKey="day" 
                    tick={{ fill: 'var(--text-color)', fontSize: 11 }} 
                    axisLine={{ stroke: 'var(--border-color)' }}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    tick={{ fill: 'var(--text-color)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--border-color)' }}
                    width={30}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    contentStyle={{ 
                      background: 'var(--background-card)', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      padding: '0.5rem'
                    }}
                  />
                  <Bar 
                    dataKey="cartes" 
                    fill="var(--primary-color)" 
                    radius={[6, 6, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          {/* Actions rapides */}
          <div className="home-actions-card">
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

        {/* Mémos épinglés - Style Google Keep */}
        {pinnedMemos.length > 0 && (
          <div className="home-memos-section">
            <h2 className="home-section-title">
              <Pin size={16} style={{ transform: 'rotate(45deg)' }} />
              Mémos épinglés
            </h2>
            <div className="home-memos-grid">
              {pinnedMemos.map(memo => (
                <div 
                  key={memo.id} 
                  className={`home-memo-card memo-${memo.color}`} 
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