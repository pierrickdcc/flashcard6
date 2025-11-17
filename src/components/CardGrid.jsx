import React, { useMemo, useEffect, useState } from 'react';
import { Edit, Trash2, Inbox, Clock, Zap } from 'lucide-react';
import EmptyState from './EmptyState';
import { useAuth } from '../context/AuthContext';
import { db } from '../db';

const CardGrid = ({ filteredCards, setEditingCard, deleteCardWithSync, subjects }) => {
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const { session } = useAuth();
  const [progressMap, setProgressMap] = useState(new Map());

  useEffect(() => {
    const fetchProgress = async () => {
      if (!session?.user?.id) return;
      const allProgress = await db.user_card_progress.where('userId').equals(session.user.id).toArray();
      const map = new Map(allProgress.map(p => [p.cardId, p]));
      setProgressMap(map);
    };
    fetchProgress();
  }, [session, filteredCards]);

  if (!filteredCards || filteredCards.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Aucune flashcard trouvée"
        message="Commencez par ajouter une nouvelle carte ou ajustez vos filtres."
      />
    );
  }

  return (
    <div className="card-grid">
      {filteredCards.map((card) => {
        const progress = progressMap.get(card.id);
        const nextReviewDate = progress?.dueDate ? new Date(progress.dueDate) : null;
        const easeFactor = progress?.easeFactor || 2.5;

        return (
          <div key={card.id} className="flash-card">
            <div>
              <div className="card-top">
                <span className="subject-badge">
                  {subjectMap.get(card.subject_id) || 'N/A'}
                </span>
                <div className="card-actions">
                  <button onClick={() => alert('La modification n\'est possible que depuis la vue en liste.')} className="icon-btn-sm" title="Modifier">
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteCardWithSync(card.id)}
                    className="icon-btn-sm"
                    style={{ color: '#ef4444' }}
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="card-content-front">{card.question}</p>
              <p className="card-content-back">{card.answer}</p>
            </div>
            <div className="card-footer">
              <div className="card-footer-stat">
                <Clock size={12} />
                <span>
                  {nextReviewDate
                    ? new Date(nextReviewDate).toLocaleDateString('fr-FR')
                    : 'Jamais'}
                </span>
              </div>
              <div className="card-footer-stat">
                <Zap size={12} />
                <span>
                  {Math.round(easeFactor * 100)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardGrid;