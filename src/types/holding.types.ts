import { SupportedCurrency } from './models';

export interface HoldingMetrics {
  asset: string;
  totalQuantity: number;
  currentPrice: number;
  currentValue: number;
  
  // Cost basis by currency
  costBasisByLCurrency: {
    [currency: string]: CurrencyHoldingCostBasis;
  };
  
  // Aggregated realized gains
  realizedGains: RealizedGainAggregate[];
  
  // Overall metrics
  totalCostBasis: number; // USD equivalent
  totalGainLoss: number;
  totalGainLossPercentage: number;
  
  lastUpdated: number;
}

export interface CurrencyHoldingCostBasis {
  currency: SupportedCurrency;
  totalCostBasis: number;
  totalFees: number;
  totalQuantity: number;
  weightedAverageCost: number;
  purchaseCount: number;
  acquisitionDate: string; // First purchase date
}

export interface PurchaseRecord {
  transactionId: string;
  date: string;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  fees: number;
  currency: string;
  notes?: string;
}

export interface SaleRecord {
  transactionId: string;
  date: string;
  quantity: number;
  pricePerUnit: number;
  totalProceeds: number;
  fees: number;
  currency: string;
  costBasisUsed: number;
  realizedGainLoss: number;
  realizedGainLossPercentage: number;
}

export interface RealizedGainAggregate {
  dateRange: {
    from: string;
    to: string;
  };
  totalQuantitySold: number;
  totalCostBasis: number;
  totalProceeds: number;
  totalRealizedGainLoss: number;
  totalRealizedGainLossPercentage: number;
  currency: string;
  saleCount: number;
  sales: SaleRecord[];
}

export interface AcquisitionHistoryItem {
  transactionId: string;
  date: string;
  quantity: number;
  pricePerUnit: number;
  fees: number;
  currency: string;
  totalCost: number;
  currentValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercentage: number;
  notes?: string;
}
