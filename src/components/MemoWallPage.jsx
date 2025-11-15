import React from 'react';
import { useUIState } from '../context/UIStateContext';
import MemoWall from './MemoWall';

const MemoWallPage = () => {
  const { setMemoToEdit, setShowMemoModal } = useUIState();

  const handleMemoSelect = (memo) => {
    setMemoToEdit(memo);
    setShowMemoModal(true);
  };

  return (
    <div className="main-content">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes Mémos</h1>
          <p className="text-muted-foreground">Votre mur de post-it personnel.</p>
        </div>
      </div>
      <MemoWall onMemoSelect={handleMemoSelect} />
    </div>
  );
};

export default MemoWallPage;