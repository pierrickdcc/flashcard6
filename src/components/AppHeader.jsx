import React from 'react';
import { User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { Link } from 'react-router-dom';

const AppHeader = () => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          {/* Remplacement de l'icône par le logo SVG */}
          <div className="logo-svg-container" />
          {/* Remplacement du nom de l'appli */}
          <span className="logo-text">Flash</span>
        </Link>
        <div className="header-actions">
          <ThemeToggle />
          <button className="avatar">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;