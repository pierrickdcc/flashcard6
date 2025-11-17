// src/components/AppHeader.jsx
import React from 'react';
import ThemeToggle from './ThemeToggle';
import { Link } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import { User } from 'lucide-react';

const AppHeader = ({ onProfileClick }) => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <div className="logo-svg-container" />
          <span className="logo-text">Flash</span>
        </Link>
        <div className="flex-grow flex justify-center w-full max-w-md">
            <GlobalSearch />
        </div>
        <div className="header-actions">
          <ThemeToggle />
          <div className="relative">
            <button
              className="avatar header-profile-button hidden md:flex"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onProfileClick) onProfileClick();
              }}
              aria-label="Menu profil"
              type="button"
            >
              <User size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
