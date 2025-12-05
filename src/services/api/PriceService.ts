import { SupportedCurrency } from '../../types/models';

// ============================================
// PRICE SERVICE - Real-time Crypto Prices
// Using CoinGecko Free API
// ============================================

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 60000; // 1 minute cache

interface PriceCache {
  prices: { [asset: string]: number };
  timestamp: number;
}

interface ExchangeRateCache {
  rates: { [currency: string]: number };
  timestamp: number;
}

class PriceService {
  private priceCache: { [currency: string]: PriceCache } = {};
  private exchangeRateCache: ExchangeRateCache | null = null;

  // Map of common crypto symbols to CoinGecko IDs
  private readonly COIN_ID_MAP: { [symbol: string]: string } = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    USDC: 'usd-coin',
    BNB: 'binancecoin',
    SOL: 'solana',
    MATIC: 'matic-network',
    ADA: 'cardano',
    AVAX: 'avalanche-2',
    DOT: 'polkadot',
    LINK: 'chainlink',
    UNI: 'uniswap',
    ATOM: 'cosmos',
    LTC: 'litecoin',
    XRP: 'ripple',
    DOGE: 'dogecoin',
    SHIB: 'shiba-inu',
    AAVE: 'aave',
    MKR: 'maker',
    SNX: 'synthetix-network-token',
  };

  /**
   * Get current price for a single asset
   */
  async getPrice(
    asset: string,
    currency: SupportedCurrency = 'USD'
  ): Promise<number> {
    try {
      const prices = await this.getPrices([asset], currency);
      return prices[asset] || 0;
    } catch (error) {
      console.error(`Error fetching price for ${asset}:`, error);
      return 0;
    }
  }

  /**
   * Get current prices for multiple assets
   */
  async getPrices(
    assets: string[],
    currency: SupportedCurrency = 'USD'
  ): Promise<{ [asset: string]: number }> {
    try {
      // Check cache first
      const cached = this.priceCache[currency];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        const cachedPrices: { [asset: string]: number } = {};
        let allCached = true;

        for (const asset of assets) {
          if (cached.prices[asset] !== undefined) {
            cachedPrices[asset] = cached.prices[asset];
          } else {
            allCached = false;
            break;
          }
        }

        if (allCached) {
          console.log(`✅ Using cached prices for ${assets.join(', ')}`);
          return cachedPrices;
        }
      }

      // Fetch from API
      const coinIds = assets
        .map(asset => this.COIN_ID_MAP[asset.toUpperCase()])
        .filter(id => id !== undefined);

      if (coinIds.length === 0) {
        console.warn('No valid coin IDs found for assets:', assets);
        return {};
      }

      const currencyLower = currency.toLowerCase();
      const url = `${COINGECKO_API_BASE}/simple/price?ids=${coinIds.join(',')}&vs_currencies=${currencyLower}`;

      console.log(`🔄 Fetching prices from CoinGecko...`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();

      // Map back to asset symbols
      const prices: { [asset: string]: number } = {};
      assets.forEach(asset => {
        const coinId = this.COIN_ID_MAP[asset.toUpperCase()];
        if (coinId && data[coinId] && data[coinId][currencyLower]) {
          prices[asset] = data[coinId][currencyLower];
        }
      });

      // Update cache
      this.priceCache[currency] = {
        prices: { ...this.priceCache[currency]?.prices, ...prices },
        timestamp: Date.now(),
      };

      console.log(`✅ Fetched ${Object.keys(prices).length} prices`);
      return prices;

    } catch (error) {
      console.error('Error fetching prices:', error);
      // Return empty object on error
      return {};
    }
  }

  /**
   * Get exchange rates for currency conversion
   * Using exchangerate-api.com (free tier: 1500 requests/month)
   */
  async getExchangeRates(baseCurrency: SupportedCurrency = 'USD'): Promise<{ [currency: string]: number }> {
    try {
      // Check cache
      if (this.exchangeRateCache && Date.now() - this.exchangeRateCache.timestamp < CACHE_DURATION) {
        console.log('✅ Using cached exchange rates');
        return this.exchangeRateCache.rates;
      }

      const url = `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;
      
      console.log('🔄 Fetching exchange rates...');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Exchange rate API error: ${response.status}`);
      }

      const data = await response.json();
      const rates = data.rates || {};

      // Cache the rates
      this.exchangeRateCache = {
        rates,
        timestamp: Date.now(),
      };

      console.log(`✅ Fetched exchange rates for ${Object.keys(rates).length} currencies`);
      return rates;

    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return 1:1 rates on error
      return {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        AED: 3.67,
        SGD: 1.34,
        HKD: 7.78,
        INR: 83.12,
        CNY: 7.24,
      };
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: SupportedCurrency,
    toCurrency: SupportedCurrency
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    try {
      const rates = await this.getExchangeRates(fromCurrency);
      const rate = rates[toCurrency] || 1;
      return amount * rate;
    } catch (error) {
      console.error('Currency conversion error:', error);
      return amount;
    }
  }

  /**
   * Clear price cache (force refresh)
   */
  clearCache(): void {
    this.priceCache = {};
    this.exchangeRateCache = null;
    console.log('✅ Price cache cleared');
  }

  /**
   * Get supported assets
   */
  getSupportedAssets(): string[] {
    return Object.keys(this.COIN_ID_MAP);
  }

  /**
   * Check if asset is supported
   */
  isAssetSupported(asset: string): boolean {
    return this.COIN_ID_MAP[asset.toUpperCase()] !== undefined;
  }
}

export default new PriceService();
