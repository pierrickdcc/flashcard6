import React, { useState, useEffect } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';

const colorPalette = [
  { name: 'yellow', label: 'Jaune' },
  { name: 'blue', label: 'Bleu' },
  { name: 'green', label: 'Vert' },
  { name: 'pink', label: 'Rose' },
  { name: 'purple', label: 'Violet' },
  { name: 'gray', label: 'Gris' }
];

const MemoModal = ({ isOpen, onClose, memoToEdit }) => {
  const { addMemo, updateMemoWithSync, deleteMemoWithSync } = useDataSync();

  const [content, setContent] = useState('');
  const [color, setColor] = useState('yellow');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (memoToEdit) {
      setContent(memoToEdit.content || '');
      setColor(memoToEdit.color || 'yellow');
      setIsPinned(memoToEdit.isPinned || false);
    } else {
      setContent('');
      setColor('yellow');
      setIsPinned(false);
    }
  }, [memoToEdit, isOpen]);

  const handleSave = () => {
    if (!content.trim()) {
      return;
    }
    const memoData = { content: content.trim(), color, isPinned };
    if (memoToEdit) {
      updateMemoWithSync(memoToEdit.id, memoData);
    } else {
      addMemo(memoData);
    }
    onClose();
  };

  const handleDelete = () => {
    if (memoToEdit && window.confirm('Êtes-vous sûr de vouloir supprimer ce mémo ?')) {
      deleteMemoWithSync(memoToEdit.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-backdrop" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="modal-content"
            style={{ maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{memoToEdit ? 'Modifier le mémo' : 'Nouveau mémo'}</h2>
              <button onClick={onClose} className="icon-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="memo-content" className="label">Contenu</label>
                <textarea
                  id="memo-content"
                  placeholder="Notez vos idées, rappels..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="textarea"
                  rows="6"
                  style={{ fontFamily: 'inherit' }}
                />
              </div>

              <div className="form-group">
                <label className="label">Couleur</label>
                <div className="color-palette">
                  {colorPalette.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      className={`color-dot ${color === c.name ? 'active' : ''}`}
                      style={{ 
                        background: `var(--memo-${c.name}-border)`,
                        '--color-bg': `var(--memo-${c.name}-bg)` 
                      }}
                      title={c.label}
                      onClick={() => setColor(c.name)}
                    />
                  ))}
                </div>
              </div>

              <label 
                className="flex items-center gap-3 cursor-pointer" 
                style={{ color: 'var(--text-heading-color)', fontSize: '0.875rem' }}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--primary-color)' }}
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
                Épingler ce mémo à l'accueil
              </label>
            </div>

            <div className="modal-footer modal-footer-danger">
              {memoToEdit && (
                <button onClick={handleDelete} className="btn btn-danger">
                  <Trash2 size={16} />
                  Supprimer
                </button>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', marginLeft: 'auto' }}>
                <button onClick={onClose} className="btn btn-secondary">Annuler</button>
                <button onClick={handleSave} className="btn btn-primary" disabled={!content.trim()}>
                  Sauvegarder
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MemoModal;