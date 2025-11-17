// src/components/StatsPage.jsx
import React, { useMemo } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { TrendingUp, BookOpen, Flame, Target, BrainCircuit, BarChart3, ListTodo } from 'lucide-react';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#14B8A6'];
const PIE_COLORS = {
  "Nouvelles": "#3B82F6",
  "En cours": "#F59E0B",
  "Acquises": "#10B981",
};

const StatsPage = () => {
  const { cards = [], subjects = [], courses = [], memos = [] } = useDataSync();
  const userCardProgress = useLiveQuery(() => db.user_card_progress.toArray(), []);
  const reviewHistory = useLiveQuery(() => db.review_history.toArray(), []);

  const stats = useMemo(() => {
    if (!cards || cards.length === 0) {
      return { totalCards: 0, totalSubjects: subjects.length, dueToday: 0, mastery: 'N/A' };
    }

    const now = new Date();
    const progressMap = new Map(userCardProgress?.map(p => [p.cardId, p]) || []);

    const dueCards = cards.filter(c => {
      const progress = progressMap.get(c.id);
      if (!progress || !progress.dueDate) return true; // Considérée due si pas de progrès
      return new Date(progress.dueDate) <= now;
    });

    const cardsWithFactor = userCardProgress?.filter(p => p.easeFactor) || [];
    let masteryPercent = 0;
    if (cardsWithFactor.length > 0) {
      const avgEase = cardsWithFactor.reduce((acc, c) => acc + c.easeFactor, 0) / cardsWithFactor.length;
      masteryPercent = Math.round(((avgEase - 1.3) / (3.0 - 1.3)) * 100);
    }

    return {
      totalCards: cards.length,
      totalSubjects: subjects.length,
      dueToday: dueCards.length,
      mastery: `${Math.min(100, Math.max(0, masteryPercent))}%`,
    };
  }, [cards, subjects, userCardProgress]);

  const creationActivityData = useMemo(() => {
    const last30Days = Array(30).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    const dataMap = new Map(last30Days.map(day => [day, { day: new Date(day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), cartes: 0, cours: 0, memos: 0 }]));

    [...cards, ...courses, ...memos].forEach(item => {
      const createdAtDate = item.created_at || item.createdAt;
      if (createdAtDate) {
        const createdAt = new Date(createdAtDate).toISOString().split('T')[0];
        if (dataMap.has(createdAt)) {
          const entry = dataMap.get(createdAt);
          if ('question' in item) entry.cartes += 1;
          else if ('title' in item) entry.cours += 1;
          else if ('content' in item) entry.memos += 1;
        }
      }
    });

    return Array.from(dataMap.values());
  }, [cards, courses, memos]);

  const cardMasteryData = useMemo(() => {
    const counts = { "Nouvelles": 0, "En cours": 0, "Acquises": 0 };
    if (!cards || !userCardProgress) {
        counts.Nouvelles = cards?.length || 0;
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }

    const progressMap = new Map(userCardProgress.map(p => [p.cardId, p.status]));
    cards.forEach(card => {
      const status = progressMap.get(card.id);
      if (status === 'learning' || status === 'relearning') counts["En cours"]++;
      else if (status === 'review') counts["Acquises"]++;
      else counts["Nouvelles"]++;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [cards, userCardProgress]);

  const difficultCards = useMemo(() => {
    if (!userCardProgress || userCardProgress.length === 0) return [];

    const sortedProgress = [...userCardProgress]
      .filter(p => p.easeFactor)
      .sort((a, b) => a.easeFactor - b.easeFactor)
      .slice(0, 10);

    const cardMap = new Map(cards.map(c => [c.id, c]));

    return sortedProgress.map(p => {
      const card = cardMap.get(p.cardId);
      return card ? { ...card, easeFactor: p.easeFactor } : null;
    }).filter(Boolean);
  }, [cards, userCardProgress]);

  const activityStreakData = useMemo(() => {
    if (!reviewHistory) return [];
    return reviewHistory.reduce((acc, review) => {
      const date = new Date(review.reviewed_at).toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, []);
  }, [reviewHistory]);

  const answerAccuracyData = useMemo(() => {
    if (!reviewHistory) return [];
    const ratings = { 'À revoir': 0, 'Difficile': 0, 'Moyen': 0, 'Facile': 0 };
    reviewHistory.forEach(r => {
      if (r.rating === 1) ratings['À revoir']++;
      else if (r.rating === 2) ratings['Difficile']++;
      else if (r.rating === 3) ratings['Moyen']++;
      else if (r.rating >= 4) ratings['Facile']++;
    });
    return Object.entries(ratings).map(([name, value]) => ({ name, value }));
  }, [reviewHistory]);

  const successRateBySubjectData = useMemo(() => {
    if (!reviewHistory || !cards || !subjects) return [];

    const cardToSubjectMap = new Map(cards.map(c => [c.id, c.subject_id]));
    const subjectNameMap = new Map(subjects.map(s => [s.id, s.name]));

    const subjectStats = reviewHistory.reduce((acc, review) => {
      const subjectId = cardToSubjectMap.get(review.cardId);
      if (!subjectId) return acc;

      const subjectName = subjectNameMap.get(subjectId) || 'Non classé';
      if (!acc[subjectName]) {
        acc[subjectName] = { success: 0, fail: 0 };
      }

      if (review.rating >= 3) {
        acc[subjectName].success++;
      } else {
        acc[subjectName].fail++;
      }
      return acc;
    }, {});

    return Object.entries(subjectStats).map(([name, { success, fail }]) => ({
      name,
      'Réussite': success,
      'Échec': fail,
      total: success + fail
    })).sort((a,b) => (b.Réussite / b.total) - (a.Réussite / a.total));
  }, [reviewHistory, cards, subjects]);

  const forecastData = useMemo(() => {
    if (!userCardProgress) return [];
    const data = Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const day = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      return { day, cartes: 0, date: date.getTime() };
    });

    userCardProgress.forEach(p => {
        if (p.dueDate) {
            const reviewDate = new Date(p.dueDate);
            reviewDate.setHours(0, 0, 0, 0);
            const reviewTime = reviewDate.getTime();
            const dayData = data.find(d => d.date === reviewTime);
            if(dayData) dayData.cartes++;
        }
    });
    return data;
  }, [userCardProgress]);

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
    if (!userCardProgress || !cards || !subjects) return [];

    const cardToSubjectMap = new Map(cards.map(c => [c.id, c.subject_id]));
    const subjectProgress = {};

    userCardProgress.forEach(p => {
      const subjectId = cardToSubjectMap.get(p.cardId);
      if (subjectId && p.easeFactor) {
        if (!subjectProgress[subjectId]) {
          subjectProgress[subjectId] = { totalEase: 0, count: 0 };
        }
        subjectProgress[subjectId].totalEase += p.easeFactor;
        subjectProgress[subjectId].count++;
      }
    });

    const subjectNameMap = new Map(subjects.map(s => [s.id, s.name]));
    return Object.entries(subjectProgress).map(([subjectId, data]) => {
      const avgEase = data.totalEase / data.count;
      const masteryPercent = Math.round(((avgEase - 1.3) / (3.0 - 1.3)) * 100);
      return {
        name: subjectNameMap.get(subjectId) || 'Inconnu',
        mastery: Math.min(100, Math.max(0, masteryPercent)),
        count: data.count
      };
    }).filter(d => d.count > 0).sort((a, b) => a.mastery - b.mastery);
  }, [userCardProgress, cards, subjects]);

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
      <div className="dashboard-grid-stats">
        
        <div className="glass-card" style={{ minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} />
            Prévisions (7 jours)
          </h3>
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
        </div>

        <div className="glass-card" style={{ minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} />
            Activité de Création (30 jours)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={creationActivityData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
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
              <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
              <Bar dataKey="cartes" stackId="a" fill="#3B82F6" name="Cartes" />
              <Bar dataKey="cours" stackId="a" fill="#8B5CF6" name="Cours" />
              <Bar dataKey="memos" stackId="a" fill="#10B981" name="Mémos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={20} />
            Répartition par matière
          </h3>
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
        </div>

        <div className="glass-card" style={{ minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} />
            Maîtrise par matière
          </h3>
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
        </div>

        <div className="glass-card" style={{ minHeight: '300px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BrainCircuit size={20} />
                Maturité des Cartes
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie data={cardMasteryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} label={({ name, value }) => `${name}: ${value}`}>
                        {cardMasteryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} />
            Précision des Réponses
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={answerAccuracyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {answerAccuracyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ gridColumn: 'span 2', minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} />
            Taux de réussite par matière
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={successRateBySubjectData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-color)', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-color)', fontSize: 11 }} width={100} />
              <Tooltip
                contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                formatter={(value, name, props) => {
                  const { payload } = props;
                  const total = payload.total;
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                  return `${value} (${percentage}%)`;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }} />
              <Bar dataKey="Réussite" stackId="a" fill="#10B981" />
              <Bar dataKey="Échec" stackId="a" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card" style={{ gridColumn: 'span 3' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Flame size={20} />
            Calendrier d'Activité
          </h3>
          <div style={{ height: '180px', overflow: 'hidden' }}>
            <CalendarHeatmap
              startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
              endDate={new Date()}
              values={activityStreakData}
              classForValue={(value) => {
                if (!value) return 'color-empty';
                return `color-scale-${Math.min(4, value.count)}`;
              }}
              tooltipDataAttrs={value => ({ 'data-tooltip-id': 'heatmap-tooltip', 'data-tooltip-content': `${value.date}: ${value.count} révisions` })}
            />
          </div>
        </div>

        <div className="glass-card" style={{ gridColumn: 'span 3' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ListTodo size={20} />
                Top 10 Cartes Difficiles
            </h3>
            <div style={{ height: 'auto', maxHeight: '220px', overflowY: 'auto' }}>
                {difficultCards.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem' }}>
                        {difficultCards.map(card => (
                            <li key={card.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <strong style={{ color: 'var(--text-color)' }}>Q:</strong> {card.question}
                                <br />
                                <span style={{ color: 'var(--text-muted)' }}>R: {card.answer} (Facilité: {card.easeFactor.toFixed(2)})</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--text-muted)' }}>
                        Aucune carte difficile
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

const StatsPageWrapper = () => (
  <>
    <style>{heatmapStyles}</style>
    <StatsPage />
    <ReactTooltip id="heatmap-tooltip" />
  </>
);

const heatmapStyles = `
.react-calendar-heatmap .color-empty { fill: rgba(255, 255, 255, 0.05); }
.react-calendar-heatmap .color-scale-1 { fill: #10B981; }
.react-calendar-heatmap .color-scale-2 { fill: #34D399; }
.react-calendar-heatmap .color-scale-3 { fill: #6EE7B7; }
.react-calendar-heatmap .color-scale-4 { fill: #A7F3D0; }
.react-tooltip {
  background-color: var(--background-card) !important;
  color: var(--text-color) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 8px !important;
  font-size: 0.875rem !important;
}
`;

export default StatsPageWrapper;
