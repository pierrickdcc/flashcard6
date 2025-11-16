import React from 'react';
import ModalWrapper from './ModalWrapper';
import { Download, Upload, Terminal } from 'lucide-react';

const PreferencesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Préférences"
    >
      <div className="modal-body">
        <p className="text-sm text-muted-foreground mb-4">
          Gérez les paramètres avancés de l'application.
        </p>

        <div className="flex flex-col gap-4">
          <button className="btn btn-secondary justify-start">
            <Terminal size={16} />
            <span>Afficher la console de debugging</span>
          </button>
          <button className="btn btn-secondary justify-start">
            <Upload size={16} />
            <span>Importer des données (JSON)</span>
          </button>
          <button className="btn btn-secondary justify-start">
            <Download size={16} />
            <span>Exporter les données (JSON)</span>
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

export default PreferencesModal;