import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

// MODIFIÉ : Ajout de la prop onClick
const FloatingActionButton = ({ onClick }) => {

  return (
    <div className="fixed bottom-20 right-5 z-50 md:bottom-8 md:right-8">
      <button
        onClick={onClick} // Utilisation de la prop
        className="btn btn-primary btn-fab"
        aria-label="Ajouter du contenu"
      >
        <motion.div>
          <Plus size={24} />
        </motion.div>
      </button>
    </div>
  );
};

export default FloatingActionButton;