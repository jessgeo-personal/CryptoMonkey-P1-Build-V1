import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import PortfolioService from '../services/PortfolioService';
import { PortfolioValue } from '../types/models';

// ============================================
// DASHBOARD SCREEN - PORTFOLIO OVERVIEW
// ============================================

export function DashboardScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState<PortfolioValue | null>(null);
  const [userCurrency, setUserCurrency] = useState<string>('USD');
  const [assetBreakdown, setAssetBreakdown] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalTransactions: 0,
    topGainer: null as string | null,
    topLoser: null as string | null,
  });

  /**
   * Load portfolio data
   */
  const loadData = async () => {
    try {
      const userRepo = getUserRepository();
      const user = await userRepo.getOrCreateDefaultUser();
    
      // Store user currency
      setUserCurrency(user.baseCurrency);

      // Load portfolio value with user's currency
      const value = await PortfolioService.getPortfolioValue(user.id, user.baseCurrency);
      setPortfolioValue(value);

      // Load asset breakdown with user's currency
      const breakdown = await PortfolioService.getAssetBreakdown(user.id, user.baseCurrency);
      setAssetBreakdown(breakdown.slice(0, 5)); // Top 5 assets


      // Load stats
      const portfolioStats = await PortfolioService.getPortfolioStats(user.id);
      setStats(portfolioStats);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading portfolio...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Portfolio Overview
        </Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>

      {/* Total Value Card */}
      <View style={[styles.valueCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.valueLabel, { color: colors.textSecondary }]}>
          Total Portfolio Value
        </Text>
        <Text style={[styles.valueAmount, { color: colors.text }]}>
          {portfolioValue ? formatCurrency(portfolioValue.totalValue) : '$0.00'}
        </Text>
        
        {portfolioValue && (
          <View style={styles.gainLossContainer}>
            <Text
              style={[
                styles.gainLossText,
                {
                  color: portfolioValue.unrealizedGainLoss >= 0 
                    ? colors.success 
                    : colors.error,
                },
              ]}
            >
              {formatCurrency(portfolioValue.unrealizedGainLoss)}
            </Text>
            <Text
              style={[
                styles.gainLossPercentage,
                {
                  color: portfolioValue.unrealizedGainLoss >= 0 
                    ? colors.success 
                    : colors.error,
                },
              ]}
            >
              {formatPercentage(portfolioValue.unrealizedPercentage)}
            </Text>
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.totalAssets}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Assets
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.totalTransactions}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Transactions
          </Text>
        </View>
      </View>

      {/* Top Performers */}
      {(stats.topGainer || stats.topLoser) && (
        <View style={[styles.performersCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Top Performers
          </Text>
          
          {stats.topGainer && (
            <View style={styles.performerRow}>
              <Text style={[styles.performerLabel, { color: colors.textSecondary }]}>
                Best Performer
              </Text>
              <Text style={[styles.performerValue, { color: colors.success }]}>
                {stats.topGainer} 📈
              </Text>
            </View>
          )}

          {stats.topLoser && (
            <View style={styles.performerRow}>
              <Text style={[styles.performerLabel, { color: colors.textSecondary }]}>
                Worst Performer
              </Text>
              <Text style={[styles.performerValue, { color: colors.error }]}>
                {stats.topLoser} 📉
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Asset Breakdown */}
      {assetBreakdown.length > 0 && (
        <View style={[styles.breakdownCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Top Holdings
          </Text>

          {assetBreakdown.map((item, index) => (
            <View key={item.asset} style={styles.assetRow}>
              <View style={styles.assetInfo}>
                <Text style={[styles.assetSymbol, { color: colors.text }]}>
                  {item.asset}
                </Text>
                <Text style={[styles.assetQuantity, { color: colors.textSecondary }]}>
                  {item.quantity.toFixed(4)}
                </Text>
              </View>

              <View style={styles.assetValues}>
                <Text style={[styles.assetValue, { color: colors.text }]}>
                  {formatCurrency(item.value)}
                </Text>
                <Text
                  style={[
                    styles.assetGainLoss,
                    { color: item.gainLoss >= 0 ? colors.success : colors.error },
                  ]}
                >
                  {formatPercentage(item.gainLossPercentage)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Empty State */}
      {assetBreakdown.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>
            💎
          </Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No Assets Yet
          </Text>
          <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
            Add transactions to see your portfolio here
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
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
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: Typography.fontSize.sm,
  },
  valueCard: {
    padding: Spacing.xl,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  valueAmount: {
    fontSize: 36,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  gainLossContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  gainLossText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  gainLossPercentage: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
  },
  performersCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.base,
  },
  performerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  performerLabel: {
    fontSize: Typography.fontSize.base,
  },
  performerValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  breakdownCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  assetQuantity: {
    fontSize: Typography.fontSize.sm,
  },
  assetValues: {
    alignItems: 'flex-end',
  },
  assetValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  assetGainLoss: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
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
