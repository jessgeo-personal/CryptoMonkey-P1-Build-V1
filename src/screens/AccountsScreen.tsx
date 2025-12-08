// src/screens/AccountsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import type { MainTabScreenProps } from '../types/navigation';
import { AccountCard } from '../components/common/AccountCard';
import { Spacing, BorderRadius, Shadow } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { AccountService } from '../services/accountService';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import type { Account } from '../types/account.types';

// ============================================
// ACCOUNTS SCREEN
// ============================================

type Props = MainTabScreenProps<'Accounts'>;

export function AccountsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Props['navigation']>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [userId, setUserId] = useState<string>('');

  // Load accounts
  const loadAccounts = async () => {
    try {
      const userRepo = getUserRepository();
      const user = await userRepo.getOrCreateDefaultUser();
      setUserId(user.id);

      const accountsList = await AccountService.getAllAccounts(user.id);
      // Sort by displayOrder, then by creation date
      const sorted = accountsList.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
          return a.displayOrder - b.displayOrder;
        }
        return b.createdAt - a.createdAt;
      });
      setAccounts(sorted);
    } catch (error) {
      console.error('Error loading accounts:', error);
      Alert.alert('Error', 'Failed to load accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Reload on focus (when returning from AddAccount)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadAccounts();
      }
    }, [userId])
  );

  // Initial load
  useEffect(() => {
    loadAccounts();
  }, []);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
  };

  // Navigate to account detail (future)
  const handleAccountPress = (account: Account) => {
    navigation.navigate('AccountDetail', { accountId: account.id });
  };

  // Navigate to Add Account
  const handleAddAccount = () => {
    navigation.navigate('AddAccount');
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading accounts...
          </Text>
        </View>
      </View>
    );
  }

  // Get portfolio summary
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + (acc.cachedBalance?.totalValue || 0),
    0
  );
  const connectedCount = accounts.filter(
    (acc) => acc.connection.status === 'connected'
  ).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Summary */}
      {accounts.length > 0 && (
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>
            Total Portfolio Value
          </Text>
          <Text style={[styles.headerValue, { color: colors.text }]}>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
            }).format(totalBalance)}
          </Text>
          <View style={styles.headerFooter}>
            <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
              {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}
            </Text>
            <Text style={[styles.headerCount, { color: colors.success }]}>
              {connectedCount} Connected
            </Text>
          </View>
        </View>
      )}

      {/* Accounts List */}
      <FlatList
        data={accounts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View
            style={{
              marginBottom:
                index === accounts.length - 1 ? Spacing['4xl'] : Spacing.base,
            }}
          >
            <AccountCard
              account={item}
              onPress={() => handleAccountPress(item)}
              showBalance
            />
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyIcon, { color: colors.textSecondary }]}>
              📱
            </Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Accounts Yet
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Add your first exchange or wallet account to start tracking your crypto
              portfolio
            </Text>
          </View>
        }
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[
          styles.fab,
          { backgroundColor: colors.primary, ...Shadow.lg },
        ]}
        onPress={handleAddAccount}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
  },
  header: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  headerLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  headerValue: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  headerFooter: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  headerCount: {
    fontSize: Typography.fontSize.sm,
  },
  listContent: {
    padding: Spacing.base,
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: Typography.fontWeight.bold,
  },
});
