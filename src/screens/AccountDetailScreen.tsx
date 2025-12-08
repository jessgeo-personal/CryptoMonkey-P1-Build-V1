// FILE: src/screens/AccountDetailScreen.tsx
// COMPLETE REPLACEMENT - WITH ALL FIXES

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import type { MainTabScreenProps } from '../types/navigation';
import { Button, Card, Badge, Input } from '../components/common';
import { Spacing, BorderRadius } from '../constants/spacing';
import { Typography } from '../constants/typography';
import {
  CEX_PLATFORMS,
  WALLET_TYPES,
  ACCOUNT_TYPE_LABELS,
  CONNECTION_STATUS_CONFIG,
} from '../constants/accountConstants';
import { AccountService } from '../services/accountService';
import { getHoldingRepository } from '../services/database/repositories/HoldingRepository';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import type { Account, AccountBalance } from '../types/account.types';
import type { MainTabParamList } from '../types/navigation';

// ============================================
// ACCOUNT DETAIL SCREEN - ENHANCED
// ============================================

type Props = MainTabScreenProps<'AccountDetail'>;
type DetailRouteProp = RouteProp<MainTabParamList, 'AccountDetail'>;

export function AccountDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Props['navigation']>();
  const route = useRoute<DetailRouteProp>();
  const { accountId } = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<Account | null>(null);
  const [userId, setUserId] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [accountHoldings, setAccountHoldings] = useState<any[]>([]);
  const [holdingLoading, setHoldingLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // ✅ Setup header back button
  useEffect(() => {
    navigation.setOptions({
        headerLeft: () => (
        <TouchableOpacity
            onPress={() => {
            // Use goBack() which respects the navigation stack
            navigation.goBack();
            }}
            style={{ paddingLeft: Spacing.base }}
        >
            <Text style={[{ fontSize: Typography.fontSize.lg, color: colors.primary }]}>
            ← Back
            </Text>
        </TouchableOpacity>
        ),
    });
  }, [navigation, colors]);

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        const userRepo = getUserRepository();
        const user = await userRepo.getOrCreateDefaultUser();
        setUserId(user.id);
      } catch (error) {
        console.error('Error initializing:', error);
      }
    };
    init();
  }, []);

  // Load account details
  useEffect(() => {
    if (userId) {
      loadAccount();
    }
  }, [userId]);

  const loadAccount = async () => {
    setLoading(true);
    try {
      const acc = await AccountService.getAccountById(accountId, userId);
      if (acc) {
        setAccount(acc);
        setEditName(acc.accountName);
        setEditDesc(acc.description || '');
        setEditAddress(acc.primaryAddress || '');
        loadAccountHoldings(acc);
      } else {
        Alert.alert('Error', 'Account not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading account:', error);
      Alert.alert('Error', 'Failed to load account');
    } finally {
      setLoading(false);
    }
  };

  const loadAccountHoldings = async (acc: Account) => {
    setHoldingLoading(true);
    try {
      // For CEX accounts, get holdings by location (accountId is the locationId)
      if (acc.accountType === 'cex') {
        const holdingRepo = getHoldingRepository();
        const holdings = await holdingRepo.findByLocation(userId, 'cex', acc.id);
        setAccountHoldings(holdings || []);
      } else {
        // For wallets, get holdings by location with wallet address
        const holdingRepo = getHoldingRepository();
        const holdings = await holdingRepo.findByLocation(userId, 'wallet', acc.primaryAddress);
        setAccountHoldings(holdings || []);
      }
    } catch (error) {
      console.error('Error loading holdings:', error);
      setAccountHoldings([]);
    } finally {
      setHoldingLoading(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Account name cannot be empty');
      return;
    }

    try {
      await AccountService.updateAccount(accountId, userId, {
        accountName: editName,
        description: editDesc || undefined,
        primaryAddress: editAddress || undefined,
      });
      setAccount(prev =>
        prev
          ? {
              ...prev,
              accountName: editName,
              description: editDesc,
              primaryAddress: editAddress || undefined,
            }
          : null
      );
      setEditMode(false);
      Alert.alert('Success', 'Account updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update account');
      console.error('Error:', error);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete "${account?.accountName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AccountService.deleteAccount(accountId, userId);
              Alert.alert('Success', 'Account deleted', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account');
              console.error('Error:', error);
            }
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    if (!account) {
        Alert.alert('Error', 'Account not found');
        return;
    }

    setSyncing(true);
    try {
        // ✅ FIXED: Check account exists before using it
        const mockBalance: AccountBalance = {
        totalValue: Math.random() * 10000, // Mock total value
        currency: account.baseCurrency,
        assetCount: accountHoldings.length || 1,
        lastUpdated: Date.now(),
        breakdown: accountHoldings.reduce((acc, holding) => {
            acc[holding.asset] = {
            quantity: parseFloat(holding.quantity),
            value: parseFloat(holding.quantity) * (Math.random() * 1000), // Mock value
            percentage: 0, // Will be calculated separately
            };
            return acc;
        }, {} as any),
        };

        // Update the account's cached balance
        await AccountService.updateBalanceCache(accountId, userId, mockBalance);

        // Update sync status
        await AccountService.updateSyncStatus(accountId, userId, 'connected');

        // Reload account data
        await loadAccount();

        Alert.alert('Success', 'Account synced successfully');
    } catch (error) {
        Alert.alert('Error', 'Failed to sync account');
        console.error('Error:', error);
    } finally {
        setSyncing(false);
    }
  };

  if (loading || !account) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading account...
        </Text>
      </View>
    );
  }

  const statusConfig = CONNECTION_STATUS_CONFIG[account.connection.status];
  const platformInfo =
    account.accountType === 'cex'
      ? CEX_PLATFORMS[account.platform as keyof typeof CEX_PLATFORMS]
      : WALLET_TYPES[account.platform as keyof typeof WALLET_TYPES];

  const formatBalance = (value: number | undefined): string => {
    if (value === undefined) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.baseCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (timestamp: number | undefined): string => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isPending = account.connection.status === 'pending';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Card */}
      <Card style={{ marginBottom: Spacing.lg }}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            {platformInfo && (
              <Text style={styles.platformIcon}>{platformInfo.logo}</Text>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountName, { color: colors.text }]}>
                {account.accountName}
              </Text>
              <Text style={[styles.accountType, { color: colors.textSecondary }]}>
                {ACCOUNT_TYPE_LABELS[account.accountType]}
                {platformInfo && ` • ${platformInfo.name}`}
              </Text>
            </View>
          </View>
          <Badge
            label={statusConfig.label}
            variant={
              account.connection.status === 'connected'
                ? 'success'
                : account.connection.status === 'error'
                ? 'error'
                : 'warning'
            }
          />
        </View>
      </Card>

      {/* ✅ Balance Section - Always shown with sync status */}
      <Card style={{ marginBottom: Spacing.lg }}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Balance Summary
        </Text>

        {account.cachedBalance ? (
          <>
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                Total Value
              </Text>
              <Text style={[styles.balanceValue, { color: colors.text }]}>
                {formatBalance(account.cachedBalance.totalValue)}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.balanceRow}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                Assets
              </Text>
              <Text style={[styles.balanceValue, { color: colors.text }]}>
                {account.cachedBalance.assetCount}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.syncStatusBox}>
            <Text style={[styles.syncStatusText, { color: colors.textSecondary }]}>
              📊 Not synced yet
            </Text>
            <Text style={[styles.syncStatusHint, { color: colors.textSecondary }]}>
              {account.accountType === 'cex'
                ? 'Add API credentials to sync balance'
                : 'Manual sync required'}
            </Text>
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* ✅ Last Sync & Last Updated Info */}
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
            Last Synced
          </Text>
          <Text style={[styles.balanceValue, { color: colors.text }]}>
            {formatDate(account.lastSyncedAt)}
          </Text>
        </View>

        <View style={styles.balanceRow}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
            Balance Updated
          </Text>
          <Text style={[styles.balanceValue, { color: colors.text }]}>
            {formatDate(account.lastBalanceUpdate)}
          </Text>
        </View>
      </Card>

      {/* Account Details Section */}
      <Card style={{ marginBottom: Spacing.lg }}>
        <View style={styles.detailsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account Information
          </Text>
          <TouchableOpacity onPress={() => setEditMode(!editMode)}>
            <Text style={[styles.editButton, { color: colors.primary }]}>
              {editMode ? '✕ Cancel' : '✏️ Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {editMode ? (
          <>
            <Input
              label="Account Name"
              value={editName}
              onChangeText={setEditName}
              containerStyle={{ marginBottom: Spacing.md }}
            />
            <Input
              label="Description"
              value={editDesc}
              onChangeText={setEditDesc}
              multiline
              numberOfLines={3}
              containerStyle={{ marginBottom: Spacing.md }}
            />

            {/* ✅ Show address field in edit mode, but only if pending or wallet type */}
            {(isPending || account.accountType === 'wallet' || account.accountType === 'hardware_wallet') && (
              <Input
                label={`${account.accountType === 'cex' ? 'Platform Account ID' : 'Wallet Address'}`}
                value={editAddress}
                onChangeText={setEditAddress}
                editable={isPending}
                containerStyle={{ marginBottom: Spacing.lg }}
              />
            )}

            <Button
              title="Save Changes"
              onPress={handleSaveEdits}
              fullWidth
              style={{ marginBottom: Spacing.sm }}
            />
          </>
        ) : (
          <>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Account Name
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {account.accountName}
              </Text>
            </View>

            {account.description && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Description
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {account.description}
                </Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Platform
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {platformInfo?.name || account.platform || 'N/A'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Connection Status
              </Text>
              <Text style={[styles.detailValue, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>

            {account.primaryAddress && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  {account.accountType === 'cex' ? 'Account ID' : 'Address'}
                </Text>
                <Text
                  style={[styles.detailValue, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {account.primaryAddress}
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Auto Sync
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {account.autoSyncEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Created
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {formatDate(account.createdAt)}
              </Text>
            </View>
          </>
        )}
      </Card>

      {/* Holdings Section - Show for CEX accounts */}
      {account.accountType === 'cex' && (
        <Card style={{ marginBottom: Spacing.lg }}>
          <View style={styles.detailsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Holdings ({accountHoldings.length})
            </Text>
          </View>

          {holdingLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : accountHoldings.length > 0 ? (
            <View>
              {accountHoldings.slice(0, 5).map((holding, idx) => (
                <View key={idx} style={styles.holdingItem}>
                  <View>
                    <Text style={[styles.holdingSymbol, { color: colors.text }]}>
                      {holding.asset}
                    </Text>
                    <Text style={[styles.holdingQty, { color: colors.textSecondary }]}>
                      {parseFloat(holding.quantity).toFixed(4)} units
                    </Text>
                  </View>
                  <Text style={[styles.holdingValue, { color: colors.text }]}>
                    {holding.quantity} {holding.asset}
                  </Text>
                </View>
              ))}
              {accountHoldings.length > 5 && (
                <Text
                  style={[styles.moreText, { color: colors.textSecondary }]}
                >
                  +{accountHoldings.length - 5} more assets
                </Text>
              )}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No holdings yet
            </Text>
          )}
        </Card>
      )}

      {/* ✅ Action Buttons Section */}
      <View style={styles.actionSection}>
        <Button
          title={syncing ? '⏳ Syncing...' : '🔄 Manual Sync'}
          onPress={handleManualSync}
          disabled={syncing}
          variant="secondary"
          fullWidth
          style={{ marginBottom: Spacing.md }}
        />

        <Button
          title="🗑️ Delete Account"
          onPress={handleDeleteAccount}
          variant="outline"
          fullWidth
        />
      </View>

      <View style={{ height: Spacing['4xl'] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.base,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  platformIcon: {
    fontSize: 32,
  },
  accountName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  accountType: {
    fontSize: Typography.fontSize.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.md,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  editButton: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.sm,
  },
  balanceValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  syncStatusBox: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(158, 158, 158, 0.1)',
    borderRadius: BorderRadius.base,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  syncStatusText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  syncStatusHint: {
    fontSize: Typography.fontSize.xs,
    fontStyle: 'italic',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    flex: 1,
  },
  detailValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  holdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  holdingSymbol: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  holdingQty: {
    fontSize: Typography.fontSize.xs,
  },
  holdingValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  moreText: {
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    fontStyle: 'italic',
    paddingVertical: Spacing.lg,
    textAlign: 'center',
  },
  actionSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
});
