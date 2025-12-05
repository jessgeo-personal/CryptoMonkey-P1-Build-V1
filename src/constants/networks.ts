// ============================================
// BLOCKCHAIN NETWORK CONFIGURATIONS
// ============================================

import { NetworkType } from '../types/models';

export interface NetworkConfig {
  name: string;
  chainId?: number;
  symbol: string;
  color: string;
  explorer: string;
}

export const SUPPORTED_NETWORKS: Record<NetworkType, NetworkConfig> = {
  Ethereum: {
    name: 'Ethereum',
    chainId: 1,
    symbol: 'ETH',
    color: '#627EEA',
    explorer: 'https://etherscan.io',
  },
  Arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    symbol: 'ETH',
    color: '#28A0F0',
    explorer: 'https://arbiscan.io',
  },
  Optimism: {
    name: 'Optimism',
    chainId: 10,
    symbol: 'ETH',
    color: '#FF0420',
    explorer: 'https://optimistic.etherscan.io',
  },
  Polygon: {
    name: 'Polygon',
    chainId: 137,
    symbol: 'MATIC',
    color: '#8247E5',
    explorer: 'https://polygonscan.com',
  },
  Base: {
    name: 'Base',
    chainId: 8453,
    symbol: 'ETH',
    color: '#0052FF',
    explorer: 'https://basescan.org',
  },
  Solana: {
    name: 'Solana',
    symbol: 'SOL',
    color: '#14F195',
    explorer: 'https://solscan.io',
  },
  BNB_Chain: {
    name: 'BNB Chain',
    chainId: 56,
    symbol: 'BNB',
    color: '#F3BA2F',
    explorer: 'https://bscscan.com',
  },
};
