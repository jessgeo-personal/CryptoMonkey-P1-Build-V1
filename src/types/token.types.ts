// FILE: src/types/token.types.ts
// NEW FILE - Token Registry Types

export type TokenNetwork = 
  | 'Bitcoin'
  | 'Ethereum'
  | 'Polygon'
  | 'Solana'
  | 'Binance Smart Chain'
  | 'Avalanche'
  | 'Arbitrum'
  | 'Optimism'
  | 'Base'
  | 'Fantom'
  | 'Cosmos'
  | 'Polkadot'
  | 'XRP Ledger'
  | 'Cardano'
  | 'Litecoin'
  | 'Dogecoin'
  | string; // Allow custom networks

export type TokenCategory = 
  | 'cryptocurrency'
  | 'stablecoin'
  | 'nft'
  | 'defi'
  | 'utility'
  | 'custom';

export interface Token {
  // Unique identifiers
  id: string; // UUID
  symbol: string; // BTC, ETH, USDT
  name: string; // Bitcoin, Ethereum, Tether
  
  // Network information (for hybrid A+B)
  network: TokenNetwork; // Bitcoin, Ethereum, Polygon, etc.
  
  // Contract details
  contractAddress?: string; // For non-native tokens (e.g., 0x... for ERC20)
  decimals: number; // 8, 18, 6 for USDT
  
  // Metadata
  category: TokenCategory;
  isStablecoin: boolean;
  isPrimary: boolean; // Show first in list
  
  // Visual
  logoUrl?: string; // Icon URL
  color?: string; // Brand color hex
  
  // Status
  isActive: boolean; // Enabled globally
  isCustom: boolean; // User-created token
  
  // Tracking
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}

// Account-specific token selection
export interface AccountToken {
  id: string; // UUID
  accountId: string; // Reference to account
  tokenId: string; // Reference to token
  isEnabled: boolean; // Track this token for this account?
  
  // Account-specific metadata
  customLabel?: string; // User can rename
  priority: number; // Sort order
  
  createdAt: number;
  updatedAt: number;
}

// Token response from API
export interface TokenResponse {
  token: Token;
  balance?: number; // Optional: balance if fetched from API
  lastUpdated?: number;
}

// Batch operation
export interface TokenBatch {
  tokens: Token[];
  count: number;
  totalCount: number;
}
