import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/index.ts';
import { authClient, RegisterPayload } from '../services/authClient.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  quickLoginAdmin: () => Promise<void>;
  quickLoginPlayer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('fc_token'));
  const [loading, setLoading] = useState<boolean>(true);

  // Check current session on mount or token change
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      if (!token) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const currentUser = await authClient.getCurrentUser(token);
        if (isMounted) {
          setUser(currentUser);
        }
      } catch (err) {
        console.error('Error verifying auth session:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    const result = await authClient.login(email, password);
    if (result.success && result.user && result.token) {
      setToken(result.token);
      setUser(result.user);
      return { success: true };
    }
    return {
      success: false,
      error: result.error || 'Erreur lors de la connexion. Veuillez vérifier vos identifiants.',
    };
  };

  const register = async (formData: RegisterPayload) => {
    const result = await authClient.register(formData);
    if (result.success && result.user && result.token) {
      setToken(result.token);
      setUser(result.user);
      return { success: true };
    }
    return {
      success: false,
      error: result.error || 'Erreur lors de la création du compte.',
    };
  };

  const logout = async () => {
    authClient.logout();
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      if (token) {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          const resData = await res.json();
          setUser(resData.user);
          localStorage.setItem('fc_user', JSON.stringify(resData.user));
          return { success: true };
        }
      }
    } catch {
      // Ignore network errors and update locally
    }

    if (user) {
      const updatedUser: User = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('fc_user', JSON.stringify(updatedUser));
      return { success: true };
    }

    return { success: false, error: 'Utilisateur non connecté.' };
  };

  const quickLoginAdmin = async () => {
    await login('admin@fctournament.ma', 'admin123');
  };

  const quickLoginPlayer = async () => {
    await login('joueur@fctournament.ma', 'joueur123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        quickLoginAdmin,
        quickLoginPlayer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
