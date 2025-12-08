// src/types/account.types.ts
import { LocationType, NetworkType, SupportedCurrency } from './models';

// ============================================
// ACCOUNT TYPE DEFINITIONS
// ============================================

export type AccountType = 'cex' | 'wallet' | 'hardware_wallet' | 'defi_protocol';
export type CexPlatform = 
  | 'Binance' 
  | 'Kraken' 
  | 'Coinbase' 
  | 'Kraken' 
  | 'Bitfinex'
  | 'OKX'
  | 'Bybit'
  | 'Kucoin'
  | 'BitOasis'
  | 'Other';

export type WalletType = 
  | 'MetaMask'
  | 'TrustWallet'
  | 'WalletConnect'
  | 'Ledger'
  | 'Trezor'
  | 'ColdCard'
  | 'Custom';

export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';
export type CredentialType = 'api_key' | 'wallet_address' | 'private_key' | 'public_key';

// ============================================
// ACCOUNT MODEL
// ============================================

export interface Account {
  id: string;
  userId: string;
  
  // Account identification
  accountType: AccountType;
  accountName: string;
  description?: string;
  
  // Platform-specific
  platform?: CexPlatform | WalletType;
  platformAccountId?: string;
  
  // Connection details
  connection: AccountConnection;
  
  // Network info (for wallets)
  networks?: NetworkType[];
  
  // Primary address/identifier
  primaryAddress?: string;
  
  // Currency preference for this account
  baseCurrency: SupportedCurrency;
  
  // Balance cache
  cachedBalance?: AccountBalance;
  lastBalanceUpdate?: number;
  
  // Metadata
  displayOrder: number;
  isActive: boolean;
  isFavorite: boolean;
  color?: string;
  icon?: string;
  
  // Sync settings
  autoSyncEnabled: boolean;
  lastSyncedAt?: number;
  syncError?: string;
  
  // Timestamps
  createdAt: number;
  updatedAt: number;
}

export interface AccountConnection {
  status: ConnectionStatus;
  credentialType: CredentialType;
  credentials: AccountCredential[];
  testStatus?: boolean;
  lastTestedAt?: number;
  connectionError?: string;
}

export interface AccountCredential {
  id: string;
  type: CredentialType;
  key: string;
  encryptedValue: string; // Base64 encrypted with device key
  permissions?: string[];
  expiresAt?: number;
  createdAt: number;
}

export interface AccountBalance {
  totalValue: number;
  currency: SupportedCurrency;
  assetCount: number;
  lastUpdated: number;
  breakdown: {
    [assetSymbol: string]: {
      quantity: number;
      value: number;
      percentage: number;
    };
  };
}

// ============================================
// ACCOUNT CONNECTION TYPES
// ============================================

export interface WalletConnectionData {
  address: string;
  network: NetworkType;
  walletType: WalletType;
  publicKey?: string;
  isMultisig?: boolean;
  connectedAt: number;
}

export interface CexConnectionData {
  platform: CexPlatform;
  apiKeyLabel: string;
  subAccount?: string;
  permissions: {
    canRead: boolean;
    canTrade: boolean;
    canWithdraw: boolean;
  };
  connectedAt: number;
}

// ============================================
// ACCOUNT AGGREGATION
// ============================================

export interface AccountGroup {
  id: string;
  userId: string;
  groupName: string;
  accountIds: string[];
  groupType: 'manual' | 'platform' | 'type';
  totalValue: number;
  currency: SupportedCurrency;
  createdAt: number;
}

export interface PortfolioSnapshot {
  timestamp: number;
  totalValue: number;
  currency: SupportedCurrency;
  accountBreakdown: {
    [accountId: string]: number;
  };
  assetBreakdown: {
    [asset: string]: number;
  };
}

// ============================================
// ACCOUNT SERVICE RESPONSE TYPES
// ============================================

export interface AccountValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  data?: Account;
}

export interface AccountSyncResult {
  success: boolean;
  accountId: string;
  balanceUpdated: boolean;
  error?: string;
  timestamp: number;
}

export interface AccountExportData {
  accounts: Account[];
  exportDate: number;
  encryptionKey?: string;
}
