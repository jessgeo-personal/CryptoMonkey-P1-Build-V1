import { Holding, Transaction, SupportedCurrency } from '../types/models';
import {
  HoldingMetrics,
  CurrencyHoldingCostBasis,
  AcquisitionHistoryItem,
  RealizedGainAggregate,
  SaleRecord,
} from '../types/holding.types';
import { getTransactionRepository } from './database/repositories/TransactionRepository';

class HoldingAnalyticsService {
  private txnRepo = getTransactionRepository();

  /**
   * Calculate comprehensive holding metrics
   */
  async calculateHoldingMetrics(
    userId: string,
    asset: string,
    currentPrice: number,
    baseCurrency: SupportedCurrency
  ): Promise<HoldingMetrics> {
    // Get all transactions for this asset
    const transactions = await this.txnRepo.findByFilters({
      userId,
      asset,
      limit: 10000,
    });

    // Separate buys and sells
    const purchases = this.extractPurchases(transactions, asset);
    const sales = this.extractSales(transactions, asset);

    // Calculate cost basis by currency
    const costBasisByCurrency = this.calculateCostBasisByCurrency(purchases);

    // Calculate realized gains (aggregated by month)
    const realizedGains = this.calculateRealizedGainsAggregated(
      sales,
      costBasisByCurrency
    );

    // Calculate totals
    const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0) -
                         sales.reduce((sum, s) => s.quantity, 0);
    
    const currentValue = totalQuantity * currentPrice;
    
    // Convert cost basis to base currency
    const totalCostBasis = Object.values(costBasisByCurrency).reduce(
      (sum, cb) => sum + cb.totalCostBasis,
      0
    );

    const totalGainLoss = currentValue - totalCostBasis;
    const totalGainLossPercentage = totalCostBasis > 0
      ? (totalGainLoss / totalCostBasis) * 100
      : 0;

    return {
      asset,
      totalQuantity,
      currentPrice,
      currentValue,
      costBasisByLCurrency: costBasisByCurrency,
      realizedGains,
      totalCostBasis,
      totalGainLoss,
      totalGainLossPercentage,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get acquisition history for an asset
   */
  async getAcquisitionHistory(
    userId: string,
    asset: string,
    currentPrice: number
  ): Promise<AcquisitionHistoryItem[]> {
    const transactions = await this.txnRepo.findByFilters({
      userId,
      asset,
      limit: 10000,
    });

    const purchases = this.extractPurchases(transactions, asset);

    return purchases.map(p => ({
      transactionId: p.transactionId,
      date: p.date,
      quantity: p.quantity,
      pricePerUnit: p.pricePerUnit,
      fees: p.fees,
      currency: p.currency,
      totalCost: p.totalCost,
      currentValue: p.quantity * currentPrice,
      unrealizedGainLoss: (p.quantity * currentPrice) - p.totalCost,
      unrealizedGainLossPercentage: p.totalCost > 0
        ? (((p.quantity * currentPrice) - p.totalCost) / p.totalCost) * 100
        : 0,
      notes: p.notes,
    }));
  }

  /**
   * Extract purchase records from transactions
   */
  private extractPurchases(
    transactions: Transaction[],
    asset: string
  ): Array<{
    transactionId: string;
    date: string;
    quantity: number;
    pricePerUnit: number;
    fees: number;
    currency: string;
    totalCost: number;
    notes?: string;
  }> {
    return transactions
      .filter(tx => ['buy', 'swap', 'transfer_in', 'deposit'].includes(tx.type))
      .filter(tx => tx.toAsset === asset)
      .map(tx => {
        const pricePerUnit = tx.originalFiatValue && tx.toQuantity
          ? tx.originalFiatValue / tx.toQuantity
          : 0;

        const fee = tx.fees.reduce((sum, f) => sum + f.fiatValue, 0);
        const totalCost = (tx.originalFiatValue || 0) + fee;

        return {
          transactionId: tx.id,
          date: new Date(tx.timestamp).toLocaleDateString(),
          quantity: tx.toQuantity || 0,
          pricePerUnit,
          fees: fee,
          currency: tx.originalFiatCurrency,
          totalCost,
          notes: tx.parsingNotes || undefined,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Extract sale records from transactions
   */
  private extractSales(
    transactions: Transaction[],
    asset: string
  ): Array<{
    transactionId: string;
    date: string;
    quantity: number;
    pricePerUnit: number;
    totalProceeds: number;
    fees: number;
    currency: string;
  }> {
    return transactions
      .filter(tx => ['sell', 'swap', 'transfer_out', 'withdrawal'].includes(tx.type))
      .filter(tx => tx.fromAsset === asset)
      .map(tx => {
        const pricePerUnit = tx.originalFiatValue && tx.fromQuantity
          ? tx.originalFiatValue / tx.fromQuantity
          : 0;

        const fee = tx.fees.reduce((sum, f) => sum + f.fiatValue, 0);
        const totalProceeds = (tx.originalFiatValue || 0) - fee;

        return {
          transactionId: tx.id,
          date: new Date(tx.timestamp).toLocaleDateString(),
          quantity: tx.fromQuantity || 0,
          pricePerUnit,
          totalProceeds,
          fees: fee,
          currency: tx.originalFiatCurrency,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Calculate cost basis grouped by currency
   */
  private calculateCostBasisByCurrency(
    purchases: Array<{
      date: string;
      quantity: number;
      pricePerUnit: number;
      fees: number;
      currency: string;
      totalCost: number;
    }>
  ): { [currency: string]: CurrencyHoldingCostBasis } {
    const grouped: { [currency: string]: typeof purchases } = {};

    purchases.forEach(p => {
      if (!grouped[p.currency]) {
        grouped[p.currency] = [];
      }
      grouped[p.currency].push(p);
    });

    const result: { [currency: string]: CurrencyHoldingCostBasis } = {};

    Object.entries(grouped).forEach(([currency, records]) => {
      const totalQuantity = records.reduce((sum, r) => sum + r.quantity, 0);
      const totalCostBasis = records.reduce((sum, r) => sum + r.totalCost, 0);
      const totalFees = records.reduce((sum, r) => sum + r.fees, 0);
      const weightedAverageCost = totalQuantity > 0
        ? totalCostBasis / totalQuantity
        : 0;

      result[currency] = {
        currency: currency as SupportedCurrency,
        totalCostBasis,
        totalFees,
        totalQuantity,
        weightedAverageCost,
        purchaseCount: records.length,
        acquisitionDate: records[0]?.date || new Date().toLocaleDateString(),
      };
    });

    return result;
  }

  /**
   * Calculate realized gains aggregated by month
   * Uses weighted average cost method
   */
  private calculateRealizedGainsAggregated(
    sales: Array<{
      transactionId: string;
      date: string;
      quantity: number;
      pricePerUnit: number;
      totalProceeds: number;
      fees: number;
      currency: string;
    }>,
    costBasisByCurrency: { [currency: string]: CurrencyHoldingCostBasis }
  ): RealizedGainAggregate[] {
    if (sales.length === 0) return [];

    // Group sales by month
    const monthGroups: { [monthKey: string]: typeof sales } = {};

    sales.forEach(sale => {
      const date = new Date(sale.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      monthGroups[monthKey].push(sale);
    });

    // Calculate aggregated gains per month
    return Object.entries(monthGroups).map(([monthKey, salesInMonth]) => {
      let totalQuantitySold = 0;
      let totalCostBasis = 0;
      let totalProceeds = 0;
      let totalFees = 0;
      const currency = salesInMonth[0].currency;

      const costBasis = costBasisByCurrency[currency];
      const costPerUnit = costBasis?.weightedAverageCost || 0;

      salesInMonth.forEach(sale => {
        totalQuantitySold += sale.quantity;
        totalCostBasis += sale.quantity * costPerUnit;
        totalProceeds += sale.totalProceeds;
        totalFees += sale.fees;
      });

      const realizedGainLoss = totalProceeds - totalCostBasis;
      const realizedGainLossPercentage = totalCostBasis > 0
        ? (realizedGainLoss / totalCostBasis) * 100
        : 0;

      // Get date range for this month
      const firstDate = salesInMonth[0].date;
      const lastDate = salesInMonth[salesInMonth.length - 1].date;

      return {
        dateRange: { from: firstDate, to: lastDate },
        totalQuantitySold,
        totalCostBasis,
        totalProceeds,
        totalRealizedGainLoss: realizedGainLoss,
        totalRealizedGainLossPercentage: realizedGainLossPercentage,
        currency,
        saleCount: salesInMonth.length,
        sales: salesInMonth.map(s => ({
          ...s,
          costBasisUsed: s.quantity * costPerUnit,
          realizedGainLoss: (s.quantity * costPerUnit) - s.totalProceeds,
          realizedGainLossPercentage: costPerUnit > 0
            ? (((s.quantity * costPerUnit) - s.totalProceeds) / (s.quantity * costPerUnit)) * 100
            : 0,
        })),
      };
    });
  }
}

// Singleton
let instance: HoldingAnalyticsService | null = null;

export function getHoldingAnalyticsService(): HoldingAnalyticsService {
  if (!instance) {
    instance = new HoldingAnalyticsService();
  }
  return instance;
}

export default getHoldingAnalyticsService;
