// src/services/accountService.ts
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Account,
  AccountBalance,
  AccountConnection,
  AccountCredential,
  AccountType,
  AccountValidationResult,
  AccountSyncResult,
  CexPlatform,
  WalletType,
  ConnectionStatus,
  CredentialType,
} from '../types/account.types';
import { SupportedCurrency } from '../types/models';

// ============================================
// ACCOUNT SERVICE - Core Operations
// ============================================

const STORAGE_KEY = 'cryptomonkey_accounts';
const ACCOUNT_PREFIX = 'account_';

export class AccountService {
  /**
   * Create new account
   */
  static async createAccount(
    userId: string,
    accountData: Partial<Account>
  ): Promise<Account> {
    try {
      const accountId = `${ACCOUNT_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const newAccount: Account = {
        id: accountId,
        userId,
        accountType: accountData.accountType || 'wallet',
        accountName: accountData.accountName || 'New Account',
        description: accountData.description,
        platform: accountData.platform,
        platformAccountId: accountData.platformAccountId,
        connection: {
          status: 'pending',
          credentialType: accountData.connection?.credentialType || 'wallet_address',
          credentials: [],
        },
        networks: accountData.networks,
        primaryAddress: accountData.primaryAddress,
        baseCurrency: accountData.baseCurrency || 'USD',
        displayOrder: accountData.displayOrder || 0,
        isActive: true,
        isFavorite: false,
        autoSyncEnabled: accountData.autoSyncEnabled || false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save to AsyncStorage
      await this.saveAccount(newAccount);

      return newAccount;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  /**
   * Save account to local storage
   */
  static async saveAccount(account: Account): Promise<void> {
    try {
      const accounts = await this.getAllAccounts(account.userId);
      const existingIndex = accounts.findIndex(a => a.id === account.id);

      if (existingIndex >= 0) {
        accounts[existingIndex] = {
          ...account,
          updatedAt: Date.now(),
        };
      } else {
        accounts.push(account);
      }

      await AsyncStorage.setItem(
        `${STORAGE_KEY}_${account.userId}`,
        JSON.stringify(accounts)
      );
    } catch (error) {
      console.error('Error saving account:', error);
      throw error;
    }
  }

  /**
   * Get all accounts for user
   */
  static async getAllAccounts(userId: string): Promise<Account[]> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting accounts:', error);
      return [];
    }
  }

  /**
   * Get single account by ID
   */
  static async getAccountById(accountId: string, userId: string): Promise<Account | null> {
    try {
      const accounts = await this.getAllAccounts(userId);
      return accounts.find(a => a.id === accountId) || null;
    } catch (error) {
      console.error('Error getting account:', error);
      return null;
    }
  }

  /**
   * Update account
   */
  static async updateAccount(
    accountId: string,
    userId: string,
    updates: Partial<Account>
  ): Promise<Account> {
    try {
      const account = await this.getAccountById(accountId, userId);
      if (!account) {
        throw new Error('Account not found');
      }

      const updatedAccount: Account = {
        ...account,
        ...updates,
        id: account.id, // Never update ID
        userId: account.userId, // Never update userID
        createdAt: account.createdAt, // Never update creation time
        updatedAt: Date.now(),
      };

      await this.saveAccount(updatedAccount);
      return updatedAccount;
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  }

  /**
   * Delete account
   */
  static async deleteAccount(accountId: string, userId: string): Promise<void> {
    try {
      const accounts = await this.getAllAccounts(userId);
      const filtered = accounts.filter(a => a.id !== accountId);
      await AsyncStorage.setItem(
        `${STORAGE_KEY}_${userId}`,
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  /**
   * Get accounts by type
   */
  static async getAccountsByType(
    userId: string,
    accountType: AccountType
  ): Promise<Account[]> {
    try {
      const accounts = await this.getAllAccounts(userId);
      return accounts.filter(a => a.accountType === accountType);
    } catch (error) {
      console.error('Error filtering accounts:', error);
      return [];
    }
  }

  /**
   * Get accounts by platform (CEX)
   */
  static async getAccountsByPlatform(
    userId: string,
    platform: CexPlatform | WalletType
  ): Promise<Account[]> {
    try {
      const accounts = await this.getAllAccounts(userId);
      return accounts.filter(a => a.platform === platform);
    } catch (error) {
      console.error('Error filtering by platform:', error);
      return [];
    }
  }

  /**
   * Validate account credentials
   */
  static async validateAccountCredentials(
    account: Account
  ): Promise<AccountValidationResult> {
    try {
      // Validate required fields
      if (!account.accountName?.trim()) {
        return {
          valid: false,
          error: 'Account name is required',
        };
      }

      if (!account.primaryAddress && account.accountType === 'wallet') {
        return {
          valid: false,
          error: 'Wallet address is required for wallet accounts',
        };
      }

      if (account.accountType === 'cex' && !account.platform) {
        return {
          valid: false,
          error: 'Platform must be selected for CEX accounts',
        };
      }

      // Validate credentials exist
      if (account.connection.credentials.length === 0) {
        return {
          valid: false,
          error: 'No credentials configured',
          warnings: ['Account will not sync without credentials'],
        };
      }

      return {
        valid: true,
        data: account,
      };
    } catch (error) {
      return {
        valid: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  /**
   * Add credential to account
   */
  static async addCredential(
    accountId: string,
    userId: string,
    credentialType: CredentialType,
    credentialValue: string,
    permissions?: string[]
  ): Promise<AccountCredential> {
    try {
      // Encrypt credential before storage
      const encrypted = await this.encryptCredential(credentialValue);

      const credential: AccountCredential = {
        id: `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: credentialType,
        key: `${credentialType}_${Date.now()}`,
        encryptedValue: encrypted,
        permissions,
        createdAt: Date.now(),
      };

      const account = await this.getAccountById(accountId, userId);
      if (!account) {
        throw new Error('Account not found');
      }

      account.connection.credentials.push(credential);
      account.connection.status = 'connected';
      await this.saveAccount(account);

      return credential;
    } catch (error) {
      console.error('Error adding credential:', error);
      throw error;
    }
  }

  /**
   * Remove credential from account
   */
  static async removeCredential(
    accountId: string,
    userId: string,
    credentialId: string
  ): Promise<void> {
    try {
      const account = await this.getAccountById(accountId, userId);
      if (!account) {
        throw new Error('Account not found');
      }

      account.connection.credentials = account.connection.credentials.filter(
        c => c.id !== credentialId
      );

      // If no credentials left, mark as disconnected
      if (account.connection.credentials.length === 0) {
        account.connection.status = 'disconnected';
      }

      await this.saveAccount(account);
    } catch (error) {
      console.error('Error removing credential:', error);
      throw error;
    }
  }

  /**
   * Encrypt credential (simple Base64 - upgrade to proper encryption)
   */
  private static async encryptCredential(value: string): Promise<string> {
    try {
      // TODO: Implement proper AES encryption with device-specific key
      return Buffer.from(value).toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  /**
   * Decrypt credential (simple Base64 - upgrade to proper decryption)
   */
  static async decryptCredential(encrypted: string): Promise<string> {
    try {
      // TODO: Implement proper AES decryption with device-specific key
      return Buffer.from(encrypted, 'base64').toString('utf-8');
    } catch (error) {
      console.error('Decryption error:', error);
      throw error;
    }
  }

  /**
   * Update account balance cache
   */
  static async updateBalanceCache(
    accountId: string,
    userId: string,
    balance: AccountBalance
  ): Promise<void> {
    try {
      const account = await this.getAccountById(accountId, userId);
      if (!account) {
        throw new Error('Account not found');
      }

      account.cachedBalance = balance;
      account.lastBalanceUpdate = Date.now();
      await this.saveAccount(account);
    } catch (error) {
      console.error('Error updating balance cache:', error);
      throw error;
    }
  }

  /**
   * Update sync status
   */
  static async updateSyncStatus(
    accountId: string,
    userId: string,
    status: ConnectionStatus,
    error?: string
  ): Promise<void> {
    try {
      const account = await this.getAccountById(accountId, userId);
      if (!account) {
        throw new Error('Account not found');
      }

      account.connection.status = status;
      account.connection.lastTestedAt = Date.now();
      if (error) {
        account.connection.connectionError = error;
        account.syncError = error;
      }
      account.lastSyncedAt = Date.now();
      await this.saveAccount(account);
    } catch (error) {
      console.error('Error updating sync status:', error);
      throw error;
    }
  }

  /**
   * Reorder accounts
   */
  static async reorderAccounts(
    userId: string,
    accountIds: string[]
  ): Promise<void> {
    try {
      const accounts = await this.getAllAccounts(userId);

      accountIds.forEach((id, index) => {
        const account = accounts.find(a => a.id === id);
        if (account) {
          account.displayOrder = index;
        }
      });

      await AsyncStorage.setItem(
        `${STORAGE_KEY}_${userId}`,
        JSON.stringify(accounts)
      );
    } catch (error) {
      console.error('Error reordering accounts:', error);
      throw error;
    }
  }

  /**
   * Get portfolio total across all accounts
   */
  static async getPortfolioTotal(userId: string): Promise<{
    totalValue: number;
    currency: SupportedCurrency;
    accountCount: number;
  }> {
    try {
      const accounts = await this.getAllAccounts(userId);
      let total = 0;
      const currency = accounts[0]?.baseCurrency || 'USD';

      accounts.forEach(account => {
        if (account.cachedBalance) {
          total += account.cachedBalance.totalValue;
        }
      });

      return {
        totalValue: total,
        currency: currency as SupportedCurrency,
        accountCount: accounts.length,
      };
    } catch (error) {
      console.error('Error calculating portfolio total:', error);
      throw error;
    }
  }
}
