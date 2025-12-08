// FILE: src/services/seedTokens.ts
// NEW FILE - Initial token registry data

import { v4 as uuidv4 } from 'uuid';
import type { Token } from '../types/token.types';

// ============================================
// INITIAL TOKEN REGISTRY
// Seeded with common tokens across networks
// ============================================

export const INITIAL_TOKENS: Token[] = [
  // ========== BITCOIN NETWORK ==========
  {
    id: uuidv4(),
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin',
    decimals: 8,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    color: '#F7931A',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ========== ETHEREUM NETWORK ==========
  {
    id: uuidv4(),
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'Ethereum',
    decimals: 18,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    color: '#627EEA',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uuidv4(),
    symbol: 'USDT',
    name: 'Tether',
    network: 'Ethereum',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    category: 'stablecoin',
    isStablecoin: true,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    color: '#26A17B',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uuidv4(),
    symbol: 'USDC',
    name: 'USD Coin',
    network: 'Ethereum',
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    category: 'stablecoin',
    isStablecoin: true,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    color: '#2775CA',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uuidv4(),
    symbol: 'DAI',
    name: 'Dai',
    network: 'Ethereum',
    contractAddress: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    decimals: 18,
    category: 'stablecoin',
    isStablecoin: true,
    isPrimary: false,
    logoUrl: 'https://assets.coingecko.com/coins/images/9956/large/4943.png',
    color: '#F5AC37',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ========== POLYGON NETWORK ==========
  {
    id: uuidv4(),
    symbol: 'MATIC',
    name: 'Polygon',
    network: 'Polygon',
    decimals: 18,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
    color: '#8247E5',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uuidv4(),
    symbol: 'USDT',
    name: 'Tether',
    network: 'Polygon',
    contractAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    decimals: 6,
    category: 'stablecoin',
    isStablecoin: true,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
    color: '#26A17B',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ========== SOLANA NETWORK ==========
  {
    id: uuidv4(),
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana',
    decimals: 9,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
    color: '#14F195',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ========== BINANCE SMART CHAIN ==========
  {
    id: uuidv4(),
    symbol: 'BNB',
    name: 'Binance Coin',
    network: 'Binance Smart Chain',
    decimals: 18,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png',
    color: '#F3BA2F',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: uuidv4(),
    symbol: 'BUSD',
    name: 'Binance USD',
    network: 'Binance Smart Chain',
    contractAddress: '0xe9e7CEA3DedCA5984780Bafc599bD69ADd087D56',
    decimals: 18,
    category: 'stablecoin',
    isStablecoin: true,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/9576/large/BUSD.png',
    color: '#F3BA2F',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ========== AVALANCHE NETWORK ==========
  {
    id: uuidv4(),
    symbol: 'AVAX',
    name: 'Avalanche',
    network: 'Avalanche',
    decimals: 18,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png',
    color: '#E84142',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ========== ARBITRUM NETWORK ==========
  {
    id: uuidv4(),
    symbol: 'ARB',
    name: 'Arbitrum',
    network: 'Arbitrum',
    decimals: 18,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/16547/large/arb.jpg',
    color: '#28A0F0',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ========== OPTIMISM NETWORK ==========
  {
    id: uuidv4(),
    symbol: 'OP',
    name: 'Optimism',
    network: 'Optimism',
    decimals: 18,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png',
    color: '#FF0420',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ========== XRP LEDGER ==========
  {
    id: uuidv4(),
    symbol: 'XRP',
    name: 'XRP',
    network: 'XRP Ledger',
    decimals: 6,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png',
    color: '#23292F',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ========== CARDANO ==========
  {
    id: uuidv4(),
    symbol: 'ADA',
    name: 'Cardano',
    network: 'Cardano',
    decimals: 6,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
    color: '#0033AD',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ========== LITECOIN ==========
  {
    id: uuidv4(),
    symbol: 'LTC',
    name: 'Litecoin',
    network: 'Litecoin',
    decimals: 8,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: true,
    logoUrl: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png',
    color: '#345D9D',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },

  // ========== DOGECOIN ==========
  {
    id: uuidv4(),
    symbol: 'DOGE',
    name: 'Dogecoin',
    network: 'Dogecoin',
    decimals: 8,
    category: 'cryptocurrency',
    isStablecoin: false,
    isPrimary: false,
    logoUrl: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png',
    color: '#C1A633',
    isActive: true,
    isCustom: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

/**
 * Get all initial tokens
 */
export function getInitialTokens(): Token[] {
  return INITIAL_TOKENS;
}

/**
 * Get tokens for a specific network
 */
export function getTokensForNetwork(network: string): Token[] {
  return INITIAL_TOKENS.filter(token => token.network === network);
}

/**
 * Get all networks in the initial tokens
 */
export function getAllNetworks(): string[] {
  const networks = new Set(INITIAL_TOKENS.map(token => token.network));
  return Array.from(networks);
}
