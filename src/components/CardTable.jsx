
import React, { useMemo } from 'react';
import { Edit, Trash2, Check, X, Inbox } from 'lucide-react';
import EmptyState from './EmptyState';

const CardTable = ({
  filteredCards,
  editingCard,
  setEditingCard,
  updateCardWithSync,
  deleteCardWithSync,
  subjects
}) => {
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);

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
            <th>Révisions</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCards.map((card) => (
            <tr key={card.id}>
              <td>{card.front}</td>
              <td>{card.back}</td>
              <td>
                <span className="subject-badge">
                  {subjectMap.get(card.subject_id) || 'N/A'}
                </span>
              </td>
              <td>
                {card.next_review_date
                  ? new Date(card.next_review_date).toLocaleDateString('fr-FR')
                  : 'Jamais'}
              </td>
              <td style={{ textAlign: 'center' }}>{card.reviews}</td>
              <td>
                <div className="actions-cell">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CardTable;
