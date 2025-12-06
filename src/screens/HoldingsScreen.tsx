import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import type { MainTabParamList } from '../types/navigation';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import { getHoldingRepository } from '../services/database/repositories/HoldingRepository';
import { Holding } from '../types/models';

// ============================================
// HOLDINGS SCREEN
// ============================================

type SortBy = 'value' | 'quantity' | 'gainLoss' | 'asset';

interface HoldingWithMetrics extends Holding {
  currentPrice: number;
  currentValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercentage: number;
}

export function HoldingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [holdings, setHoldings] = useState<HoldingWithMetrics[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('value');
  const [totalValue, setTotalValue] = useState(0);
  const [userCurrency, setUserCurrency] = useState<string>('USD');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);


  // Mock prices (will be replaced with real API later)
  const mockPrices: { [key: string]: number } = {
    BTC: 95000,
    ETH: 3500,
    USDT: 1,
    USDC: 1,
    SOL: 180,
    MATIC: 0.85,
    BNB: 620,
    ADA: 0.45,
    AVAX: 38,
    DOT: 7.2,
  };

  /**
   * Load holdings
   */
  const loadHoldings = async () => {
    try {
      const userRepo = getUserRepository();
      const holdingRepo = getHoldingRepository();

      const user = await userRepo.getOrCreateDefaultUser();
      setUserCurrency(user.baseCurrency);
      
      const rawHoldings = await holdingRepo.findByUserId(user.id);

      if (rawHoldings.length === 0) {
        setHoldings([]);
        setTotalValue(0);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Get unique assets
      const assets = [...new Set(rawHoldings.map(h => h.asset))];

      // Import PriceService
      const PriceService = (await import('../services/api/PriceService')).default;
      
      // Fetch live prices
      setIsLoadingPrices(true);
      const prices = await PriceService.getPrices(assets, user.baseCurrency);
      setIsLoadingPrices(false);
      setLastUpdated(Date.now());


      let totalVal = 0;

      // Calculate metrics for each holding
      const holdingsWithMetrics: HoldingWithMetrics[] = rawHoldings.map(holding => {
        const price = prices[holding.asset] || 0;
        const currentValue = holding.quantity * price;
        totalVal += currentValue;
        
        const costBasisData = holding.costBasisData[user.baseCurrency] || {
          totalCostBasis: 0,
          totalFees: 0,
          totalQuantity: 0,
          weightedAverageCost: 0,
          purchaseHistory: [],
        };

        const costBasis = costBasisData.totalCostBasis;
        const gainLoss = currentValue - costBasis;
        const gainLossPercentage = costBasis > 0
          ? (gainLoss / costBasis) * 100
          : 0;

        return {
          ...holding,
          currentPrice: price,
          currentValue,
          costBasis,
          gainLoss,
          gainLossPercentage,
        };
      });

      // Sort holdings
      const sorted = sortHoldings(holdingsWithMetrics, sortBy);
      setHoldings(sorted);
      setTotalValue(totalVal);

    } catch (error) {
      console.error('Error loading holdings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  /**
   * Sort holdings
   */
  const sortHoldings = (
    holdingsList: HoldingWithMetrics[],
    sortType: SortBy
  ): HoldingWithMetrics[] => {
    const sorted = [...holdingsList];

    switch (sortType) {
      case 'value':
        sorted.sort((a, b) => b.currentValue - a.currentValue);
        break;
      case 'quantity':
        sorted.sort((a, b) => b.quantity - a.quantity);
        break;
      case 'gainLoss':
        sorted.sort((a, b) => b.gainLossPercentage - a.gainLossPercentage);
        break;
      case 'asset':
        sorted.sort((a, b) => a.asset.localeCompare(b.asset));
        break;
    }

    return sorted;
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
    const sorted = sortHoldings(holdings, newSort);
    setHoldings(sorted);
  };

  /**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadHoldings();
  };

  /**
   * Format currency
   */
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };


  /**
   * Format percentage
   */
  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  /**
   * Format quantity
   */
  const formatQuantity = (value: number): string => {
    if (value >= 1000) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    if (value >= 1) {
      return value.toFixed(4);
    }
    return value.toFixed(8);
  };

  /**
   * Format time ago
   */
  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Load holdings on mount
  useEffect(() => {
    loadHoldings();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading holdings...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Total Value Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>
          Total Holdings Value
        </Text>
        <Text style={[styles.headerValue, { color: colors.text }]}>
          {formatCurrency(totalValue)}
        </Text>
        <View style={styles.headerFooter}>
          <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
            {holdings.length} {holdings.length === 1 ? 'Asset' : 'Assets'}
          </Text>
          <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
            {isLoadingPrices ? '🔄 Updating...' : `Updated ${formatTimeAgo(lastUpdated)}`}
          </Text>
        </View>
      </View>

      {/* Sort Controls */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sortContainer}
        contentContainerStyle={styles.sortContent}
      >
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'value' && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => handleSortChange('value')}
        >
          <Text
            style={[
              styles.sortButtonText,
              { color: sortBy === 'value' ? '#FFFFFF' : colors.text },
            ]}
          >
            💰 Value
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'gainLoss' && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => handleSortChange('gainLoss')}
        >
          <Text
            style={[
              styles.sortButtonText,
              { color: sortBy === 'gainLoss' ? '#FFFFFF' : colors.text },
            ]}
          >
            📈 Gain/Loss
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'quantity' && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => handleSortChange('quantity')}
        >
          <Text
            style={[
              styles.sortButtonText,
              { color: sortBy === 'quantity' ? '#FFFFFF' : colors.text },
            ]}
          >
            🔢 Quantity
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'asset' && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => handleSortChange('asset')}
        >
          <Text
            style={[
              styles.sortButtonText,
              { color: sortBy === 'asset' ? '#FFFFFF' : colors.text },
            ]}
          >
            🔤 Name
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Holdings List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {holdings.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>
              💎
            </Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Holdings Yet
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Add transactions to see your holdings here
            </Text>
          </View>
        ) : (
          holdings.map((holding, index) => (
            <TouchableOpacity
              key={holding.id}
              onPress={() =>
                navigation.navigate('HoldingDetail' as any, {
                  asset: holding.asset,
                  currentPrice: holding.currentPrice,
                })
              }
            >
              <View
                style={[
                  styles.holdingCard,
                  { backgroundColor: colors.surface },
                  index === 0 && styles.firstCard,
                ]}
              >
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.assetInfo}>
                  <Text style={[styles.assetSymbol, { color: colors.text }]}>
                    {holding.asset}
                  </Text>
                  <Text style={[styles.location, { color: colors.textSecondary }]}>
                    {holding.location} • {holding.locationId}
                  </Text>
                </View>
                <Text style={[styles.percentage, { color: colors.textSecondary }]}>
                  {((holding.currentValue / totalValue) * 100).toFixed(1)}%
                </Text>
              </View>

              {/* Quantity & Price */}
              <View style={styles.quantitySection}>
                <View style={styles.row}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Quantity:
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {formatQuantity(holding.quantity)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Price:
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {formatCurrency(holding.currentPrice)}
                  </Text>
                </View>
              </View>

              {/* Current Value */}
              <View style={styles.valueSection}>
                <Text style={[styles.currentValueLabel, { color: colors.textSecondary }]}>
                  Current Value
                </Text>
                <Text style={[styles.currentValue, { color: colors.text }]}>
                  {formatCurrency(holding.currentValue)}
                </Text>
              </View>

              {/* Gain/Loss */}
              <View style={styles.gainLossSection}>
                <View style={styles.row}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Cost Basis:
                  </Text>
                  <Text style={[styles.value, { color: colors.text }]}>
                    {formatCurrency(holding.costBasis)}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>
                    Gain/Loss:
                  </Text>
                  <View style={styles.gainLossValues}>
                    <Text
                      style={[
                        styles.gainLossAmount,
                        {
                          color: holding.gainLoss >= 0
                            ? colors.success
                            : colors.error,
                        },
                      ]}
                    >
                      {formatCurrency(holding.gainLoss)}
                    </Text>
                    <Text
                      style={[
                        styles.gainLossPercent,
                        {
                          color: holding.gainLoss >= 0
                            ? colors.success
                            : colors.error,
                        },
                      ]}
                    >
                      {formatPercentage(holding.gainLossPercentage)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>  
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
  },
  header: {
    padding: Spacing.xl,
    borderRadius: 12,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  headerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: Spacing.sm,
  },
  lastUpdated: {
    fontSize: Typography.fontSize.xs,
    fontStyle: 'italic',
  },

  headerLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  headerValue: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  headerCount: {
    fontSize: Typography.fontSize.sm,
  },
  sortContainer: {
    maxHeight: 50,
    paddingHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
  },
  sortContent: {
    gap: Spacing.sm,
  },
  sortButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.base,
  },
  holdingCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.base,
  },
  firstCard: {
    marginTop: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  location: {
    fontSize: Typography.fontSize.xs,
  },
  percentage: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  quantitySection: {
    marginBottom: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: Typography.fontSize.sm,
  },
  value: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  valueSection: {
    alignItems: 'center',
    marginVertical: Spacing.base,
  },
  currentValueLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  currentValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  gainLossSection: {
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  gainLossValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gainLossAmount: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  gainLossPercent: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  emptyDescription: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
  },

});
