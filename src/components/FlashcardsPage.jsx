import React, { useState, useMemo, useEffect } from 'react';
import { useDataSync } from '../context/DataSyncContext';
import { useUIState } from '../context/UIStateContext';
import CardGrid from './CardGrid';
import CardTable from './CardTable';
import Pagination from './Pagination';
import ReviewSessionSetup from './ReviewSessionSetup';
import { LayoutGrid, List, Brain, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const CARDS_PER_PAGE = 12;

const FlashcardsPage = () => {
  const { cards, subjects = [], updateCard, deleteCard, getCardsToReview } = useDataSync();
  const { viewMode, setViewMode, showReviewSetupModal, setShowReviewSetupModal } = useUIState();

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

    let cardsToFilter = cards;

    if (selectedSubject !== 'all') {
      cardsToFilter = cardsToFilter.filter(card => card.subject_id === selectedSubject);
    }

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
  const paginatedCards = filteredCards.slice(
    (currentPage - 1) * CARDS_PER_PAGE,
    currentPage * CARDS_PER_PAGE
  );

  const handleUpdateCard = async (cardId, updatedData) => {
    await updateCard(cardId, updatedData);
    setEditingCard(null);
  };

   return (
    <div className="main-content">
      <div className="flashcards-page-header">
        <h1>Flashcards</h1>
        <p>Gérez et révisez vos cartes</p>
      </div>

      {dueCardsCount > 0 && (
        <div className="glass-card mb-6 p-6 flashcards-review-section">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-heading-color mb-1">Cartes à réviser</h3>
              <p className="text-muted-foreground">
                Vous avez <strong className="text-stat-value-review">{dueCardsCount}</strong> carte{dueCardsCount > 1 ? 's' : ''} à réviser
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="toolbar">
         <div className="search-bar md:flex-grow" style={{ minWidth: '200px', maxWidth: '400px' }}>
           <Search size={18} className="search-icon" />
         
          <input
            type="text"
            placeholder="Rechercher une carte..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="select"
            style={{ minWidth: '180px' }}
          >
            <option value="all">Toutes les matières</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary flex items-center gap-2"
            onClick={() => setShowReviewSetupModal(true)}
          >
            <Brain size={18} />
            <span>Réviser ({dueCardsCount})</span>
          </button>
        </div>
        <div className="view-toggle md:ml-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`icon-btn ${
              viewMode === 'grid' ? 'active' : ''
            }`}
            aria-label="Afficher en grille"
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`icon-btn ${
              viewMode === 'table' ? 'active' : ''
            }`}
            aria-label="Afficher en liste"
          >
            <List size={20} />
          </button>
        </div>
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default FlashcardsPage;
