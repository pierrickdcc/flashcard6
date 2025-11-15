import React, { useMemo } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

// Logique pour les "cartes difficiles" (similaire à HomePage)
const getDifficultCards = (cards, limit = 5) => {
  if (!cards || cards.length === 0) return [];
  
  // Logique exemple : cartes avec un easeFactor bas et plusieurs révisions
  return [...cards]
    .filter(c => c.reviewCount > 2 && c.easeFactor < 2.3) 
    .sort((a, b) => (a.easeFactor || 0) - (b.easeFactor || 0))
    .slice(0, limit);
};

// Logique pour les prévisions (similaire à HomePage)
const getForecast = (cards) => {
  if (!cards) return [];
  const forecastData = Array(7).fill(0).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);
    const day = date.toLocaleDateString('fr-FR', { weekday: 'short' });
    const count = cards.filter(c => c.nextReview && new Date(c.nextReview).toDateString() === date.toDateString()).length;
    return { day, à_réviser: count };
  });
  return forecastData;
};

// Couleurs pour le graphique circulaire
const PIE_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

const StatsPage = () => {
  const { cards = [], subjects = [] } = useDataSync();

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueCards = cards.filter(c => c.nextReview && new Date(c.nextReview) <= today);
    
    const totalEase = cards.reduce((acc, c) => acc + (c.easeFactor || 2.5), 0);
    // Convertit la "facilité" (ex: 2.5) en "maîtrise" en pourcentage (ex: 82%)
    // C'est une estimation simple. Min: 1.3, Max: ~3.5
    const mastery = Math.round(((totalEase / cards.length) - 1.3) / (3.5 - 1.3) * 100);

    return {
      totalCards: cards.length,
      totalSubjects: subjects.length,
      dueToday: dueCards.length,
      mastery: cards.length > 0 ? `${mastery}%` : 'N/A',
    };
  }, [cards, subjects]);

  const difficultCards = useMemo(() => getDifficultCards(cards), [cards]);
  const forecastData = useMemo(() => getForecast(cards), [cards]);

  const cardsBySubject = useMemo(() => {
    const subjectMap = new Map(subjects.map(s => [s.id, s.name]));
    const counts = cards.reduce((acc, card) => {
      const subjectName = subjectMap.get(card.subject_id) || 'Non classé';
      acc[subjectName] = (acc[subjectName] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(counts).map(name => ({ name, value: counts[name] }));
  }, [cards, subjects]);

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1>Mes Statistiques</h1>
          <p className="text-muted-foreground">Analysez vos progrès et votre assiduité.</p>
        </div>
      </div>

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

      <div className="dashboard-grid">
        
        <div className="glass-card">
          <h3>Prévisions de révision (7 jours)</h3>
          {cards.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={forecastData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                <XAxis dataKey="day" tick={{ fill: 'var(--text-color)', fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-color)', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                  contentStyle={{ background: 'var(--background-body)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
                <Bar dataKey="à_réviser" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-placeholder">Pas de données</div>
          )}
        </div>

        <div className="glass-card">
          <h3>Répartition des cartes</h3>
          {cards.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={cardsBySubject} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                  {cardsBySubject.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--background-body)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="chart-placeholder">Pas de données</div>
          )}
        </div>

        <div className="glass-card">
          <h3>Force par matière (Maîtrise)</h3>
          <div className="chart-placeholder">
            <span>[Graphique à barres horizontales]</span>
          </div>
        </div>

        <div className="glass-card">
          <h3>Cartes difficiles (Top 5)</h3>
          <div className="list-placeholder">
            {difficultCards.length > 0 ? (
              <ul>
                {difficultCards.map(card => (
                  <li key={card.id}>
                    <span className="truncate" title={card.question}>{card.question}</span>
                    <span>Facilité: {Math.round((card.easeFactor || 0) * 100)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-center py-10">Aucune carte difficile !</p>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ gridColumn: '1 / -1' }}>
          <h3>Activité des 30 derniers jours</h3>
          <div className="chart-placeholder" style={{ minHeight: '200px' }}>
            <span>[Calendrier Heatmap]</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatsPage;