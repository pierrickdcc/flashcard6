import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      style={{ 
        background: 'var(--background-body)',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.15), transparent 50%)'
      }}
    >
      <motion.div
        className="w-full max-w-md bg-background-card backdrop-blur-lg border border-border rounded-3xl p-8 shadow-2xl auth-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col items-center gap-3 mb-8">
            <div className="logo-svg-container logo-svg-large" />
            <div>
              <h1 className="logo-text text-4xl font-bold text-center">Flash</h1>
              <p className="text-center text-muted-foreground text-sm mt-2">Apprenez plus intelligemment</p>
            </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
            <div>
                <label htmlFor="email" className="label">Adresse email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="vous@email.com"
                  className="input mt-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
            </div>
            <div>
                <label htmlFor="password" className="label">Mot de passe</label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input pr-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 icon-btn"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center"
              >
                {error}
              </motion.div>
            )}
            
            {message && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm text-center"
              >
                {message}
              </motion.div>
            )}
            
            <button
              type="submit"
              className="btn btn-primary w-full justify-center"
              disabled={loading}
            >
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>En vous connectant, vous acceptez nos conditions d'utilisation</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;