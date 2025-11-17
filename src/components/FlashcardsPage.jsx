// src/components/FlashcardsPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { useUIState } from '../context/UIStateContext';
import CardGrid from './CardGrid';
import CardTable from './CardTable';
import Pagination from './Pagination';
import { LayoutGrid, List, Brain, Search } from 'lucide-react';

const CARDS_PER_PAGE = 12;

const FlashcardsPage = () => {
  const { cards, subjects = [], updateCard, deleteCard, getCardsToReview } = useDataSync();
  const { viewMode, setViewMode, setShowReviewSetupModal } = useUIState();

  const [selectedSubject, setSelectedSubject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCard, setEditingCard] = useState(null);
  const [dueCardsCount, setDueCardsCount] = useState(0);

  useEffect(() => {
    const fetchDueCards = async () => {
      const dueCards = await getCardsToReview([selectedSubject]);
      setDueCardsCount(dueCards.length);
    };
    fetchDueCards();
  }, [cards, selectedSubject, getCardsToReview]);

  const filteredCards = useMemo(() => {
    if (!cards) return [];
    let cardsToFilter = selectedSubject === 'all'
      ? cards
      : cards.filter(card => card.subject_id === selectedSubject);

    if (searchQuery.trim() !== '') {
      const lowercasedQuery = searchQuery.toLowerCase();
      cardsToFilter = cardsToFilter.filter(card =>
        (card.question && card.question.toLowerCase().includes(lowercasedQuery)) ||
        (card.answer && card.answer.toLowerCase().includes(lowercasedQuery))
      );
    }
    return cardsToFilter;
  }, [cards, selectedSubject, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSubject, searchQuery]);

  const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE);
  const paginatedCards = filteredCards.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE);

  const handleUpdateCard = async (cardId, updatedData) => {
    await updateCard(cardId, updatedData);
    setEditingCard(null);
  };

  return (
    <div className="main-content">
      <div className="page-header">
        <h1>Flashcards</h1>
        <p>Gérez et révisez vos cartes d'apprentissage.</p>
      </div>

      <div className="toolbar-container">
        <div className="flex-grow flex items-center gap-2">
          {/* Champ de recherche */}
          <div className="relative flex-grow md:flex-grow-0">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Rechercher une carte..."
              className="search-input pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Sélecteur de matière */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="select"
          >
            <option value="all">Toutes les matières</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Réviser */}
          <button
            className="btn btn-primary hidden md:flex items-center gap-2"
            onClick={() => setShowReviewSetupModal(true)}
          >
            <Brain size={18} />
            <span>Réviser ({dueCardsCount})</span>
          </button>

          {/* Bascule de vue */}
          <div className="view-toggle">
            <button onClick={() => setViewMode('grid')} className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`} aria-label="Afficher en grille">
              <LayoutGrid size={20} />
            </button>
            <button onClick={() => setViewMode('table')} className={`icon-btn ${viewMode === 'table' ? 'active' : ''}`} aria-label="Afficher en liste">
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Bouton Réviser pour mobile */}
      <div className="md:hidden mt-4">
        <button
          className="btn btn-primary w-full flex items-center justify-center gap-2"
          onClick={() => setShowReviewSetupModal(true)}
        >
          <Brain size={18} />
          <span>Réviser ({dueCardsCount})</span>
        </button>
      </div>


      {viewMode === 'grid' ? (
        <CardGrid
          filteredCards={paginatedCards}
          setEditingCard={() => alert('Modification non disponible en vue grille.')}
          deleteCardWithSync={deleteCard}
          subjects={subjects}
        />
      ) : (
        <CardTable
          filteredCards={paginatedCards}
          editingCard={editingCard}
          setEditingCard={setEditingCard}
          updateCardWithSync={handleUpdateCard}
          deleteCardWithSync={deleteCard}
          subjects={subjects}
        />
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default FlashcardsPage;
