import React from 'react';
import ThemeToggle from './ThemeToggle';
import ProfileMenu from './ProfileMenu';
import { Link } from 'react-router-dom';

const AppHeader = () => {
  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <div className="logo-svg-container" />
          <span className="logo-text">Flash</span>
        </Link>
        <div className="header-actions">
          <ThemeToggle />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;