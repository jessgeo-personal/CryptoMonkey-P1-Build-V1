// FILE: src/services/api/BitOasisService.ts
// NEW FILE - BitOasis Exchange API Integration

import { AccountService } from '../accountService';
import type { AccountBalance } from '../../types/account.types';
import { SupportedCurrency } from '../../types/models';

// ============================================
// BITOASIS SERVICE - Exchange API Integration
// Documentation: https://bitoasis.docs.apiary.io/
// ============================================

const BITOASIS_API_BASE = 'https://api.bitoasis.net/v1';
const CACHE_DURATION = 300000; // 5 minutes cache

interface BitOasisBalance {
  [currency: string]: string; // Balance as string (e.g., "15.5")
}

interface BitOasisApiResponse {
  balances: BitOasisBalance;
}

interface CachedBalances {
  balances: BitOasisBalance;
  timestamp: number;
}

class BitOasisService {
  private balanceCache: { [accountId: string]: CachedBalances } = {};
  private readonly supportedCurrencies = [
    'AED', 'BTC', 'ETH', 'USDT', 'USDC', 'BUSD', 'DAI', 'TUSD',
    'USDS', 'XRP', 'ADA', 'SOL', 'BNB', 'DOGE', 'XLM', 'LINK',
    'MATIC', 'ATOM', 'AVAX', 'DOT'
  ];

  /**
   * Test API connection and validate credentials
   */
  async validateCredentials(apiToken: string): Promise<{
    valid: boolean;
    error?: string;
  }> {
    try {
      if (!apiToken || apiToken.trim().length === 0) {
        return {
          valid: false,
          error: 'API token is required',
        };
      }

      // Try to fetch balances to validate token
      const response = await fetch(`${BITOASIS_API_BASE}/exchange/balances`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        return {
          valid: false,
          error: 'Invalid API token - authentication failed',
        };
      }

      if (response.status === 403) {
        return {
          valid: false,
          error: 'API token has insufficient permissions',
        };
      }

      if (!response.ok) {
        return {
          valid: false,
          error: `BitOasis API error: ${response.status}`,
        };
      }

      console.log('✅ BitOasis API credentials validated');
      return { valid: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error validating BitOasis credentials:', error);
      return {
        valid: false,
        error: `Connection failed: ${errorMessage}`,
      };
    }
  }

  /**
   * Fetch account balances from BitOasis
   */
  async fetchBalances(apiToken: string, accountId: string): Promise<{
    success: boolean;
    balance?: AccountBalance;
    error?: string;
  }> {
    try {
      if (!apiToken || apiToken.trim().length === 0) {
        return {
          success: false,
          error: 'API token is required',
        };
      }

      // Check cache first
      const cached = this.balanceCache[accountId];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`✅ Using cached BitOasis balances for ${accountId}`);
        return {
          success: true,
          balance: this.parseBalances(cached.balances),
        };
      }

      console.log('🔄 Fetching balances from BitOasis...');

      const response = await fetch(`${BITOASIS_API_BASE}/exchange/balances`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        return {
          success: false,
          error: 'Invalid API token - authentication failed',
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: 'API token lacks required permissions for balance endpoint',
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: `BitOasis API error: ${response.status}`,
        };
      }

      const data: BitOasisApiResponse = await response.json();

      // Validate response structure
      if (!data.balances || typeof data.balances !== 'object') {
        return {
          success: false,
          error: 'Invalid response format from BitOasis API',
        };
      }

      // Cache the balances
      this.balanceCache[accountId] = {
        balances: data.balances,
        timestamp: Date.now(),
      };

      console.log(`✅ Fetched ${Object.keys(data.balances).length} balances from BitOasis`);

      return {
        success: true,
        balance: this.parseBalances(data.balances),
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching BitOasis balances:', error);
      return {
        success: false,
        error: `Failed to fetch balances: ${errorMessage}`,
      };
    }
  }

  /**
   * Parse BitOasis balance response to AccountBalance type
   */
  private parseBalances(balances: BitOasisBalance): AccountBalance {
    // Calculate totals (in AED as base - can be converted to USD later)
    let totalValue = 0;
    let assetCount = 0;
    const breakdown: AccountBalance['breakdown'] = {};

    // Process each balance
    Object.entries(balances).forEach(([currency, quantity]) => {
      const qty = parseFloat(quantity);
      
      if (qty > 0 && this.supportedCurrencies.includes(currency.toUpperCase())) {
        assetCount++;
        
        // For now, use placeholder values - will be enhanced with price service
        // This calculates rough value based on currency type
        let estimatedValue = qty;
        
        if (currency.toUpperCase() === 'BTC') {
          estimatedValue = qty * 40000; // Rough BTC price
        } else if (currency.toUpperCase() === 'ETH') {
          estimatedValue = qty * 2500; // Rough ETH price
        } else if (['USDT', 'USDC', 'BUSD', 'DAI'].includes(currency.toUpperCase())) {
          estimatedValue = qty; // Stablecoins ~1:1
        }

        totalValue += estimatedValue;

        breakdown[currency] = {
          quantity: qty,
          value: estimatedValue,
          percentage: 0, // Will be calculated after totals
        };
      }
    });

    // Calculate percentages
    if (totalValue > 0) {
      Object.values(breakdown).forEach(item => {
        item.percentage = (item.value / totalValue) * 100;
      });
    }

    return {
      totalValue,
      currency: 'AED',
      assetCount,
      lastUpdated: Date.now(),
      breakdown,
    };
  }

  /**
   * Get supported currencies on BitOasis
   */
  getSupportedCurrencies(): string[] {
    return this.supportedCurrencies;
  }

  /**
   * Check if currency is supported
   */
  isCurrencySupported(currency: string): boolean {
    return this.supportedCurrencies.includes(currency.toUpperCase());
  }

  /**
   * Clear balance cache for account
   */
  clearAccountCache(accountId: string): void {
    delete this.balanceCache[accountId];
    console.log(`✅ Cleared BitOasis cache for ${accountId}`);
  }

  /**
   * Clear all balance caches
   */
  clearAllCaches(): void {
    this.balanceCache = {};
    console.log('✅ Cleared all BitOasis caches');
  }

  /**
   * Sync account with BitOasis (main entry point)
   */
  async syncAccount(
    accountId: string,
    userId: string,
    apiToken: string
  ): Promise<{
    success: boolean;
    message: string;
    balance?: AccountBalance;
  }> {
    try {
      // Step 1: Validate credentials
      const validation = await this.validateCredentials(apiToken);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error || 'Credential validation failed',
        };
      }

      // Step 2: Fetch balances
      const balanceResult = await this.fetchBalances(apiToken, accountId);
      if (!balanceResult.success) {
        return {
          success: false,
          message: balanceResult.error || 'Failed to fetch balances',
        };
      }

      // Step 3: Update account in database
      if (balanceResult.balance) {
        await AccountService.updateBalanceCache(
          accountId,
          userId,
          balanceResult.balance
        );

        await AccountService.updateSyncStatus(
          accountId,
          userId,
          'connected'
        );
      }

      return {
        success: true,
        message: '✅ Account synced successfully',
        balance: balanceResult.balance,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error syncing BitOasis account:', error);

      // Update error status
      try {
        await AccountService.updateSyncStatus(
          accountId,
          userId,
          'error',
          errorMessage
        );
      } catch (statusError) {
        console.error('Failed to update error status:', statusError);
      }

      return {
        success: false,
        message: `Sync failed: ${errorMessage}`,
      };
    }
  }
}

// Export singleton instance
export default new BitOasisService();
