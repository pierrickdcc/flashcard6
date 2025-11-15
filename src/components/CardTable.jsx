import React, { useMemo, useEffect, useState } from 'react';
import { Edit, Trash2, Check, X, Inbox } from 'lucide-react';
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

  useEffect(() => {
    const fetchProgress = async () => {
      if (!session?.user?.id) return;
      const allProgress = await db.user_card_progress.where('user_id').equals(session.user.id).toArray();
      const map = new Map(allProgress.map(p => [p.card_id, p]));
      setProgressMap(map);
    };
    fetchProgress();
  }, [session, filteredCards]);

  if (filteredCards.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucune carte à afficher"
        message="Ajoutez de nouvelles cartes ou modifiez vos filtres de recherche."
      />
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Réponse</th>
            <th>Matière</th>
            <th>Prochaine</th>
            <th>Facilité</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCards.map((card) => {
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