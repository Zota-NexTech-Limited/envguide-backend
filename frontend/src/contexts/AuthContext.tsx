import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import authService from '../lib/authService';
import type { AuthState, User } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ 
    success: boolean; 
    message: string; 
    requiresMFA?: boolean; 
    mfaData?: any; 
  }>;
  signup: (userData: any) => Promise<{ success: boolean; message: string }>;
  verifyMFA: (email: string, mfaToken: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    // Check if user is already authenticated on app load
    const checkAuth = () => {
      const token = authService.getToken();
      const user = authService.getCurrentUser();
      
      if (token && user) {
        setAuthState({
          isAuthenticated: true,
          user,
          token,
          loading: false,
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          loading: false,
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await authService.login({ user_email: email, password });
      
      // Only set authentication state if login is successful and no MFA is required
      if (result.success && result.user && !result.requiresMFA) {
        setAuthState({
          isAuthenticated: true,
          user: result.user,
          token: authService.getToken(),
          loading: false,
        });
      }
      
      setAuthState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const signup = async (userData: any) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await authService.signup(userData);
      setAuthState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const verifyMFA = async (email: string, mfaToken: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      const result = await authService.verifyMFA(email, mfaToken);
      
      if (result.success && result.user) {
        setAuthState({
          isAuthenticated: true,
          user: result.user,
          token: authService.getToken(),
          loading: false,
        });
      }
      
      setAuthState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error) {
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false, message: 'An unexpected error occurred' };
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    });
  };

  const updateUser = (user: User) => {
    authService.updateUserData(user);
    setAuthState(prev => ({
      ...prev,
      user,
    }));
  };

  const value: AuthContextType = {
    ...authState,
    login,
    signup,
    verifyMFA,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
