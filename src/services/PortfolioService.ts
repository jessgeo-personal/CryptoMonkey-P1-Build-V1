import { getUserRepository } from './database/repositories/UserRepository';
import { getTransactionRepository } from './database/repositories/TransactionRepository';
import { getHoldingRepository } from './database/repositories/HoldingRepository';
import { PortfolioValue, Holding, SupportedCurrency } from '../types/models';
import PriceService from './api/PriceService';

// ============================================
// PORTFOLIO SERVICE
// Calculates portfolio values and metrics with live prices
// ============================================

export class PortfolioService {
  /**
   * Get total portfolio value
   */
  async getPortfolioValue(userId: string, currency: SupportedCurrency = 'USD'): Promise<PortfolioValue> {
    try {
      const holdingRepo = getHoldingRepository();
      const holdings = await holdingRepo.findByUserId(userId);

      if (holdings.length === 0) {
        return {
          totalValue: 0,
          totalCostBasis: 0,
          unrealizedGainLoss: 0,
          unrealizedPercentage: 0,
          currency,
        };
      }

      // Get unique assets
      const assets = [...new Set(holdings.map(h => h.asset))];

      // Fetch live prices
      const prices = await PriceService.getPrices(assets, currency);

      let totalValue = 0;
      let totalCostBasis = 0;

      holdings.forEach(holding => {
        const price = prices[holding.asset] || 0;
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
  async getAssetBreakdown(userId: string, currency: SupportedCurrency = 'USD'): Promise<Array<{
    asset: string;
    quantity: number;
    value: number;
    percentage: number;
    costBasis: number;
    gainLoss: number;
    gainLossPercentage: number;
    currentPrice: number;
  }>> {
    try {
      const holdingRepo = getHoldingRepository();
      const holdings = await holdingRepo.findByUserId(userId);

      if (holdings.length === 0) {
        return [];
      }

      // Get unique assets
      const assets = [...new Set(holdings.map(h => h.asset))];

      // Fetch live prices
      const prices = await PriceService.getPrices(assets, currency);

      let totalValue = 0;

      // Calculate values
      const breakdown = holdings.map(holding => {
        const price = prices[holding.asset] || 0;
        const value = holding.quantity * price;
        totalValue += value;

        const costBasisData = holding.costBasisData[currency] || {
          totalCostBasis: 0,
          totalFees: 0,
          totalQuantity: 0,
          weightedAverageCost: 0,
          purchaseHistory: [],
        };

        const costBasis = costBasisData.totalCostBasis;
        const gainLoss = value - costBasis;
        const gainLossPercentage = costBasis > 0
          ? (gainLoss / costBasis) * 100
          : 0;

        return {
          asset: holding.asset,
          quantity: holding.quantity,
          value,
          percentage: 0, // Will calculate after totals
          costBasis,
          gainLoss,
          gainLossPercentage,
          currentPrice: price,
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

      const userRepo = getUserRepository();
      const user = await userRepo.getOrCreateDefaultUser();
      const breakdown = await this.getAssetBreakdown(userId, user.baseCurrency);

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
