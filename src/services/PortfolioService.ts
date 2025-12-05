import { getUserRepository } from './database/repositories/UserRepository';
import { getTransactionRepository } from './database/repositories/TransactionRepository';
import { getHoldingRepository } from './database/repositories/HoldingRepository';
import { PortfolioValue, Holding, SupportedCurrency } from '../types/models';

// ============================================
// PORTFOLIO SERVICE
// Calculates portfolio values and metrics
// ============================================

export class PortfolioService {
  /**
   * Get total portfolio value
   */
  async getPortfolioValue(userId: string, currency: SupportedCurrency = 'USD'): Promise<PortfolioValue> {
    try {
      const holdingRepo = getHoldingRepository();
      const holdings = await holdingRepo.findByUserId(userId);

      // Mock prices for now (will be replaced with real API later)
      const mockPrices: { [key: string]: number } = {
        BTC: 95000,
        ETH: 3500,
        USDT: 1,
        USDC: 1,
        SOL: 180,
        MATIC: 0.85,
        BNB: 620,
        ADA: 0.45,
      };

      let totalValue = 0;
      let totalCostBasis = 0;

      holdings.forEach(holding => {
        const price = mockPrices[holding.asset] || 0;
        const value = holding.quantity * price;
        totalValue += value;

        // Get cost basis for user's currency
        const costBasis = holding.costBasisData[currency];
        if (costBasis) {
          totalCostBasis += costBasis.totalCostBasis;
        }
      });

      const unrealizedGainLoss = totalValue - totalCostBasis;
      const unrealizedPercentage = totalCostBasis > 0 
        ? (unrealizedGainLoss / totalCostBasis) * 100 
        : 0;

      return {
        totalValue,
        totalCostBasis,
        unrealizedGainLoss,
        unrealizedPercentage,
        currency,
      };
    } catch (error) {
      console.error('Error calculating portfolio value:', error);
      throw error;
    }
  }

  /**
   * Get asset breakdown with values
   */
  async getAssetBreakdown(userId: string): Promise<Array<{
    asset: string;
    quantity: number;
    value: number;
    percentage: number;
    costBasis: number;
    gainLoss: number;
    gainLossPercentage: number;
  }>> {
    try {
      const holdingRepo = getHoldingRepository();
      const holdings = await holdingRepo.findByUserId(userId);

      // Mock prices
      const mockPrices: { [key: string]: number } = {
        BTC: 95000,
        ETH: 3500,
        USDT: 1,
        USDC: 1,
        SOL: 180,
        MATIC: 0.85,
        BNB: 620,
        ADA: 0.45,
      };

      let totalValue = 0;

      // Calculate values
      const breakdown = holdings.map(holding => {
        const price = mockPrices[holding.asset] || 0;
        const value = holding.quantity * price;
        totalValue += value;

        const costBasisData = holding.costBasisData['USD'] || {
          totalCostBasis: 0,
          totalFees: 0,
          totalQuantity: 0,
          weightedAverageCost: 0,
          purchaseHistory: [],
        };

        const gainLoss = value - costBasisData.totalCostBasis;
        const gainLossPercentage = costBasisData.totalCostBasis > 0
          ? (gainLoss / costBasisData.totalCostBasis) * 100
          : 0;

        return {
          asset: holding.asset,
          quantity: holding.quantity,
          value,
          percentage: 0, // Will calculate after totals
          costBasis: costBasisData.totalCostBasis,
          gainLoss,
          gainLossPercentage,
        };
      });

      // Calculate percentages
      breakdown.forEach(item => {
        item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
      });

      // Sort by value descending
      breakdown.sort((a, b) => b.value - a.value);

      return breakdown;
    } catch (error) {
      console.error('Error getting asset breakdown:', error);
      throw error;
    }
  }

  /**
   * Get portfolio statistics
   */
  async getPortfolioStats(userId: string): Promise<{
    totalAssets: number;
    totalTransactions: number;
    topGainer: string | null;
    topLoser: string | null;
  }> {
    try {
      const holdingRepo = getHoldingRepository();
      const transactionRepo = getTransactionRepository();

      const holdings = await holdingRepo.findByUserId(userId);
      const txCount = await transactionRepo.countByUser(userId);

      const breakdown = await this.getAssetBreakdown(userId);

      let topGainer: string | null = null;
      let topLoser: string | null = null;
      let maxGain = -Infinity;
      let maxLoss = Infinity;

      breakdown.forEach(item => {
        if (item.gainLossPercentage > maxGain) {
          maxGain = item.gainLossPercentage;
          topGainer = item.asset;
        }
        if (item.gainLossPercentage < maxLoss) {
          maxLoss = item.gainLossPercentage;
          topLoser = item.asset;
        }
      });

      return {
        totalAssets: holdings.length,
        totalTransactions: txCount,
        topGainer: maxGain > 0 ? topGainer : null,
        topLoser: maxLoss < 0 ? topLoser : null,
      };
    } catch (error) {
      console.error('Error getting portfolio stats:', error);
      throw error;
    }
  }
}

export default new PortfolioService();
