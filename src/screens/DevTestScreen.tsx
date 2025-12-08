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
    setLoading(true);
    try {
      const userRepo = getUserRepository();
      const user = await userRepo.getOrCreateDefaultUser();

      const account = await AccountService.createAccount(user.id, {
        accountType: 'wallet',
        accountName: 'My Ethereum Wallet',
        primaryAddress: '0x1234567890123456789012345678901234567890',
        baseCurrency: 'USD',
      });
      
      console.log('✅ Account created:', account.id);
      Alert.alert('Success', `Account created: ${account.id}`);
    } catch (error) {
      console.error('Create account error:', error);
      Alert.alert('Error', 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test adding credential to account
   */
  const testAddCredential = async () => {
    setLoading(true);
    try {
      const userRepo = getUserRepository();
      const user = await userRepo.getOrCreateDefaultUser();

      // First create an account
      const account = await AccountService.createAccount(user.id, {
        accountType: 'wallet',
        accountName: 'Test Wallet',
        primaryAddress: '0x1234567890123456789012345678901234567890',
        baseCurrency: 'USD',
      });

      // Then add credential
      const credential = await AccountService.addCredential(
        account.id,
        user.id,
        'wallet_address',
        '0x1234567890123456789012345678901234567890'
      );

      console.log('✅ Credential added:', credential.id);
      Alert.alert('Success', `Credential added to account`);
    } catch (error) {
      console.error('Add credential error:', error);
      Alert.alert('Error', 'Failed to add credential');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test getting all accounts
   */
  const testGetAllAccounts = async () => {
    setLoading(true);
    try {
      const userRepo = getUserRepository();
      const user = await userRepo.getOrCreateDefaultUser();

      const accounts = await AccountService.getAllAccounts(user.id);
      
      console.log(`✅ Found ${accounts.length} accounts`);
      accounts.forEach((acc, idx) => {
        console.log(`${idx + 1}. ${acc.accountName} (${acc.accountType})`);
      });

      Alert.alert('Accounts', `Found ${accounts.length} accounts.\nCheck console for details.`);
    } catch (error) {
      console.error('Get accounts error:', error);
      Alert.alert('Error', 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test account validation
   */
  const testValidateAccount = async () => {
    setLoading(true);
    try {
      // Test valid account
      const validAccount = {
        accountName: 'Valid Account',
        accountType: 'wallet' as const,
        primaryAddress: '0x1234567890123456789012345678901234567890',
        connection: {
          status: 'connected' as const,
          credentialType: 'wallet_address' as const,
          credentials: [
            {
              id: 'cred_1',
              type: 'wallet_address' as const,
              key: 'addr_1',
              encryptedValue: 'encrypted',
              createdAt: Date.now(),
            },
          ],
        },
      };

      const result = await AccountService.validateAccountCredentials(validAccount as any);
      console.log('✅ Validation result:', result);

      Alert.alert(
        'Validation Test',
        `Valid: ${result.valid}\n${result.error || 'No errors'}`
      );
    } catch (error) {
      console.error('Validation test error:', error);
      Alert.alert('Error', 'Validation test failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Test account deletion
   */
  const testDeleteAccount = async () => {
    setLoading(true);
    try {
      const userRepo = getUserRepository();
      const user = await userRepo.getOrCreateDefaultUser();

      // Get all accounts
      const accountsBefore = await AccountService.getAllAccounts(user.id);
      
      if (accountsBefore.length === 0) {
        Alert.alert('No Data', 'Create an account first');
        setLoading(false);
        return;
      }

      // Delete first account
      const accountToDelete = accountsBefore[0];
      await AccountService.deleteAccount(accountToDelete.id, user.id);

      const accountsAfter = await AccountService.getAllAccounts(user.id);
      console.log(`✅ Account deleted. Remaining: ${accountsAfter.length}`);

      Alert.alert('Success', `Account deleted.\nRemaining accounts: ${accountsAfter.length}`);
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Error', 'Failed to delete account');
    } finally {
      setLoading(false);
    }
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

        {/* PHASE 3C-1: ACCOUNT TESTS */}
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={testCreateAccount}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🔐 Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={testAddCredential}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🔑 Add Credential</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={testGetAllAccounts}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📋 Get All Accounts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={testValidateAccount}
          disabled={loading}
        >
          <Text style={styles.buttonText}>✔️ Validate Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled,
          ]}
          onPress={testDeleteAccount}
          disabled={loading}
        >
          <Text style={styles.buttonText}>❌ Delete Account</Text>
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
