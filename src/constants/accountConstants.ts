// src/constants/accountConstants.ts
import { CexPlatform, WalletType } from '../types/account.types';

// ============================================
// CEX PLATFORMS
// ============================================

export const CEX_PLATFORMS: Record<CexPlatform, { name: string; logo?: string }> = {
  Binance: { name: 'Binance', logo: '📊' },
  Kraken: { name: 'Kraken', logo: '🐙' },
  Coinbase: { name: 'Coinbase', logo: '💙' },
  Bitfinex: { name: 'Bitfinex', logo: '🐚' },
  OKX: { name: 'OKX', logo: '🟡' },
  Bybit: { name: 'Bybit', logo: '⚡' },
  Kucoin: { name: 'Kucoin', logo: '🟡' },
  BitOasis: { name: 'BitOasis', logo: '💰' },
  Other: { name: 'Other Exchange', logo: '🏦' },
};

// ============================================
// WALLET TYPES
// ============================================

export const WALLET_TYPES: Record<WalletType, { name: string; logo?: string; isHardware: boolean }> = {
  MetaMask: { name: 'MetaMask', logo: '🦊', isHardware: false },
  TrustWallet: { name: 'Trust Wallet', logo: '🔒', isHardware: false },
  WalletConnect: { name: 'WalletConnect', logo: '🔗', isHardware: false },
  Ledger: { name: 'Ledger Nano', logo: '🔐', isHardware: true },
  Trezor: { name: 'Trezor', logo: '🛡️', isHardware: true },
  ColdCard: { name: 'ColdCard', logo: '❄️', isHardware: true },
  Custom: { name: 'Custom Wallet', logo: '📝', isHardware: false },
};

// ============================================
// ACCOUNT TYPE LABELS
// ============================================

export const ACCOUNT_TYPE_LABELS = {
  cex: 'Centralized Exchange',
  wallet: 'Crypto Wallet',
  hardware_wallet: 'Hardware Wallet',
  defi_protocol: 'DeFi Protocol',
};

// ============================================
// CONNECTION STATUS LABELS & COLORS
// ============================================

export const CONNECTION_STATUS_CONFIG = {
  connected: { label: 'Connected', color: '#10B981', icon: '✓' },
  disconnected: { label: 'Disconnected', color: '#6B7280', icon: '✕' },
  error: { label: 'Error', color: '#EF4444', icon: '⚠️' },
  pending: { label: 'Pending', color: '#F59E0B', icon: '⏳' },
};

// ============================================
// CREDENTIAL REQUIREMENTS
// ============================================

export const CREDENTIAL_REQUIREMENTS: Record<string, string[]> = {
  Binance: ['API Key', 'Secret Key'],
  Kraken: ['API Key', 'Private Key'],
  Coinbase: ['API Key', 'Passphrase'],
  MetaMask: ['Wallet Address'],
  TrustWallet: ['Wallet Address'],
  Ledger: ['Wallet Address'],
  Trezor: ['Wallet Address'],
};

// ============================================
// VALIDATION RULES
// ============================================

export const ACCOUNT_VALIDATION = {
  nameMinLength: 1,
  nameMaxLength: 50,
  addressMinLength: 26, // Ethereum address length
  addressMaxLength: 66,
};

// ============================================
// SYNC SETTINGS
// ============================================

export const SYNC_INTERVALS = {
  frequent: 5 * 60 * 1000, // 5 minutes
  normal: 15 * 60 * 1000, // 15 minutes
  infrequent: 60 * 60 * 1000, // 1 hour
};

export const DEFAULT_SYNC_INTERVAL = SYNC_INTERVALS.normal;
