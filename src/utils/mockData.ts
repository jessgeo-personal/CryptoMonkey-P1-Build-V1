import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Transaction,
  Holding,
  SupportedCurrency,
  TransactionType,
  TransactionSource,
  Fee,
} from '../types/models';

// ============================================
// MOCK DATA GENERATORS FOR TESTING
// ============================================

/**
 * Generate mock user
 */
export function generateMockUser(overrides?: Partial<User>): User {
  return {
    id: uuidv4(),
    createdAt: Date.now(),
    baseCurrency: 'USD',
    timezone: 'UTC',
    settings: {
      notifications: {
        lpOutOfRange: true,
        priceAlerts: true,
        transactionUpdates: true,
      },
      privacy: {
        analyticsEnabled: false,
        crashReportsEnabled: false,
      },
      display: {
        showZeroBalances: false,
        compactView: false,
      },
    },
    ...overrides,
  };
}

/**
 * Generate mock transaction
 */
export function generateMockTransaction(
  userId: string,
  overrides?: Partial<Transaction>
): Transaction {
  const assets = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'MATIC'];
  const sources: TransactionSource[] = ['CEX', 'WALLET', 'DEX', 'DEFI'];
  const types: TransactionType[] = ['buy', 'sell', 'swap', 'transfer'];
  
  const fromAsset = assets[Math.floor(Math.random() * assets.length)];
  const toAsset = assets.filter(a => a !== fromAsset)[Math.floor(Math.random() * (assets.length - 1))];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const baseTx: Transaction = {
    id: uuidv4(),
    userId,
    timestamp: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random within last 30 days
    source: sources[Math.floor(Math.random() * sources.length)],
    sourceId: `source-${Math.random().toString(36).substring(7)}`,
    type,
    category: type === 'buy' ? 'fiat_to_crypto' : 'crypto_to_crypto',
    fromAsset: type === 'buy' ? undefined : fromAsset,
    fromQuantity: type === 'buy' ? undefined : Math.random() * 10,
    fromLocation: 'CEX-Binance',
    toAsset: type === 'sell' ? undefined : toAsset,
    toQuantity: type === 'sell' ? undefined : Math.random() * 10,
    toLocation: 'CEX-Binance',
    originalFiatCurrency: 'USD',
    originalFiatValue: Math.random() * 10000,
    fees: [
      {
        type: 'trading',
        amount: Math.random() * 10,
        currency: 'USDT',
        fiatValue: Math.random() * 10,
      },
    ],
    rawData: JSON.stringify({ mock: true }),
    parsingNotes: 'Mock transaction for testing',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return { ...baseTx, ...overrides };
}

/**
 * Generate mock holding
 */
export function generateMockHolding(
  userId: string,
  overrides?: Partial<Holding>
): Holding {
  const assets = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'MATIC'];
  const asset = assets[Math.floor(Math.random() * assets.length)];
  
  return {
    id: uuidv4(),
    userId,
    asset,
    quantity: Math.random() * 100,
    location: 'cex',
    locationId: 'CEX-Binance',
    network: 'Ethereum',
    costBasisData: {
      USD: {
        totalCostBasis: Math.random() * 10000,
        totalFees: Math.random() * 100,
        totalQuantity: Math.random() * 100,
        weightedAverageCost: Math.random() * 100,
        purchaseHistory: [],
      },
    },
    lastUpdated: Date.now(),
    createdAt: Date.now(),
    ...overrides,
  };
}

/**
 * Generate multiple mock transactions
 */
export function generateMockTransactions(userId: string, count: number): Transaction[] {
  return Array.from({ length: count }, () => generateMockTransaction(userId));
}

/**
 * Generate multiple mock holdings
 */
export function generateMockHoldings(userId: string, count: number): Holding[] {
  const assets = ['BTC', 'ETH', 'USDT', 'USDC', 'SOL', 'MATIC'];
  return assets.slice(0, count).map(asset => 
    generateMockHolding(userId, { asset })
  );
}

/**
 * Generate realistic buy transaction
 */
export function generateBuyTransaction(
  userId: string,
  asset: string,
  quantity: number,
  pricePerUnit: number,
  currency: SupportedCurrency = 'USD'
): Transaction {
  const totalValue = quantity * pricePerUnit;
  const fee = totalValue * 0.001; // 0.1% fee

  return {
    id: uuidv4(),
    userId,
    timestamp: Date.now(),
    source: 'CEX',
    sourceId: `buy-${Date.now()}`,
    type: 'buy',
    category: 'fiat_to_crypto',
    toAsset: asset,
    toQuantity: quantity,
    toLocation: 'CEX-Binance',
    originalFiatCurrency: currency,
    originalFiatValue: totalValue,
    fees: [
      {
        type: 'trading',
        amount: fee,
        currency,
        fiatValue: fee,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Generate realistic sell transaction
 */
export function generateSellTransaction(
  userId: string,
  asset: string,
  quantity: number,
  pricePerUnit: number,
  currency: SupportedCurrency = 'USD'
): Transaction {
  const totalValue = quantity * pricePerUnit;
  const fee = totalValue * 0.001; // 0.1% fee

  return {
    id: uuidv4(),
    userId,
    timestamp: Date.now(),
    source: 'CEX',
    sourceId: `sell-${Date.now()}`,
    type: 'sell',
    category: 'crypto_to_fiat',
    fromAsset: asset,
    fromQuantity: quantity,
    fromLocation: 'CEX-Binance',
    originalFiatCurrency: currency,
    originalFiatValue: totalValue,
    fees: [
      {
        type: 'trading',
        amount: fee,
        currency,
        fiatValue: fee,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
