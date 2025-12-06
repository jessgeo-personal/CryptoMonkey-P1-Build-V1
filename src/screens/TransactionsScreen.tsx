import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { MainTabScreenProps } from '../types/navigation';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import { getTransactionRepository } from '../services/database/repositories/TransactionRepository';
import { Transaction, TransactionType, TransactionSource } from '../types/models';

// ============================================
// TRANSACTIONS SCREEN
// ============================================

type FilterType = 'all' | TransactionType;
type FilterSource = 'all' | TransactionSource;

export function TransactionsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<MainTabScreenProps<'Transactions'>['navigation']>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userCurrency, setUserCurrency] = useState<string>('USD');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterSource, setFilterSource] = useState<FilterSource>('all');

  /**
   * Load transactions
   */
  const loadTransactions = async () => {
    try {
      const userRepo = getUserRepository();
      const transactionRepo = getTransactionRepository();

      const user = await userRepo.getOrCreateDefaultUser();
      setUserCurrency(user.baseCurrency);
      
      const txs = await transactionRepo.getRecent(user.id, 100);
      setTransactions(txs);
      setFilteredTransactions(txs);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Apply filters
   */
  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Filter by source
    if (filterSource !== 'all') {
      filtered = filtered.filter(tx => tx.source === filterSource);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => {
        const fromAsset = tx.fromAsset?.toLowerCase() || '';
        const toAsset = tx.toAsset?.toLowerCase() || '';
        const type = tx.type.toLowerCase();
        const source = tx.source.toLowerCase();
        
        return (
          fromAsset.includes(query) ||
          toAsset.includes(query) ||
          type.includes(query) ||
          source.includes(query)
        );
      });
    }

    setFilteredTransactions(filtered);
  };

  /**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
  };

  /**
   * Format date
   */
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  /**
   * Format time
   */
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Format currency
   */
  const formatCurrency = (value: number | undefined, currency?: string): string => {
    if (!value) return `${getCurrencySymbol(currency || userCurrency)}0.00`;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || userCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getCurrencySymbol = (currency: string): string => {
    const symbols: { [key: string]: string } = {
      USD: '$', EUR: '€', GBP: '£', AED: 'د.إ',
      SGD: 'S$', HKD: 'HK$', INR: '₹', CNY: '¥',
    };
    return symbols[currency] || '$';
  };


  /**
   * Get transaction icon
   */
  const getTransactionIcon = (type: TransactionType): string => {
    const icons: { [key in TransactionType]: string } = {
      buy: '💰',
      sell: '💸',
      swap: '🔄',
      transfer: '↔️',
      deposit: '⬇️',
      withdrawal: '⬆️',
      liquidity_add: '💧',
      liquidity_remove: '🌊',
      stake: '🔒',
      unstake: '🔓',
    };
    return icons[type] || '📝';
  };

  /**
   * Get type color
   */
  const getTypeColor = (type: TransactionType): string => {
    if (['buy', 'deposit', 'liquidity_add', 'stake'].includes(type)) {
      return colors.success;
    }
    if (['sell', 'withdrawal', 'liquidity_remove', 'unstake'].includes(type)) {
      return colors.error;
    }
    return colors.text;
  };

  // Load transactions on mount
  useEffect(() => {
    loadTransactions();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterType, filterSource, transactions]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading transactions...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Import Button */}
      <TouchableOpacity
        style={[styles.importButton, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate('Import')}
      >
        <Text style={styles.importButtonIcon}>📥</Text>
        <Text style={styles.importButtonText}>Import CSV</Text>
      </TouchableOpacity>
     
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search transactions..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === 'all' && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => setFilterType('all')}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: filterType === 'all' ? '#FFFFFF' : colors.text },
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === 'buy' && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => setFilterType('buy')}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: filterType === 'buy' ? '#FFFFFF' : colors.text },
            ]}
          >
            💰 Buy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === 'sell' && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => setFilterType('sell')}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: filterType === 'sell' ? '#FFFFFF' : colors.text },
            ]}
          >
            💸 Sell
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === 'swap' && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => setFilterType('swap')}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: filterType === 'swap' ? '#FFFFFF' : colors.text },
            ]}
          >
            🔄 Swap
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filterType === 'transfer' && { backgroundColor: colors.primary },
            { borderColor: colors.border },
          ]}
          onPress={() => setFilterType('transfer')}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: filterType === 'transfer' ? '#FFFFFF' : colors.text },
            ]}
          >
            ↔️ Transfer
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Transactions List */}
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
        {filteredTransactions.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>
              📝
            </Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Transactions Found
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {transactions.length === 0
                ? 'Add transactions to see them here'
                : 'Try adjusting your filters'}
            </Text>
          </View>
        ) : (
          filteredTransactions.map((tx, index) => (
            <View
              key={tx.id}
              style={[
                styles.transactionCard,
                { backgroundColor: colors.surface },
                index === 0 && styles.firstCard,
              ]}
            >
              {/* Header */}
              <View style={styles.txHeader}>
                <View style={styles.txHeaderLeft}>
                  <Text style={styles.txIcon}>
                    {getTransactionIcon(tx.type)}
                  </Text>
                  <View>
                    <Text
                      style={[
                        styles.txType,
                        { color: getTypeColor(tx.type) },
                      ]}
                    >
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1).replace('_', ' ')}
                    </Text>
                    <Text style={[styles.txSource, { color: colors.textSecondary }]}>
                      {tx.source}
                    </Text>
                  </View>
                </View>

                <View style={styles.txHeaderRight}>
                  <Text style={[styles.txDate, { color: colors.text }]}>
                    {formatDate(tx.timestamp)}
                  </Text>
                  <Text style={[styles.txTime, { color: colors.textSecondary }]}>
                    {formatTime(tx.timestamp)}
                  </Text>
                </View>
              </View>

              {/* Assets */}
              <View style={styles.txAssets}>
                {tx.fromAsset && (
                  <View style={styles.assetRow}>
                    <Text style={[styles.assetLabel, { color: colors.textSecondary }]}>
                      From:
                    </Text>
                    <Text style={[styles.assetValue, { color: colors.text }]}>
                      {tx.fromQuantity?.toFixed(4)} {tx.fromAsset}
                    </Text>
                  </View>
                )}

                {tx.toAsset && (
                  <View style={styles.assetRow}>
                    <Text style={[styles.assetLabel, { color: colors.textSecondary }]}>
                      To:
                    </Text>
                    <Text style={[styles.assetValue, { color: colors.text }]}>
                      {tx.toQuantity?.toFixed(4)} {tx.toAsset}
                    </Text>
                  </View>
                )}
              </View>

              {/* Value */}
              {tx.originalFiatValue && (
                <View style={styles.txFooter}>
                  <Text style={[styles.txValue, { color: colors.text }]}>
                    {formatCurrency(tx.originalFiatValue, tx.originalFiatCurrency)}
                  </Text>
                  {tx.fees.length > 0 && (
                    <Text style={[styles.txFee, { color: colors.textSecondary }]}>
                      Fee: {formatCurrency(tx.fees[0].fiatValue, tx.originalFiatCurrency)}
                    </Text>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Stats Footer */}
      {filteredTransactions.length > 0 && (
        <View style={[styles.statsFooter, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.base,
    margin: Spacing.base,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  importButtonIcon: {
    fontSize: 20,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    margin: Spacing.base,
    borderRadius: 12,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    padding: 0,
  },
  clearIcon: {
    fontSize: 18,
    padding: Spacing.sm,
    color: '#888',
  },
  filterContainer: {
    maxHeight: 50,
    paddingHorizontal: Spacing.base,
  },
  filterContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.base,
  },
  transactionCard: {
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.base,
  },
  firstCard: {
    marginTop: Spacing.sm,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  txHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  txIcon: {
    fontSize: 24,
  },
  txType: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  txSource: {
    fontSize: Typography.fontSize.xs,
  },
  txHeaderRight: {
    alignItems: 'flex-end',
  },
  txDate: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  txTime: {
    fontSize: Typography.fontSize.xs,
  },
  txAssets: {
    marginBottom: Spacing.base,
  },
  assetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  assetLabel: {
    fontSize: Typography.fontSize.sm,
  },
  assetValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  txValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  txFee: {
    fontSize: Typography.fontSize.xs,
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
  statsFooter: {
    padding: Spacing.base,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  statsText: {
    fontSize: Typography.fontSize.sm,
  },
});
