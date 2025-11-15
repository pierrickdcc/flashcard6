import React, { useMemo } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { TrendingUp, BookOpen, Flame, Target } from 'lucide-react';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#14B8A6'];

const StatsPage = () => {
  const { cards = [], subjects = [] } = useDataSync();

  const stats = useMemo(() => {
    if (!cards || cards.length === 0) {
      return {
        totalCards: 0,
        totalSubjects: subjects.length,
        dueToday: 0,
        mastery: 'N/A',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueCards = cards.filter(c => {
      if (!c.nextReview) return true;
      return new Date(c.nextReview) <= today;
    });

    const cardsWithFactor = cards.filter(c => c.easeFactor && c.easeFactor > 0);
    if (cardsWithFactor.length === 0) {
      return {
        totalCards: cards.length,
        totalSubjects: subjects.length,
        dueToday: dueCards.length,
        mastery: 'N/A',
      };
    }

    const avgEase = cardsWithFactor.reduce((acc, c) => acc + c.easeFactor, 0) / cardsWithFactor.length;
    const masteryPercent = Math.round(((avgEase - 1.3) / (3.0 - 1.3)) * 100);

    return {
      totalCards: cards.length,
      totalSubjects: subjects.length,
      dueToday: dueCards.length,
      mastery: `${Math.min(100, Math.max(0, masteryPercent))}%`,
    };
  }, [cards, subjects]);

  const forecastData = useMemo(() => {
    if (!cards) return [];
    return Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const day = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      const count = cards.filter(c => {
        if (!c.nextReview) return false;
        const reviewDate = new Date(c.nextReview);
        reviewDate.setHours(0, 0, 0, 0);
        return reviewDate.getTime() === date.getTime();
      }).length;
      return { day, cartes: count };
    });
  }, [cards]);

  const streakData = useMemo(() => {
    if (!cards) return [];
    
    const last30Days = Array(30).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      return { day: i + 1, reviews: 0, date: date.getTime() };
    });
    
    return last30Days;
  }, [cards]);

  const cardsBySubject = useMemo(() => {
    if (!cards || !subjects) return [];
    const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
    const counts = cards.reduce((acc, card) => {
      const subjectName = subjectMap.get(card.subject_id) || 'Non classé';
      acc[subjectName] = (acc[subjectName] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts)
      .map(name => ({ name, value: counts[name] }))
      .sort((a, b) => b.value - a.value);
  }, [cards, subjects]);

  const masteryBySubject = useMemo(() => {
    if (!cards || !subjects) return [];
    
    const masteryData = subjects.map(subject => {
      const subjectCards = cards.filter(c => c.subject_id === subject.id && c.easeFactor);
      if (subjectCards.length === 0) {
        return { name: subject.name, mastery: 0, count: 0 };
      }
      const avgEase = subjectCards.reduce((acc, c) => acc + (c.easeFactor || 1.3), 0) / subjectCards.length;
      const masteryPercent = Math.round(((avgEase - 1.3) / (3.0 - 1.3)) * 100);
      return { 
        name: subject.name, 
        mastery: Math.min(100, Math.max(0, masteryPercent)),
        count: subjectCards.length
      };
    }).filter(d => d.count > 0).sort((a, b) => a.mastery - b.mastery);

    return masteryData;
  }, [cards, subjects]);

  return (
    <div className="stats-page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-heading-color)', marginBottom: '0.5rem' }}>
            Statistiques
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Analysez vos progrès et votre performance</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div className="stats-grid">
          <div className="stat-item-lg">
            <span className="stat-label-lg">Total des cartes</span>
            <span className="stat-value-lg stat-value-total">{stats.totalCards}</span>
          </div>
          <div className="stat-item-lg">
            <span className="stat-label-lg">À réviser</span>
            <span className="stat-value-lg stat-value-review">{stats.dueToday}</span>
          </div>
          <div className="stat-item-lg">
            <span className="stat-label-lg">Matières</span>
            <span className="stat-value-lg stat-value-subjects">{stats.totalSubjects}</span>
          </div>
          <div className="stat-item-lg">
            <span className="stat-label-lg">Maîtrise moy.</span>
            <span className="stat-value-lg stat-value-mastery">{stats.mastery}</span>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="dashboard-grid">
        
        {/* Prévisions */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} />
            Prévisions (7 jours)
          </h3>
          {forecastData.length > 0 && cards.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={forecastData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-color)', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-color)', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  contentStyle={{ 
                    background: 'var(--background-card)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
                <Bar dataKey="cartes" fill="var(--primary-color)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)' }}>
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Streak de révisions */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={20} style={{ color: '#f97316' }} />
            Activité (30 jours)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={streakData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis 
                dataKey="day" 
                tick={{ fill: 'var(--text-color)', fontSize: 11 }}
                label={{ value: 'Jours', position: 'insideBottom', offset: -5, fill: 'var(--text-color)' }}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fill: 'var(--text-color)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ 
                  background: 'var(--background-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '8px',
                  fontSize: '0.875rem'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="reviews" 
                stroke="#f97316" 
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Répartition */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} />
            Répartition par matière
          </h3>
          {cardsBySubject.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie 
                  data={cardsBySubject} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={80}
                  label={(entry) => `${entry.name} (${entry.value})`}
                  labelLine={false}
                >
                  {cardsBySubject.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    background: 'var(--background-card)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)' }}>
              Aucune donnée disponible
            </div>
          )}
        </div>

        {/* Maîtrise par matière */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} />
            Maîtrise par matière
          </h3>
          {masteryBySubject.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart 
                data={masteryBySubject} 
                layout="vertical"
                margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
              >
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-color)', fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: 'var(--text-color)', fontSize: 11 }} 
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  contentStyle={{ 
                    background: 'var(--background-card)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px',
                    fontSize: '0.875rem'
                  }}
                  formatter={(value) => `${value}%`}
                />
                <Bar dataKey="mastery" fill="var(--stat-value-mastery)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px', color: 'var(--text-muted)' }}>
              Aucune donnée disponible
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StatsPage;