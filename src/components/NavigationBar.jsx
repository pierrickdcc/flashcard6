// src/components/NavigationBar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, LayoutGrid, BookOpen, PenSquare, BarChart2, User } from 'lucide-react';

const navLinks = [
  { to: '/', text: 'Accueil', icon: Home },
  { to: '/flashcards', text: 'Flashcards', icon: LayoutGrid },
  { to: '/courses', text: 'Cours', icon: BookOpen },
  { to: '/memos', text: 'Mémos', icon: PenSquare },
  { to: '/stats', text: 'Stats', icon: BarChart2 },
];

const NavigationBar = ({ onProfileClick }) => {
  return (
    <nav className="navigation-bar">
      <div className="navigation-content">
        {navLinks.map(({ to, text, icon: Icon }) => (
          <NavLink key={to} to={to} className="nav-link">
            <Icon size={20} />
            <span>{text}</span>
          </NavLink>
        ))}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("Profile button clicked in navigation");
            if (onProfileClick) onProfileClick();
          }} 
          className="nav-link"
          type="button"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <User size={20} />
          <span>Profil</span>
        </button>
      </div>
    </nav>
  );
};

export default NavigationBar;