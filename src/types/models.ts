// ============================================
// CORE DATA MODELS - CryptoMonkey Phase 1
// ============================================

export type SupportedCurrency = 'USD' | 'GBP' | 'EUR' | 'INR' | 'AED' | 'SGD' | 'HKD' | 'CNY';

export type TransactionSource = 'CEX' | 'WALLET' | 'DEX' | 'DEFI';

export type TransactionType = 
  | 'buy' 
  | 'sell' 
  | 'swap' 
  | 'transfer' 
  | 'deposit' 
  | 'withdrawal' 
  | 'liquidity_add' 
  | 'liquidity_remove' 
  | 'stake' 
  | 'unstake';

export type TransactionCategory = 
  | 'fiat_to_crypto' 
  | 'crypto_to_fiat' 
  | 'crypto_to_crypto' 
  | 'transfer_in' 
  | 'transfer_out' 
  | 'defi_action';

export type LocationType = 'cex' | 'wallet' | 'dex' | 'staked' | 'lp_position';

export type LPPositionStatus = 'active' | 'closed';

export type NetworkType = 
  | 'Ethereum' 
  | 'Arbitrum' 
  | 'Optimism' 
  | 'Polygon' 
  | 'Base'
  | 'Solana' 
  | 'BNB_Chain';

// ============================================
// USER MODEL
// ============================================

export interface User {
  id: string;
  createdAt: number;
  baseCurrency: SupportedCurrency;
  timezone: string;
  settings: UserSettings;
}

export interface UserSettings {
  notifications: {
    lpOutOfRange: boolean;
    priceAlerts: boolean;
    transactionUpdates: boolean;
  };
  privacy: {
    analyticsEnabled: boolean;
    crashReportsEnabled: boolean;
  };
  display: {
    showZeroBalances: boolean;
    compactView: boolean;
  };
}

// ============================================
// TRANSACTION MODEL
// ============================================

export interface Transaction {
  id: string;
  userId: string;
  timestamp: number;
  
  // Source tracking
  source: TransactionSource;
  sourceId: string;
  
  // Classification
  type: TransactionType;
  category: TransactionCategory;
  
  // Asset flow
  fromAsset?: string;
  fromQuantity?: number;
  fromLocation?: string;
  toAsset?: string;
  toQuantity?: number;
  toLocation?: string;
  
  // Multi-currency tracking
  originalFiatCurrency: SupportedCurrency;
  originalFiatValue?: number;
  
  // Fees
  fees: Fee[];
  
  // Source data
  rawData?: string;
  parsingNotes?: string;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface Fee {
  type: 'trading' | 'network' | 'withdrawal' | 'deposit';
  amount: number;
  currency: string;
  fiatValue: number;
}

// ============================================
// HOLDINGS MODEL
// ============================================

export interface Holding {
  id: string;
  userId: string;
  
  // Asset identification
  asset: string;
  quantity: number;
  
  // Location
  location: LocationType;
  locationId: string;
  network?: NetworkType;
  
  // Cost basis (multi-currency)
  costBasisData: CostBasisData;
  
  // Metadata
  lastUpdated: number;
  createdAt: number;
}

export interface CostBasisData {
  [currency: string]: CurrencyCostBasis;
}

export interface CurrencyCostBasis {
  totalCostBasis: number;
  totalFees: number;
  totalQuantity: number;
  weightedAverageCost: number;
  acquisitionDate?: string;
  purchaseHistory: PurchaseRecord[];
  conversionRate?: number;
  lastConverted?: string;
}

export interface PurchaseRecord {
  date: string;
  quantity: number;
  pricePerUnit: number;
  fees: number;
  transactionId: string;
}

// ============================================
// REALIZED GAINS MODEL
// ============================================

export interface RealizedGain {
  transactionId: string;
  asset: string;
  quantitySold: number;
  costBasis: number;
  proceeds: number;
  gainLoss: number;
  percentage: number;
  currency: SupportedCurrency;
  timestamp: number;
}

// ============================================
// LIQUIDITY POOL MODELS
// ============================================

export interface LiquidityPoolPosition {
  id: string;
  userId: string;
  
  // Pool identification
  protocol: string;
  poolAddress: string;
  network: NetworkType;
  tokenPair: TokenPair;
  
  // Position details
  positionNFT?: string;
  liquidityAmount: number;
  priceRange: PriceRange;
  
  // Asset composition
  depositedAssets: DepositedAssets;
  currentAssets: CurrentAssets;
  
  // Earnings
  feesEarned: FeesEarned;
  
  // Cost basis
  costBasis: LPCostBasis;
  
  // Performance
  performanceMetrics: PerformanceMetrics;
  
  // Range history
  rangeHistory: RangeHistoryEvent[];
  
  // Status
  status: LPPositionStatus;
  
  // Metadata
  lastSynced: number;
  createdAt: number;
  updatedAt: number;
}

export interface TokenPair {
  token0: string;
  token1: string;
}

export interface PriceRange {
  lower: number;
  upper: number;
  currentPrice: number;
  inRange: boolean;
}

export interface DepositedAssets {
  token0Quantity: number;
  token1Quantity: number;
  token0Value: number;
  token1Value: number;
  totalValue: number;
}

export interface CurrentAssets {
  token0Quantity: number;
  token1Quantity: number;
  token0Value: number;
  token1Value: number;
  totalValue: number;
}

export interface FeesEarned {
  token0Fees: number;
  token1Fees: number;
  totalFeesUSD: number;
  lastCollected?: string;
}

export interface LPCostBasis {
  initialInvestment: number;
  currency: SupportedCurrency;
}

export interface PerformanceMetrics {
  currentValue: number;
  impermanentLoss: number;
  impermanentLossPercentage: number;
  feesEarnedTotal: number;
  netProfitLoss: number;
  netProfitLossPercentage: number;
  timeWeightedReturn: number;
  daysActive: number;
}

export interface RangeHistoryEvent {
  timestamp: number;
  event: 'in-range' | 'out-of-range';
  price: number;
}

// ============================================
// NFT HOLDINGS MODEL
// ============================================

export interface NFTHolding {
  id: string;
  userId: string;
  
  // NFT identification
  contractAddress: string;
  tokenId: string;
  network: NetworkType;
  
  // Metadata
  collectionName?: string;
  tokenName?: string;
  imageUrl?: string;
  
  // Valuation
  lastSalePrice?: number;
  lastSaleCurrency?: string;
  lastSaleDate?: number;
  
  // Location
  walletAddress: string;
  
  // Metadata
  acquiredAt?: number;
  lastUpdated: number;
  createdAt: number;
}

// ============================================
// EXCHANGE RATES MODEL
// ============================================

export interface ExchangeRate {
  id: string;
  fromCurrency: SupportedCurrency;
  toCurrency: SupportedCurrency;
  rate: number;
  date: number; // Unix timestamp (day precision)
  source: string;
  createdAt: number;
}

// ============================================
// PORTFOLIO VALUE TYPES
// ============================================

export interface PortfolioValue {
  totalValue: number;
  totalCostBasis: number;
  unrealizedGainLoss: number;
  unrealizedPercentage: number;
  currency: SupportedCurrency;
  breakdown?: PortfolioBreakdown;
}

export interface PortfolioBreakdown {
  byCEX: { [cexName: string]: number };
  byWallet: { [walletAddress: string]: number };
  byLPPosition: number;
  byNFT: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
  permissions?: {
    canRead: boolean;
    canTrade: boolean;
    canWithdraw: boolean;
  };
}

export interface ConvertedTransaction extends Transaction {
  convertedValue: number;
  convertedCurrency: SupportedCurrency;
}
