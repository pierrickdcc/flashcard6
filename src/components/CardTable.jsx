import React, { useMemo, useEffect, useState } from 'react';
import { Edit, Trash2, Check, X, Inbox, ArrowDown, ArrowUp } from 'lucide-react';
import EmptyState from './EmptyState';
import { useAuth } from '../context/AuthContext';
import { db } from '../db';

const CardTable = ({
  filteredCards,
  editingCard,
  setEditingCard,
  updateCardWithSync,
  deleteCardWithSync,
  subjects
}) => {
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const { session } = useAuth();
  const [progressMap, setProgressMap] = useState(new Map());
  const [sortConfig, setSortConfig] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!session?.user?.id) return;
      const allProgress = await db.user_card_progress.where('userId').equals(session.user.id).toArray();
      const map = new Map(allProgress.map(p => [p.cardId, p]));
      setProgressMap(map);
    };
    fetchProgress();
  }, [session, filteredCards]);

  const sortedCards = useMemo(() => {
    if (!sortConfig) return filteredCards;

    let sortableItems = [...filteredCards];
    sortableItems.sort((a, b) => {
        const getSortValue = (item, key) => {
          if (key === 'subject') return subjectMap.get(item.subject_id) || '';
          if (key === 'nextReview') {
            const progress = progressMap.get(item.id);
            return progress?.dueDate ? new Date(progress.dueDate) : new Date(0);
          }
          if (key === 'easeFactor') {
            const progress = progressMap.get(item.id);
            return progress?.easeFactor || 2.5;
          }
          return item[key] || '';
        };

        const aValue = getSortValue(a, sortConfig.key);
        const bValue = getSortValue(b, sortConfig.key);

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    return sortableItems;
  }, [filteredCards, sortConfig, subjectMap, progressMap]);

  const requestSort = (key) => {
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      setSortConfig({ key, direction: 'descending' });
    } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'descending') {
      setSortConfig(null);
    } else {
      setSortConfig({ key, direction: 'ascending' });
    }
  };

  const getSortIcon = (key) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  if (filteredCards.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucune carte à afficher"
        message="Ajoutez de nouvelles cartes ou modifiez vos filtres de recherche."
      />
    );
  }

  const renderHeader = (label, key) => (
    <th onClick={() => requestSort(key)}>
      <div className="th-content">
        {label}
        {getSortIcon(key)}
      </div>
    </th>
  );

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {renderHeader('Question', 'question')}
            {renderHeader('Réponse', 'answer')}
            {renderHeader('Matière', 'subject')}
            {renderHeader('Prochaine', 'nextReview')}
            {renderHeader('Facilité', 'easeFactor')}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedCards.map((card) => {
            const progress = progressMap.get(card.id);
            const nextReviewDate = progress?.dueDate ? new Date(progress.dueDate) : null;
            const easeFactor = progress?.easeFactor || 2.5;

            return (
              <tr key={card.id}>
                <td>
                  {editingCard?.id === card.id ? (
                    <input
                      value={editingCard.question}
                      onChange={(e) => setEditingCard({ ...editingCard, question: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <span>{card.question}</span>
                  )}
                </td>
                <td>
                  {editingCard?.id === card.id ? (
                    <input
                      value={editingCard.answer}
                      onChange={(e) => setEditingCard({ ...editingCard, answer: e.target.value })}
                      className="input"
                    />
                  ) : (
                    <span>{card.answer}</span>
                  )}
                </td>
                <td>
                  {editingCard?.id === card.id ? (
                    <select
                      value={editingCard.subject_id}
                      onChange={(e) => setEditingCard({ ...editingCard, subject_id: e.target.value })}
                      className="select"
                    >
                      {(subjects || []).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="subject-badge">
                      {subjectMap.get(card.subject_id) || 'N/A'}
                    </span>
                  )}
                </td>
                <td>
                  {nextReviewDate
                    ? new Date(nextReviewDate).toLocaleDateString('fr-FR')
                    : 'Jamais'}
                </td>
                <td style={{ textAlign: 'center' }}>{Math.round(easeFactor * 100)}%</td>
                <td>
                  <div className="actions-cell">
                    {editingCard?.id === card.id ? (
                      <>
                        <button onClick={() => updateCardWithSync(card.id, editingCard)} className="icon-btn" style={{ color: '#10b981' }}>
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingCard(null)} className="icon-btn">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditingCard(card)} className="icon-btn">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => deleteCardWithSync(card.id)} className="icon-btn" style={{ color: '#ef4444' }}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CardTable;