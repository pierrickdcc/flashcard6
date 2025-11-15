import React from 'react';
import { useUIState } from '../context/UIStateContext';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import ProfileMenu from './ProfileMenu';

const Header = () => {
  const {
    setShowAddCardModal,
    searchTerm,
    debouncedSetSearchTerm,
  } = useUIState();

  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-content">

        {/* Logo */}
        <a href="/" className="logo" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          <div className="logo-svg-container" />
          <span className="logo-text">Flash</span>
        </a>

        {/* Search Bar */}
        <div className="search-bar">
          <Search size={18} className="search-icon"/>
          <input
            type="text"
            placeholder="Rechercher... (Ctrl+K)"
            className="search-input"
            defaultValue={searchTerm}
            onChange={(e) => debouncedSetSearchTerm(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="header-actions">
          <ThemeToggle />

          <button
            className="btn btn-primary"
            onClick={() => setShowAddCardModal(true)}
          >
            <Plus size={18} />
            <span>Nouveau</span>
          </button>

          {/* ProfileMenu intégré ici */}
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;