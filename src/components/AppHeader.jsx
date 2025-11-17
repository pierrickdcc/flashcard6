// src/components/AppHeader.jsx
import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { Link } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';
import { User } from 'lucide-react';
import ProfileSideMenu from './ProfileSideMenu';
import { useAuth } from '../context/AuthContext';
import { useDataSync } from '../context/DataSyncContext';

const AppHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { session } = useAuth();
  const { signOut } = useDataSync();

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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu profil"
              type="button"
            >
              <User size={20} />
            </button>
            <ProfileSideMenu
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              userEmail={session?.user?.email}
              onSignOut={() => {
                signOut();
                setIsMenuOpen(false);
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;