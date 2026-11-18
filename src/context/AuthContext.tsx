import React, { createContext, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { AdminUser } from '../../shared/types/index.ts';

interface AuthContextValue {
  admin: AdminUser | null;
  isLoading: boolean;
  setAuthenticatedAdmin: (admin: AdminUser) => void;
  refetchAdmin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  admin: null,
  isLoading: true,
  setAuthenticatedAdmin: () => undefined,
  refetchAdmin: async () => undefined,
  logout: async () => undefined,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['admin', 'me'],
    queryFn: api.getMe,
    retry: false,
    staleTime: 60_000,
  });

  const setAuthenticatedAdmin = (admin: AdminUser) => {
    queryClient.setQueryData(['admin', 'me'], admin);
  };

  const refetchAdmin = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'me'] });
  };

  const logout = async () => {
    await api.logout();
    queryClient.setQueryData(['admin', 'me'], null);
    queryClient.removeQueries({ queryKey: ['admin'] });
  };

  return (
    <AuthContext.Provider
      value={{
        admin: meQuery.data || null,
        isLoading: meQuery.isLoading,
        setAuthenticatedAdmin,
        refetchAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F5EF] text-[#18352B]">
        <div className="text-sm font-medium">Verifying administrator session...</div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
