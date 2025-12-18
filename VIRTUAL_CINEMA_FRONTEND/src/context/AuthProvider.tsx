import React from 'react';
import { useAuthStore } from '../store/authStore';
import { AuthContext } from './authContext';
import type { AuthContextType } from './authContext';

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, token, login: storeLogin, logout: storeLogout } = useAuthStore();

  const value: AuthContextType = {
    user,
    token,
    login: storeLogin,
    logout: storeLogout,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
