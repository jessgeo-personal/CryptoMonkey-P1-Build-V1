// ============================================
// CURRENCY CONFIGURATIONS
// ============================================

import { SupportedCurrency } from '../types/models';

export interface CurrencyConfig {
  name: string;
  symbol: string;
  decimals: number;
  code: SupportedCurrency;
}

export const SUPPORTED_CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  USD: {
    name: 'US Dollar',
    symbol: '$',
    decimals: 2,
    code: 'USD',
  },
  GBP: {
    name: 'British Pound',
    symbol: '£',
    decimals: 2,
    code: 'GBP',
  },
  EUR: {
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    code: 'EUR',
  },
  INR: {
    name: 'Indian Rupee',
    symbol: '₹',
    decimals: 2,
    code: 'INR',
  },
  AED: {
    name: 'UAE Dirham',
    symbol: 'د.إ',
    decimals: 2,
    code: 'AED',
  },
  SGD: {
    name: 'Singapore Dollar',
    symbol: 'S$',
    decimals: 2,
    code: 'SGD',
  },
  HKD: {
    name: 'Hong Kong Dollar',
    symbol: 'HK$',
    decimals: 2,
    code: 'HKD',
  },
  CNY: {
    name: 'Chinese Yuan',
    symbol: '¥',
    decimals: 2,
    code: 'CNY',
  },
};

export const DEFAULT_CURRENCY: SupportedCurrency = 'USD';
