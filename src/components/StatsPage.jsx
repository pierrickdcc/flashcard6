import React, { useMemo } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
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
    const totalCards = cards?.length || 0;
    const totalSubjects = subjects?.length || 0;

    if (!userCardProgress || userCardProgress.length === 0) {
      return { totalCards, totalSubjects, dueToday: totalCards, mastery: '0%' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    
    const progressMap = new Map(userCardProgress.map(p => [p.cardId, p]));

    // Cards without progress are considered "due"
    const dueToday = userCardProgress.filter(p => p.dueDate && new Date(p.dueDate) <= today).length;
   
    // 2. Compter les cartes qui existent mais n'ont AUCUNE progression
    const cardsWithoutProgress = (cards || []).filter(card => !progressMap.has(card.id)).length;
  
   // Le total dû est la somme des deux
    const totalDue = dueToday + cardsWithoutProgress;

    const progressWithFactor = userCardProgress.filter(p => p.easeFactor && p.easeFactor > 0);
    const avgEase = progressWithFactor.length > 0 ? progressWithFactor.reduce((acc, p) => acc + p.easeFactor, 0) / progressWithFactor.length : 1.3;
    const masteryPercent = Math.round(((avgEase - 1.3) / (3.0 - 1.3)) * 100);

    return {
      totalCards,
      totalSubjects,
      dueToday: totalDue,
      mastery: `${Math.min(100, Math.max(0, masteryPercent))}%`,
    };
  }, [cards, subjects, userCardProgress]);

  const creationActivityData = useMemo(() => {
    const last30Days = Array(30).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dataMap = new Map(last30Days.map(day => [day, { day: new Date(day).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }), cartes: 0, cours: 0, memos: 0 }]));

    [...cards, ...courses, ...memos].forEach(item => {
      const createdAtDate = item.created_at || item.createdAt;
      if (createdAtDate && !isNaN(new Date(createdAtDate))) {
        const createdAt = new Date(createdAtDate).toISOString().split('T')[0];
        if (dataMap.has(createdAt)) {
          const entry = dataMap.get(createdAt);
          if ('question' in item) entry.cartes += 1;
          else if ('title' in item) entry.cours += 1;
          else entry.memos += 1;
        }
      }
    });

    return Array.from(dataMap.values());
  }, [cards, courses, memos]);

  const cardMasteryData = useMemo(() => {
    if (!cards || !userCardProgress) return [];

    const statusCounts = { "Nouvelle": 0, "En apprentissage": 0, "Maîtrisée": 0 };
    const progressMap = new Map(userCardProgress.map(p => [p.cardId, p.status]));

    cards.forEach(card => {
      const status = progressMap.get(card.id) || 'Nouvelle';
      if (status in statusCounts) {
        statusCounts[status]++;
      } else {
        // Fallback for any unexpected status values
        statusCounts['Nouvelle']++;
      }
    });

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
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
      return {
        ...card,
        easeFactor: p.easeFactor,
      };
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
    const ratings = { 'À revoir': 0, 'Difficile': 0, 'Moyen': 0, 'Facile': 0, 'Très facile': 0 };
    reviewHistory.forEach(r => {
      if (r.rating === 1) ratings['À revoir']++;
      else if (r.rating === 2) ratings['Difficile']++;
      else if (r.rating === 3) ratings['Moyen']++;
      else if (r.rating === 4) ratings['Facile']++;
      else if (r.rating === 5) ratings['Très facile']++;
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

    const progressMap = new Map(userCardProgress.map(p => [p.cardId, p]));

    return Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const day = date.toLocaleDateString('fr-FR', { weekday: 'short' });

      const count = userCardProgress.reduce((acc, p) => {
        if (!p.dueDate) return acc;
        const reviewDate = new Date(p.dueDate);
        reviewDate.setHours(0, 0, 0, 0);
        return reviewDate.getTime() === date.getTime() ? acc + 1 : acc;
      }, 0);

      return { day, cartes: count };
    });
  }, [userCardProgress]);

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
    if (!cards || !subjects || !userCardProgress) return [];

    const progressMap = new Map(userCardProgress.map(p => [p.cardId, p]));

    const masteryData = subjects.map(subject => {
      const subjectCards = cards.filter(c => c.subject_id === subject.id);
      if (subjectCards.length === 0) {
        return { name: subject.name, mastery: 0, count: 0 };
      }

      const subjectProgress = subjectCards
        .map(c => progressMap.get(c.id))
        .filter(p => p && p.easeFactor);

      if (subjectProgress.length === 0) {
        return { name: subject.name, mastery: 0, count: subjectCards.length };
      }

      const avgEase = subjectProgress.reduce((acc, p) => acc + p.easeFactor, 0) / subjectProgress.length;
      const masteryPercent = Math.round(((avgEase - 1.3) / (3.0 - 1.3)) * 100);

      return { 
        name: subject.name, 
        mastery: Math.min(100, Math.max(0, masteryPercent)),
        count: subjectCards.length
      };
    }).filter(d => d.count > 0).sort((a, b) => a.mastery - b.mastery);

    return masteryData;
  }, [cards, subjects, userCardProgress]);

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
        
        {/* Prévisions */}
        <div className="glass-card" style={{ minHeight: '300px' }}>
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

        {/* Activité de Création */}
        <div className="glass-card" style={{ minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} />
            Activité de Création (30 jours)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={creationActivityData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
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

        {/* Répartition */}
        <div className="glass-card" style={{ minHeight: '300px' }}>
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
        <div className="glass-card" style={{ minHeight: '300px' }}>
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

        {/* Maturité des Cartes */}
        <div className="glass-card" style={{ minHeight: '300px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BrainCircuit size={20} />
                Maturité des Cartes
            </h3>
            <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                    <Pie data={cardMasteryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                        {cardMasteryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>

        {/* Cartes Difficiles */}
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

        {/* Calendrier d'Activité "Streak" */}
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

        {/* Précision des Réponses */}
        <div className="glass-card" style={{ minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={20} />
            Précision des Réponses
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={answerAccuracyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {answerAccuracyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Taux de réussite par matière */}
        <div className="glass-card" style={{ gridColumn: 'span 2', minHeight: '300px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-heading-color)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} />
            Taux de réussite par matière
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={successRateBySubjectData} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-color)', fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-color)', fontSize: 11 }} width={100} />
              <Tooltip
                contentStyle={{ background: 'var(--background-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                formatter={(value, name, props) => {
                  const { payload } = props;
                  const total = payload.Réussite + payload.Échec;
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
                  return `${value} (${percentage}%)`;
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.8rem' }}/>
              <Bar dataKey="Réussite" stackId="a" fill="#10B981" />
              <Bar dataKey="Échec" stackId="a" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const heatmapStyles = `
.react-calendar-heatmap .color-empty { fill: rgba(255, 255, 255, 0.05); }
.react-calendar-heatmap .color-scale-1 { fill: #10B981; }
.react-calendar-heatmap .color-scale-2 { fill: #34D399; }
.react-calendar-heatmap .color-scale-3 { fill: #6EE7B7; }
.react-calendar-heatmap .color-scale-4 { fill: #A7F3D0; }
.react-calendar-heatmap .color-scale-5 { fill: #D1FAE5; }
.react-tooltip {
  background-color: var(--background-card) !important;
  color: var(--text-color) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 8px !important;
  font-size: 0.875rem !important;
}
`;

const StatsPageWrapper = () => (
  <>
    <style>{heatmapStyles}</style>
    <StatsPage />
    <ReactTooltip id="heatmap-tooltip" />
  </>
);

export default StatsPageWrapper;
