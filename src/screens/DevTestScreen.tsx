import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import { getTransactionRepository } from '../services/database/repositories/TransactionRepository';
import { getHoldingRepository } from '../services/database/repositories/HoldingRepository';
import { seedTestData, clearAllData } from '../services/seedData';
import { AccountService } from '../services/accountService';

// ============================================
// DEVELOPER TEST SCREEN
// For testing database operations
// ============================================

export function DevTestScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    transactions: 0,
    holdings: 0,
  });

  /**
   * Refresh statistics
   */
  const refreshStats = async () => {
    try {
      const userRepo = getUserRepository();
      const transactionRepo = getTransactionRepository();
      const holdingRepo = getHoldingRepository();

      const user = await userRepo.getOrCreateDefaultUser();
      const txCount = await transactionRepo.countByUser(user.id);
      const holdingCount = await holdingRepo.countByUser(user.id);

      setStats({
        users: 1,
        transactions: txCount,
        holdings: holdingCount,
      });
    } catch (error) {
      console.error('Error refreshing stats:', error);
      Alert.alert('Error', 'Failed to refresh stats');
    }
  };

  /**
   * Seed test data
   */
  const handleSeedData = async () => {
    setLoading(true);
    try {
      await seedTestData();
      await refreshStats();
      Alert.alert('Success', 'Test data seeded successfully!');
    } catch (error) {
      console.error('Seed error:', error);
      Alert.alert('Error', 'Failed to seed data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear all data
   */
  const handleClearData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all transactions and holdings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const userRepo = getUserRepository();
              const user = await userRepo.getOrCreateDefaultUser();
              await clearAllData(user.id);
              await refreshStats();
              Alert.alert('Success', 'All data cleared!');
            } catch (error) {
              console.error('Clear error:', error);
              Alert.alert('Error', 'Failed to clear data');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Test CRUD operations
   */
  const handleTestCRUD = async () => {
    setLoading(true);
    try {
      const userRepo = getUserRepository();
      const transactionRepo = getTransactionRepository();
      const holdingRepo = getHoldingRepository();

      // Get user
      const user = await userRepo.getOrCreateDefaultUser();
      console.log('✅ User fetched:', user.id);

      // Test transaction operations
      const recentTxs = await transactionRepo.getRecent(user.id, 5);
      console.log('✅ Fetched recent transactions:', recentTxs.length);

      // Test holding operations
      const holdings = await holdingRepo.findByUserId(user.id);
      console.log('✅ Fetched holdings:', holdings.length);

      await refreshStats();
      Alert.alert(
        'CRUD Test Complete',
        `✅ All operations passed!\n\nCheck console for details.`
      );
    } catch (error) {
      console.error('CRUD test error:', error);
      Alert.alert('Error', 'CRUD test failed. Check console.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * View transactions
   */
  const handleViewTransactions = async () => {
    try {
      const userRepo = getUserRepository();
      const transactionRepo = getTransactionRepository();

      const user = await userRepo.getOrCreateDefaultUser();
      const transactions = await transactionRepo.getRecent(user.id, 10);

      if (transactions.length === 0) {
        Alert.alert('No Data', 'No transactions found. Seed data first.');
        return;
      }

      console.log('📊 Recent Transactions:');
      transactions.forEach((tx, idx) => {
        console.log(`${idx + 1}. ${tx.type} - ${tx.toAsset || tx.fromAsset} - $${tx.originalFiatValue}`);
      });

      Alert.alert(
        'Transactions',
        `Found ${transactions.length} transactions.\nCheck console for details.`
      );
    } catch (error) {
      console.error('View transactions error:', error);
      Alert.alert('Error', 'Failed to view transactions');
    }
  };

  /**
   * View holdings
   */
  const handleViewHoldings = async () => {
    try {
      const userRepo = getUserRepository();
      const holdingRepo = getHoldingRepository();

      const user = await userRepo.getOrCreateDefaultUser();
      const holdings = await holdingRepo.findByUserId(user.id);

      if (holdings.length === 0) {
        Alert.alert('No Data', 'No holdings found. Seed data first.');
        return;
      }

      console.log('💎 Holdings:');
      holdings.forEach((holding, idx) => {
        console.log(`${idx + 1}. ${holding.asset}: ${holding.quantity} @ ${holding.location}`);
      });

      Alert.alert(
        'Holdings',
        `Found ${holdings.length} holdings.\nCheck console for details.`
      );
    } catch (error) {
      console.error('View holdings error:', error);
      Alert.alert('Error', 'Failed to view holdings');
    }
  };
  
  /**
   * Test Account creation
   */
  const testCreateAccount = async () => {
    const account = await AccountService.createAccount('user123', {
      accountType: 'wallet',
      accountName: 'My Ethereum Wallet',
      primaryAddress: '0x1234567890123456789012345678901234567890',
      baseCurrency: 'USD',
    });
    console.log('✓ Account created:', account.id);
  };
  const testAddCredential = async () => {
    await AccountService.addCredential(
      accountId,
      'user123',
      'wallet_address',
      '0x1234567890123456789012345678901234567890'
    );
    console.log('✓ Credential added');
  };

  // Refresh stats on mount
  React.useEffect(() => {
    refreshStats();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.title, { color: colors.text }]}>
        🧪 Developer Test Screen
      </Text>

      {/* Stats */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>
          Database Statistics
        </Text>
        <View style={styles.statsRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Users:
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.users}
          </Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Transactions:
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.transactions}
          </Text>
        </View>
        <View style={styles.statsRow}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Holdings:
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.holdings}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.primary }]}
          onPress={refreshStats}
        >
          <Text style={styles.buttonText}>🔄 Refresh Stats</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleSeedData}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🌱 Seed Test Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.success },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleTestCRUD}
          disabled={loading}
        >
          <Text style={styles.buttonText}>✅ Test CRUD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.secondary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleViewTransactions}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📊 View Transactions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.secondary },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleViewHoldings}
          disabled={loading}
        >
          <Text style={styles.buttonText}>💎 View Holdings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.error },
            loading && styles.buttonDisabled,
          ]}
          onPress={handleClearData}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🗑️ Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Processing...
        </Text>
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
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  statsContainer: {
    padding: Spacing.lg,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  statsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.base,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    fontSize: Typography.fontSize.base,
  },
  statValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  refreshButton: {
    padding: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.base,
  },
  buttonGroup: {
    gap: Spacing.base,
  },
  button: {
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: Spacing.lg,
    fontSize: Typography.fontSize.base,
  },
});
