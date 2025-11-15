import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataSync } from '../context/DataSyncContext';
import { useUIState } from '../context/UIStateContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, Pin, Plus, BookOpen, Layers, Library } from 'lucide-react';

const HomePage = () => {
  const { cards, memos, subjects } = useDataSync();
  const { setShowAddContentModal, setMemoToEdit, setShowMemoModal } = useUIState();
  const navigate = useNavigate();

  const {
    dueCardsCount,
    totalCards,
    totalSubjects,
    forecast,
    pinnedMemos,
  } = useMemo(() => {
    if (!cards || !memos) return { dueCardsCount: 0, totalCards: 0, totalSubjects: 0, forecast: [], pinnedMemos: [] };

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
      totalCards: cards.length,
      totalSubjects: subjects?.length || 0,
      forecast: forecastData,
      pinnedMemos: pinned,
    };
  }, [cards, memos, subjects]);

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
        
        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'var(--primary-gradient)' }}>
                <Layers size={20} style={{ color: 'white' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-heading-color">{totalCards}</p>
                <p className="text-xs text-muted-foreground">Flashcards</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-stat-value-review/20">
                <Brain size={20} style={{ color: 'var(--stat-value-review)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-heading-color">{dueCardsCount}</p>
                <p className="text-xs text-muted-foreground">À réviser</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-stat-value-subjects/20">
                <Library size={20} style={{ color: 'var(--stat-value-subjects)' }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-heading-color">{totalSubjects}</p>
                <p className="text-xs text-muted-foreground">Matières</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4">
            <button 
              className="btn btn-primary w-full h-full justify-center"
              onClick={handleStartReview}
            >
              <Brain size={18} />
              <span>Réviser</span>
            </button>
          </div>
        </div>
        
        {/* Section principale - Prévisions */}
        <div className="home-top-section">
          {/* Prévisions compactes */}
          <div className="home-forecast-card" style={{ gridColumn: 'span 2' }}>
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