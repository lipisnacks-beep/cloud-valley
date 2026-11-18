import React, { createContext, useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { CustomerUser } from '../../shared/types/index.ts';

interface CustomerAuthContextValue {
  customer: CustomerUser | null;
  isLoading: boolean;
  setAuthenticatedCustomer: (customer: CustomerUser) => void;
  refetchCustomer: () => Promise<void>;
  logoutCustomer: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue>({
  customer: null,
  isLoading: true,
  setAuthenticatedCustomer: () => undefined,
  refetchCustomer: async () => undefined,
  logoutCustomer: async () => undefined,
});

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['customer', 'me'],
    queryFn: api.getCustomerMe,
    retry: false,
    staleTime: 60_000,
  });

  const setAuthenticatedCustomer = (customer: CustomerUser) => {
    queryClient.setQueryData(['customer', 'me'], customer);
  };

  const refetchCustomer = async () => {
    await queryClient.invalidateQueries({ queryKey: ['customer', 'me'] });
  };

  const logoutCustomer = async () => {
    await api.customerLogout();
    queryClient.setQueryData(['customer', 'me'], null);
    queryClient.removeQueries({ queryKey: ['customer'] });
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer: meQuery.data || null,
        isLoading: meQuery.isLoading,
        setAuthenticatedCustomer,
        refetchCustomer,
        logoutCustomer,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}

export function RequireCustomer({ children }: { children: React.ReactNode }) {
  const { customer, isLoading } = useCustomerAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#F8F5EF] text-[#18352B]">
        <div className="text-sm font-medium">Checking your guest account session...</div>
      </div>
    );
  }

  if (!customer) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return <Navigate to="/login" state={{ from: redirectTarget }} replace />;
  }

  return <>{children}</>;
}
