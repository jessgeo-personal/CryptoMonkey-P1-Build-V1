// FILE: src/screens/TestBitOasisScreen.tsx
// TEMPORARY TEST SCREEN - DELETE AFTER TESTING

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Button, Card } from '../components/common';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import BitOasisService from '../services/api/BitOasisService';

// ============================================
// TEST BITOASIS SERVICE SCREEN
// ============================================

export function TestBitOasisScreen() {
  const { colors } = useTheme();

  // State for API token input
  const [apiToken, setApiToken] = useState('');
  const [accountId, setAccountId] = useState('test-account-123');
  const [userId, setUserId] = useState('user-123');

  // Test results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Helper: Add log entry
  const addLog = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearLogs = () => {
    setResults([]);
  };

  // TEST 1: Validate Credentials
  const testValidateCredentials = async () => {
    setLoading(true);
    addLog('🧪 TEST 1: Validating credentials...');

    try {
      if (!apiToken.trim()) {
        addLog('❌ ERROR: API token is empty. Please enter your BitOasis API token.');
        setLoading(false);
        return;
      }

      const validation = await BitOasisService.validateCredentials(apiToken);

      if (validation.valid) {
        addLog('✅ SUCCESS: Credentials are valid!');
      } else {
        addLog(`❌ FAILED: ${validation.error}`);
      }

      addLog('---');
    } catch (error) {
      addLog(`❌ ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // TEST 2: Fetch Balances
  const testFetchBalances = async () => {
    setLoading(true);
    addLog('🧪 TEST 2: Fetching balances...');

    try {
      if (!apiToken.trim()) {
        addLog('❌ ERROR: API token is empty. Please enter your BitOasis API token.');
        setLoading(false);
        return;
      }

      const result = await BitOasisService.fetchBalances(apiToken, accountId);

      if (result.success && result.balance) {
        addLog(`✅ SUCCESS: Fetched balances`);
        addLog(`   Total Value: ${result.balance.totalValue}`);
        addLog(`   Currency: ${result.balance.currency}`);
        addLog(`   Asset Count: ${result.balance.assetCount}`);
        addLog(`   Last Updated: ${new Date(result.balance.lastUpdated).toLocaleString()}`);
        addLog(`   Breakdown: ${Object.keys(result.balance.breakdown).length} assets`);

        Object.entries(result.balance.breakdown).forEach(([asset, data]) => {
          addLog(`     - ${asset}: ${data.quantity} (Value: ${data.value.toFixed(2)}, ${data.percentage.toFixed(1)}%)`);
        });
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
        addLog('❌ ERROR: API token is empty. Please enter your BitOasis API token.');
        setLoading(false);
        return;
      }

      const result = await BitOasisService.syncAccount(accountId, userId, apiToken);

      if (result.success) {
        addLog(`✅ SUCCESS: ${result.message}`);
        if (result.balance) {
          addLog(`   Balance updated in database`);
          addLog(`   Total Value: ${result.balance.totalValue}`);
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
    addLog('🧪 TEST 6: Clearing cache...');

    BitOasisService.clearAccountCache(accountId);
    addLog('✅ Account cache cleared');

    BitOasisService.clearAllCaches();
    addLog('✅ All caches cleared');
    addLog('---');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Input Section */}
      <Card style={{ marginBottom: Spacing.lg }}>
        <Text style={[styles.title, { color: colors.text }]}>
          BitOasis Service Test
        </Text>

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

        <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>
          Account ID (for testing):
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
          placeholder="test-account-123"
          placeholderTextColor={colors.textSecondary}
          value={accountId}
          onChangeText={setAccountId}
        />

        <Text style={[styles.label, { color: colors.textSecondary, marginTop: Spacing.md }]}>
          User ID (for testing):
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
          placeholder="user-123"
          placeholderTextColor={colors.textSecondary}
          value={userId}
          onChangeText={setUserId}
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
          disabled={loading}
          fullWidth
          style={{ marginBottom: Spacing.sm }}
        />

        <Button
          title="TEST 2: Fetch Balances"
          onPress={testFetchBalances}
          disabled={loading}
          variant="secondary"
          fullWidth
          style={{ marginBottom: Spacing.sm }}
        />

        <Button
          title="TEST 3: Full Sync"
          onPress={testFullSync}
          disabled={loading}
          variant="secondary"
          fullWidth
          style={{ marginBottom: Spacing.sm }}
        />

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
          disabled={loading}
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
          6. Run TEST 1 to validate
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
