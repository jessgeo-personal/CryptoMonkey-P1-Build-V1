// FILE: src/screens/TestBitOasisScreen.tsx
// UPDATED - Use real accounts from database instead of test IDs

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Button, Card } from '../components/common';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import BitOasisService from '../services/api/BitOasisService';
import { AccountService } from '../services/accountService';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import type { Account } from '../types/account.types';

// ============================================
// TEST BITOASIS SERVICE SCREEN
// UPDATED: Uses real accounts from database
// ============================================

export function TestBitOasisScreen() {
  const { colors } = useTheme();

  // User and accounts
  const [userId, setUserId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // State for API token input
  const [apiToken, setApiToken] = useState('');

  // Test results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [showAccountsList, setShowAccountsList] = useState(false);

  // Initialize: Load user and accounts
  useEffect(() => {
    const init = async () => {
      try {
        const userRepo = getUserRepository();
        const user = await userRepo.getOrCreateDefaultUser();
        setUserId(user.id);

        // Load BitOasis accounts
        const allAccounts = await AccountService.getAllAccounts(user.id);
        const bitOasisAccounts = allAccounts.filter(
          acc => acc.platform === 'BitOasis'
        );
        setAccounts(bitOasisAccounts);

        if (bitOasisAccounts.length > 0) {
          setSelectedAccount(bitOasisAccounts[0]);
          addLog(`✅ Loaded ${bitOasisAccounts.length} BitOasis account(s)`);
        } else {
          addLog('⚠️ No BitOasis accounts found. Please create one first.');
        }
      } catch (error) {
        addLog(
          `❌ Error initializing: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    };

    init();
  }, []);

  // Helper: Add log entry
  const addLog = (message: string) => {
    setResults(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  const clearLogs = () => {
    setResults([]);
  };

  // TEST 1: Validate Credentials
    const testValidateCredentials = async () => {
    console.log('TEST 1 clicked - loading state before:', loading);
    
    setLoading(true);
    addLog('🧪 TEST 1: Validating credentials...');

    try {
        if (!apiToken.trim()) {
        addLog('❌ ERROR: API token is empty.');
        Alert.alert('Error', 'API token is empty');
        setLoading(false);
        return;
        }

        const validation = await BitOasisService.validateCredentials(apiToken);
        console.log('Validation result:', validation);

        if (validation.valid) {
        addLog('✅ SUCCESS: Credentials are valid!');
        Alert.alert('Success', 'Your BitOasis API token is valid!');
        } else {
        addLog(`❌ FAILED: ${validation.error}`);
        Alert.alert('Failed', validation.error || 'Validation failed');
        }

        addLog('---');
    } catch (error) {
        console.error('Validation error:', error);
        const msg = error instanceof Error ? error.message : 'Unknown error';
        addLog(`❌ ERROR: ${msg}`);
        Alert.alert('Error', msg);
    } finally {
        console.log('Setting loading to false');
        setLoading(false);
    }
    };


  // TEST 2: Fetch Balances
  const testFetchBalances = async () => {
    setLoading(true);
    addLog('🧪 TEST 2: Fetching balances...');

    try {
      if (!apiToken.trim()) {
        addLog('❌ ERROR: API token is empty.');
        setLoading(false);
        return;
      }

      if (!selectedAccount) {
        addLog('❌ ERROR: No account selected.');
        setLoading(false);
        return;
      }

      const result = await BitOasisService.fetchBalances(
        apiToken,
        selectedAccount.id
      );

      if (result.success && result.balance) {
        addLog(`✅ SUCCESS: Fetched balances`);
        addLog(`   Account: ${selectedAccount.accountName}`);
        addLog(`   Total Value: ${result.balance.totalValue}`);
        addLog(`   Currency: ${result.balance.currency}`);
        addLog(`   Asset Count: ${result.balance.assetCount}`);
        addLog(
          `   Last Updated: ${new Date(result.balance.lastUpdated).toLocaleString()}`
        );
        addLog(`   Breakdown: ${Object.keys(result.balance.breakdown).length} assets`);

        Object.entries(result.balance.breakdown)
          .slice(0, 5)
          .forEach(([asset, data]) => {
            addLog(
              `     - ${asset}: ${data.quantity} (Value: ${data.value.toFixed(2)}, ${data.percentage.toFixed(1)}%)`
            );
          });

        if (Object.keys(result.balance.breakdown).length > 5) {
          addLog(
            `     ... and ${Object.keys(result.balance.breakdown).length - 5} more`
          );
        }
      } else {
        addLog(`❌ FAILED: ${result.error}`);
      }

      addLog('---');
    } catch (error) {
      addLog(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // TEST 3: Full Sync
  const testFullSync = async () => {
    setLoading(true);
    addLog('🧪 TEST 3: Full Account Sync...');

    try {
      if (!apiToken.trim()) {
        addLog('❌ ERROR: API token is empty.');
        setLoading(false);
        return;
      }

      if (!selectedAccount) {
        addLog('❌ ERROR: No account selected.');
        setLoading(false);
        return;
      }

      if (!userId) {
        addLog('❌ ERROR: User ID not initialized.');
        setLoading(false);
        return;
      }

      addLog(
        `📝 Syncing account: ${selectedAccount.accountName} (ID: ${selectedAccount.id})`
      );

      const result = await BitOasisService.syncAccount(
        selectedAccount.id,
        userId,
        apiToken
      );

      if (result.success) {
        addLog(`✅ SUCCESS: ${result.message}`);
        if (result.balance) {
          addLog(`   Balance updated in database`);
          addLog(`   Total Value: ${result.balance.totalValue}`);
          addLog(`   Assets: ${result.balance.assetCount}`);
        }
      } else {
        addLog(`❌ FAILED: ${result.message}`);
      }

      addLog('---');
    } catch (error) {
      addLog(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // TEST 4: Check Supported Currencies
  const testSupportedCurrencies = () => {
    addLog('🧪 TEST 4: Supported Currencies');

    const supported = BitOasisService.getSupportedCurrencies();
    addLog(`Found ${supported.length} supported currencies:`);
    addLog(supported.join(', '));
    addLog('---');
  };

  // TEST 5: Check Specific Currency
  const testSpecificCurrency = () => {
    const testCurrencies = ['BTC', 'ETH', 'USDT', 'DOGE', 'UNKNOWN'];

    addLog('🧪 TEST 5: Currency Support Check');

    testCurrencies.forEach(currency => {
      const supported = BitOasisService.isCurrencySupported(currency);
      addLog(`${currency}: ${supported ? '✅ Supported' : '❌ Not supported'}`);
    });

    addLog('---');
  };

  // TEST 6: Clear Cache
  const testClearCache = () => {
    if (!selectedAccount) {
      addLog('❌ No account selected.');
      return;
    }

    addLog('🧪 TEST 6: Clearing cache...');

    BitOasisService.clearAccountCache(selectedAccount.id);
    addLog('✅ Account cache cleared');

    BitOasisService.clearAllCaches();
    addLog('✅ All caches cleared');
    addLog('---');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Account Selection */}
      <Card style={{ marginBottom: Spacing.lg }}>
        <Text style={[styles.title, { color: colors.text }]}>
          BitOasis Service Test
        </Text>

        {/* Selected Account */}
        {selectedAccount ? (
          <View
            style={{
              backgroundColor: colors.surface,
              padding: Spacing.md,
              borderRadius: 8,
              marginBottom: Spacing.md,
            }}
          >
            <Text style={[{ color: colors.textSecondary, fontSize: 12 }]}>
              Selected Account:
            </Text>
            <Text style={[{ color: colors.text, fontSize: 16, fontWeight: '600' }]}>
              {selectedAccount.accountName}
            </Text>
            <Text style={[{ color: colors.textSecondary, fontSize: 11 }]}>
              ID: {selectedAccount.id}
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              padding: Spacing.md,
              borderRadius: 8,
              marginBottom: Spacing.md,
            }}
          >
            <Text style={[{ color: colors.primary, fontWeight: '600' }]}>
              ⚠️ No BitOasis accounts found
            </Text>
            <Text style={[{ color: colors.textSecondary, fontSize: 12 }]}>
              Please create a BitOasis account first in the Accounts tab.
            </Text>
          </View>
        )}

        {/* Account Selection Button */}
        {accounts.length > 1 && (
          <Button
            title={`📋 Select Account (${accounts.length} available)`}
            onPress={() => setShowAccountsList(!showAccountsList)}
            variant="secondary"
            fullWidth
            style={{ marginBottom: Spacing.md }}
          />
        )}

        {/* Accounts List */}
        {showAccountsList && accounts.length > 0 && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: Spacing.md,
              marginBottom: Spacing.md,
            }}
          >
            {accounts.map(account => (
              <TouchableOpacity
                key={account.id}
                onPress={() => {
                  setSelectedAccount(account);
                  setShowAccountsList(false);
                  addLog(`✅ Selected account: ${account.accountName}`);
                }}
                style={{
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.md,
                  backgroundColor:
                    selectedAccount?.id === account.id
                      ? colors.primary
                      : 'transparent',
                  borderRadius: 6,
                  marginBottom: Spacing.xs,
                }}
              >
                <Text
                  style={{
                    color:
                      selectedAccount?.id === account.id
                        ? '#FFFFFF'
                        : colors.text,
                    fontWeight: '500',
                  }}
                >
                  {account.accountName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          API Token (from BitOasis Settings):
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: colors.surface,
            },
          ]}
          placeholder="Paste your BitOasis API token here"
          placeholderTextColor={colors.textSecondary}
          value={apiToken}
          onChangeText={setApiToken}
          secureTextEntry
          multiline
          numberOfLines={3}
        />
      </Card>

      {/* Test Buttons Section */}
      <Card style={{ marginBottom: Spacing.lg }}>
        <Text style={[styles.label, { color: colors.text, marginBottom: Spacing.md }]}>
          Tests to Run:
        </Text>

        <Button
          title="TEST 1: Validate Credentials"
          onPress={testValidateCredentials}
          disabled={loading || !apiToken}
          fullWidth
          style={{ marginBottom: Spacing.sm }}
        />

       <View>
        {!selectedAccount && (
            <Text style={{ color: colors.error, fontSize: 12, marginBottom: 4, textAlign: 'center' }}>
            ⚠️ Please select an account first
            </Text>
        )}
        
        <Button
            title="TEST 2: Fetch Balances"
            onPress={testFetchBalances}
            disabled={loading || !apiToken || !selectedAccount}
            variant="secondary"
            fullWidth
            style={{ marginBottom: Spacing.sm }}
        />
        </View>

        <View>
        {!selectedAccount && (
            <Text style={{ color: colors.error, fontSize: 12, marginBottom: 4, textAlign: 'center' }}>
            ⚠️ Please select an account first
            </Text>
        )}

        <Button
            title="TEST 3: Full Sync (Update DB)"
            onPress={testFullSync}
            disabled={loading || !apiToken || !selectedAccount}
            variant="secondary"
            fullWidth
            style={{ marginBottom: Spacing.sm }}
        />
        </View>

        <Button
          title="TEST 4: Supported Currencies"
          onPress={testSupportedCurrencies}
          disabled={loading}
          variant="ghost"
          fullWidth
          style={{ marginBottom: Spacing.sm }}
        />

        <Button
          title="TEST 5: Currency Check (BTC, ETH, etc)"
          onPress={testSpecificCurrency}
          disabled={loading}
          variant="ghost"
          fullWidth
          style={{ marginBottom: Spacing.sm }}
        />

        <Button
          title="TEST 6: Clear Cache"
          onPress={testClearCache}
          disabled={loading || !selectedAccount}
          variant="ghost"
          fullWidth
        />
      </Card>

      {/* Results Section */}
      <Card style={{ marginBottom: Spacing.lg, flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: Spacing.md,
          }}
        >
          <Text style={[styles.label, { color: colors.text }]}>
            Test Results ({results.length}):
          </Text>
          <TouchableOpacity onPress={clearLogs}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Clear</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        <ScrollView style={{ maxHeight: 300 }}>
          {results.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No results yet. Run a test above to see results.
            </Text>
          ) : (
            results.map((result, idx) => (
              <Text
                key={idx}
                style={[
                  styles.logText,
                  {
                    color: result.includes('✅')
                      ? '#22c55e'
                      : result.includes('❌')
                      ? '#ef4444'
                      : result.includes('🧪')
                      ? colors.primary
                      : colors.textSecondary,
                  },
                ]}
              >
                {result}
              </Text>
            ))
          )}
        </ScrollView>
      </Card>

      {/* Info Box */}
      <Card style={{ marginBottom: Spacing.lg }}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          ℹ️ How to Get Your API Token:
        </Text>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          1. Log in to BitOasis{'\n'}
          2. Go to Settings → API Tokens{'\n'}
          3. Create a new token{'\n'}
          4. Give it "Read" permissions{'\n'}
          5. Copy and paste the token above{'\n'}
          6. Run TEST 1 to validate{'\n'}
          7. Run TEST 3 to sync with database
        </Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: Typography.fontSize.sm,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  logText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'monospace',
    marginBottom: Spacing.xs,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  infoTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.md,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
});
