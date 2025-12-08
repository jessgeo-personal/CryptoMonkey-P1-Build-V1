// src/contexts/AccountContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Account, AccountBalance, CredentialType } from '../types/account.types';
import { AccountService } from '../services/accountService';

// ============================================
// ACCOUNT CONTEXT TYPES
// ============================================

interface AccountContextType {
  // State
  accounts: Account[];
  activeAccountId: string | null;
  loading: boolean;
  error: string | null;

  // Account operations
  createAccount: (accountData: Partial<Account>) => Promise<Account>;
  updateAccount: (accountId: string, updates: Partial<Account>) => Promise<Account>;
  deleteAccount: (accountId: string) => Promise<void>;
  getAccountById: (accountId: string) => Account | undefined;

  // Credential operations
  addCredential: (accountId: string, type: CredentialType, value: string) => Promise<void>;
  removeCredential: (accountId: string, credentialId: string) => Promise<void>;

  // Balance operations
  updateBalance: (accountId: string, balance: AccountBalance) => Promise<void>;

  // Sync operations
  refreshAccounts: () => Promise<void>;

  // Navigation
  setActiveAccount: (accountId: string | null) => void;
  getAccountsByType: (type: string) => Account[];
}

// ============================================
// CONTEXT & PROVIDER
// ============================================

const AccountContext = createContext<AccountContextType | undefined>(undefined);

interface AccountProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const AccountProvider: React.FC<AccountProviderProps> = ({ children, userId }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load accounts on mount
  useEffect(() => {
    refreshAccounts();
  }, [userId]);

  const refreshAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedAccounts = await AccountService.getAllAccounts(userId);
      setAccounts(loadedAccounts);

      // Set first account as active if none selected
      if (!activeAccountId && loadedAccounts.length > 0) {
        setActiveAccountId(loadedAccounts[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [userId, activeAccountId]);

  const createAccount = useCallback(
    async (accountData: Partial<Account>) => {
      try {
        setLoading(true);
        const newAccount = await AccountService.createAccount(userId, accountData);
        setAccounts(prev => [...prev, newAccount]);
        return newAccount;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create account';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const updateAccount = useCallback(
    async (accountId: string, updates: Partial<Account>) => {
      try {
        setLoading(true);
        const updated = await AccountService.updateAccount(accountId, userId, updates);
        setAccounts(prev => prev.map(a => (a.id === accountId ? updated : a)));
        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update account';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  const deleteAccount = useCallback(
    async (accountId: string) => {
      try {
        setLoading(true);
        await AccountService.deleteAccount(accountId, userId);
        setAccounts(prev => prev.filter(a => a.id !== accountId));

        // Clear active if deleted
        if (activeAccountId === accountId) {
          setActiveAccountId(null);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete account';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId, activeAccountId]
  );

  const getAccountById = useCallback(
    (accountId: string) => {
      return accounts.find(a => a.id === accountId);
    },
    [accounts]
  );

  const addCredential = useCallback(
    async (accountId: string, type: CredentialType, value: string) => {
      try {
        setLoading(true);
        await AccountService.addCredential(accountId, userId, type, value);
        await refreshAccounts();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to add credential';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId, refreshAccounts]
  );

  const removeCredential = useCallback(
    async (accountId: string, credentialId: string) => {
      try {
        setLoading(true);
        await AccountService.removeCredential(accountId, userId, credentialId);
        await refreshAccounts();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove credential';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId, refreshAccounts]
  );

  const updateBalance = useCallback(
    async (accountId: string, balance: AccountBalance) => {
      try {
        await AccountService.updateBalanceCache(accountId, userId, balance);
        await refreshAccounts();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update balance';
        setError(message);
        throw err;
      }
    },
    [userId, refreshAccounts]
  );

  const getAccountsByType = useCallback(
    (type: string) => {
      return accounts.filter(a => a.accountType === type);
    },
    [accounts]
  );

  const value: AccountContextType = {
    accounts,
    activeAccountId,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    getAccountById,
    addCredential,
    removeCredential,
    updateBalance,
    refreshAccounts,
    setActiveAccount: setActiveAccountId,
    getAccountsByType,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};

// ============================================
// CUSTOM HOOK
// ============================================

export const useAccounts = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within AccountProvider');
  }
  return context;
};
