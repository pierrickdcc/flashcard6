import React from 'react';

const DeleteConfirmationModal = ({ itemType, itemName, onConfirm, onCancel }) => {
  if (!itemName) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
        <p>
          Êtes-vous sûr de vouloir supprimer "{itemName}" ?
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Cette action est irréversible.
        </p>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn btn-secondary">
            Annuler
          </button>
          <button onClick={onConfirm} className="btn btn-danger">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
