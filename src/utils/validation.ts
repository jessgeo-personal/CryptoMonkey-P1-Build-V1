import { SupportedCurrency, TransactionType, TransactionSource, NetworkType } from '../types/models';

// ============================================
// DATA VALIDATION UTILITIES
// ============================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate crypto address format (basic check)
 */
export function isValidCryptoAddress(address: string, network?: NetworkType): boolean {
  if (!address || address.length < 26) {
    return false;
  }

  // Basic validation by network
  switch (network) {
    case 'Ethereum':
    case 'Arbitrum':
    case 'Optimism':
    case 'Polygon':
    case 'Base':
    case 'BNB_Chain':
      // Ethereum-compatible addresses (0x + 40 hex chars)
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    
    case 'Solana':
      // Solana addresses (32-44 base58 chars)
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    
    default:
      // Generic validation - at least 26 alphanumeric chars
      return /^[a-zA-Z0-9]{26,}$/.test(address);
  }
}

/**
 * Validate positive number
 */
export function isPositiveNumber(value: any): boolean {
  return typeof value === 'number' && value > 0 && !isNaN(value) && isFinite(value);
}

/**
 * Validate non-negative number
 */
export function isNonNegativeNumber(value: any): boolean {
  return typeof value === 'number' && value >= 0 && !isNaN(value) && isFinite(value);
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): currency is SupportedCurrency {
  const validCurrencies: SupportedCurrency[] = ['USD', 'GBP', 'EUR', 'INR', 'AED', 'SGD', 'HKD', 'CNY'];
  return validCurrencies.includes(currency as SupportedCurrency);
}

/**
 * Validate transaction type
 */
export function isValidTransactionType(type: string): type is TransactionType {
  const validTypes: TransactionType[] = [
    'buy', 'sell', 'swap', 'transfer', 'deposit', 'withdrawal',
    'liquidity_add', 'liquidity_remove', 'stake', 'unstake'
  ];
  return validTypes.includes(type as TransactionType);
}

/**
 * Validate transaction source
 */
export function isValidTransactionSource(source: string): source is TransactionSource {
  const validSources: TransactionSource[] = ['CEX', 'WALLET', 'DEX', 'DEFI'];
  return validSources.includes(source as TransactionSource);
}

/**
 * Validate timestamp (Unix timestamp in milliseconds)
 */
export function isValidTimestamp(timestamp: any): boolean {
  if (typeof timestamp !== 'number') {
    return false;
  }
  
  // Should be between year 2000 and year 2100
  const minTimestamp = 946684800000; // 2000-01-01
  const maxTimestamp = 4102444800000; // 2100-01-01
  
  return timestamp >= minTimestamp && timestamp <= maxTimestamp;
}

/**
 * Validate asset symbol (basic check)
 */
export function isValidAssetSymbol(symbol: string): boolean {
  if (!symbol || typeof symbol !== 'string') {
    return false;
  }
  
  // 2-10 uppercase alphanumeric characters
  return /^[A-Z0-9]{2,10}$/.test(symbol.toUpperCase());
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.trim().slice(0, maxLength);
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate object has required fields
 */
export function hasRequiredFields<T extends object>(
  obj: T,
  requiredFields: (keyof T)[]
): boolean {
  return requiredFields.every(field => {
    const value = obj[field];
    return value !== undefined && value !== null && value !== '';
  });
}

/**
 * Validate network type
 */
export function isValidNetwork(network: string): network is NetworkType {
  const validNetworks: NetworkType[] = [
    'Ethereum', 'Arbitrum', 'Optimism', 'Polygon', 'Base', 'Solana', 'BNB_Chain'
  ];
  return validNetworks.includes(network as NetworkType);
}
