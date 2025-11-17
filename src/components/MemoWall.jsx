// src/components/MemoWall.jsx
import React, { useMemo, useState } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { Pin, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MemoCard = ({ memo, onClick, onDelete, isPinned }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`memo-card-redesign memo-${memo.color}`}
      style={{
        position: 'relative',
        cursor: 'pointer',
        minHeight: isPinned ? '140px' : '180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Pin indicator */}
      {isPinned && (
        <div style={{
          position: 'absolute',
          top: '0.75rem',
          right: '0.75rem',
          opacity: 0.7,
        }}>
          <Pin size={16} style={{ transform: 'rotate(45deg)' }} />
        </div>
      )}

      {/* Content */}
      <div style={{
        padding: '1.25rem',
        paddingTop: isPinned ? '2.5rem' : '1.25rem',
        flex: 1,
        overflow: 'hidden',
      }}>
        <p style={{
          fontSize: isPinned ? '0.875rem' : '0.95rem',
          lineHeight: isPinned ? 1.5 : 1.6,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: isPinned ? 4 : 8,
          WebkitBoxOrient: 'vertical',
        }}>
          {memo.content}
        </p>
      </div>

      {/* Actions (hover) */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '0.75rem',
              right: '0.75rem',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.2)',
                backdropFilter: 'blur(8px)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)'}
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Supprimer ce mémo ?')) {
                  onDelete(memo.id);
                }
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.2)',
                backdropFilter: 'blur(8px)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: '#ef4444',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            >
              <Trash2 size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MemoWall = ({ onMemoSelect }) => {
  const { memos, deleteMemoWithSync } = useDataSync();

  const { pinnedMemos, unpinnedMemos } = useMemo(() => {
    if (!memos || memos.length === 0) {
      return { pinnedMemos: [], unpinnedMemos: [] };
    }

    const pinned = memos.filter(m => m.isPinned);
    const unpinned = memos.filter(m => !m.isPinned);

    return {
      pinnedMemos: pinned.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      unpinnedMemos: unpinned.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    };
  }, [memos]);

  return (
    <div>
      {/* Pinned Memos Section */}
      {pinnedMemos.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid var(--border-color)',
          }}>
            <Pin size={18} style={{ transform: 'rotate(45deg)', color: 'var(--primary-color)' }} />
            <h2 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-heading-color)',
              margin: 0,
            }}>
              Épinglés ({pinnedMemos.length})
            </h2>
          </div>

          <div className="memo-wall-redesign pinned-section">
            <AnimatePresence>
              {pinnedMemos.map((memo) => (
                <MemoCard
                  key={memo.id}
                  memo={memo}
                  onClick={() => onMemoSelect(memo)}
                  onDelete={deleteMemoWithSync}
                  isPinned
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* All Memos Section */}
      {unpinnedMemos.length > 0 && (
        <div>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--text-heading-color)',
            marginBottom: '1rem',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid var(--border-color)',
          }}>
            Tous les mémos ({unpinnedMemos.length})
          </h2>

          <div className="memo-wall-redesign">
            <AnimatePresence>
              {unpinnedMemos.map((memo) => (
                <MemoCard
                  key={memo.id}
                  memo={memo}
                  onClick={() => onMemoSelect(memo)}
                  onDelete={deleteMemoWithSync}
                  isPinned={false}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {pinnedMemos.length === 0 && unpinnedMemos.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 1rem',
          color: 'var(--text-muted)',
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1.5rem',
            borderRadius: '50%',
            background: 'var(--muted-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Pin size={32} style={{ transform: 'rotate(45deg)', opacity: 0.5 }} />
          </div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text-heading-color)',
            marginBottom: '0.5rem',
          }}>
            Aucun mémo
          </h3>
          <p style={{ fontSize: '0.95rem' }}>
            Créez votre premier mémo en cliquant sur le bouton +
          </p>
        </div>
      )}
    </div>
  );
};

export default MemoWall;

// CSS à ajouter dans NewStyles.css
const memoWallStyles = `
/* Memo Wall Redesign */
.memo-wall-redesign {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.memo-wall-redesign.pinned-section {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

@media (max-width: 768px) {
  .memo-wall-redesign {
    grid-template-columns: 1fr;
  }
}

.memo-card-redesign {
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 2px solid;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.memo-card-redesign:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Memo Colors - Enhanced */
.memo-card-redesign.memo-yellow { 
  background: var(--memo-yellow-bg); 
  border-color: var(--memo-yellow-border); 
  color: var(--memo-yellow-text); 
}

.memo-card-redesign.memo-blue { 
  background: var(--memo-blue-bg); 
  border-color: var(--memo-blue-border); 
  color: var(--memo-blue-text); 
}

.memo-card-redesign.memo-green { 
  background: var(--memo-green-bg); 
  border-color: var(--memo-green-border); 
  color: var(--memo-green-text); 
}

.memo-card-redesign.memo-pink { 
  background: var(--memo-pink-bg); 
  border-color: var(--memo-pink-border); 
  color: var(--memo-pink-text); 
}

.memo-card-redesign.memo-purple { 
  background: var(--memo-purple-bg); 
  border-color: var(--memo-purple-border); 
  color: var(--memo-purple-text); 
}

.memo-card-redesign.memo-gray { 
  background: var(--memo-gray-bg); 
  border-color: var(--memo-gray-border); 
  color: var(--memo-gray-text); 
}
`;