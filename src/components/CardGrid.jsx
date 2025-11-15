import React, { useMemo } from 'react';
import { Edit, Trash2, Inbox, Clock, Zap } from 'lucide-react';
import EmptyState from './EmptyState';

const CardGrid = ({ filteredCards, setEditingCard, deleteCardWithSync, subjects }) => {
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

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
      {filteredCards.map((card) => (
        <div key={card.id} className="flash-card">
          <div>
            <div className="card-top">
              <span className="subject-badge">
                {subjectMap.get(card.subject_id) || 'N/A'}
              </span>
              <div className="card-actions">
                <button className="icon-btn-sm" title="Modifier">
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
            <p className="card-content-front">{card.front}</p>
            <p className="card-content-back">{card.back}</p>
          </div>
          <div className="card-footer">
            <div className="card-footer-stat">
              <Clock size={12} />
              <span>
                {card.next_review_date
                  ? new Date(card.next_review_date).toLocaleDateString('fr-FR')
                  : 'Jamais'}
              </span>
            </div>
            <div className="card-footer-stat">
              <Zap size={12} />
              <span>
                Facilité:{' '}
                {card.ease_factor
                  ? `${Math.round(card.ease_factor * 100)}%`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardGrid;
