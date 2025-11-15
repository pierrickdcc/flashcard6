import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email ou mot de passe invalide.');
    } else {
      setMessage('Connexion réussie ! Redirection...');
      // The redirect is handled by the onAuthStateChange listener in App.jsx
    }
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <div
      className="grid place-items-center min-h-screen p-4"
      style={{ backgroundImage: 'linear-gradient(160deg, #1e3a8a20 0%, #0e1116 100%)' }}
    >
      <motion.div
        className="w-full max-w-sm bg-glass backdrop-blur-lg border-2 border-white/20 rounded-2xl p-10 shadow-lg shadow-primary/20 text-center auth-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-center justify-center gap-3 text-2xl font-bold mb-2">
            {/* Remplacement de l'icône SVG inline par le logo */}
            <div className="logo-svg-container logo-svg-large" />
            {/* Remplacement du nom de l'appli */}
            <span className="logo-text text-3xl">Flash</span>
        </div>
        <p className="mb-8 text-sm opacity-80">Apprenez plus intelligemment</p>

        <form onSubmit={handleLogin}>
            <div className="text-left mb-5">
                <label htmlFor="email" className="block mb-2 text-sm font-medium text-heading">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="vous@email.com"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-heading text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
            </div>
            <div className="text-left mb-5">
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-heading">Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-heading text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
            </div>
            {error && <p className="text-red-400 text-sm text-center my-4">{error}</p>}
            {message && <p className="text-green-400 text-sm text-center my-4">{message}</p>}
            <button
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Auth;