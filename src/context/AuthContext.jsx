import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { LOCAL_STORAGE_KEYS } from '../constants/app';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [workspaceId, setWorkspaceIdState] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fonction pour mettre à jour le workspace ID
  const setWorkspaceId = (newWorkspaceId) => {
    setWorkspaceIdState(newWorkspaceId);
    localStorage.setItem(LOCAL_STORAGE_KEYS.WORKSPACE_ID, newWorkspaceId);
    setIsConfigured(true);
  };

  useEffect(() => {
    // Récupérer ou créer le workspace ID
    let savedWorkspace = localStorage.getItem(LOCAL_STORAGE_KEYS.WORKSPACE_ID);
    
    // Si pas de workspace sauvegardé, en créer un par défaut
    if (!savedWorkspace) {
      // Générer un workspace ID unique basé sur l'email de l'utilisateur (quand disponible)
      // ou un UUID simple pour commencer
      savedWorkspace = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(LOCAL_STORAGE_KEYS.WORKSPACE_ID, savedWorkspace);
      console.log('✅ Workspace ID créé automatiquement:', savedWorkspace);
    }
    
    setWorkspaceIdState(savedWorkspace);
    setIsConfigured(true);

    // Récupérer la session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      // Si l'utilisateur est connecté et n'a pas de workspace personnalisé,
      // créer un workspace basé sur son email
      if (session && savedWorkspace.startsWith('workspace_')) {
        const userWorkspace = session.user.email.split('@')[0];
        setWorkspaceId(userWorkspace);
        console.log('✅ Workspace personnalisé créé:', userWorkspace);
      }
      
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Lors de la connexion, créer un workspace basé sur l'email
      if (session && workspaceId.startsWith('workspace_')) {
        const userWorkspace = session.user.email.split('@')[0];
        setWorkspaceId(userWorkspace);
        console.log('✅ Workspace mis à jour lors de la connexion:', userWorkspace);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const value = {
    session,
    workspaceId,
    setWorkspaceId,
    isConfigured,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};