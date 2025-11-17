import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ReviewSessionSetup = ({ onStartReview, onClose, isOpen, subjects = [] }) => {
  const [isCramMode, setIsCramMode] = useState(false);
  const [includeFuture, setIncludeFuture] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('all');

  const handleStart = () => {
    onStartReview({ isCramMode, includeFuture, subjectId: selectedSubject });
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
              <h2>Configurer la révision</h2>
              <button onClick={onClose} className="icon-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="label">Quelles cartes réviser ?</label>
                <div className="space-y-3 mt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted-bg transition-colors">
                    <input
                      type="radio"
                      name="card-selection"
                      checked={!includeFuture}
                      onChange={() => setIncludeFuture(false)}
                      className="w-4 h-4"
                      style={{ accentColor: 'var(--primary-color)' }}
                    />
                    <div>
                      <div className="font-medium text-text-heading-color">Cartes dues aujourd'hui</div>
                      <div className="text-sm text-muted-foreground">Réviser uniquement les cartes programmées</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted-bg transition-colors">
                    <input
                      type="radio"
                      name="card-selection"
                      checked={includeFuture}
                      onChange={() => setIncludeFuture(true)}
                      className="w-4 h-4"
                      style={{ accentColor: 'var(--primary-color)' }}
                    />
                    <div>
                      <div className="font-medium text-text-heading-color">Toutes les cartes</div>
                      <div className="text-sm text-muted-foreground">Étude libre (inclut les cartes futures)</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="subject-select">Matière</label>
                <select
                  id="subject-select"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="select mt-2"
                  style={{ width: '100%' }}
                >
                  <option value="all">Toutes les matières</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted-bg transition-colors">
                  <input
                    type="checkbox"
                    checked={isCramMode}
                    onChange={(e) => setIsCramMode(e.target.checked)}
                    className="w-4 h-4"
                    style={{ accentColor: 'var(--primary-color)' }}
                  />
                  <div>
                    <div className="font-medium text-text-heading-color">Mode bachotage</div>
                    <div className="text-sm text-muted-foreground">La progression ne sera pas sauvegardée</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={onClose} className="btn btn-secondary">
                Annuler
              </button>
              <button onClick={handleStart} className="btn btn-primary">
                Démarrer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReviewSessionSetup;