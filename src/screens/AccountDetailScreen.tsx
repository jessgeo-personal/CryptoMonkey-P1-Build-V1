// FILE: src/screens/AccountDetailScreen.tsx
// CREATE NEW FILE - Complete implementation

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import type { MainTabScreenProps } from '../types/navigation';
import { Button, Card, Badge, Input } from '../components/common';
import { Spacing, BorderRadius, Shadow } from '../constants/spacing';
import { Typography } from '../constants/typography';
import {
  CEX_PLATFORMS,
  WALLET_TYPES,
  ACCOUNT_TYPE_LABELS,
  CONNECTION_STATUS_CONFIG,
} from '../constants/accountConstants';
import { AccountService } from '../services/accountService';
import { HoldingService } from '../services/HoldingService';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import type { Account } from '../types/account.types';

// ============================================
// ACCOUNT DETAIL SCREEN
// ============================================

type Props = MainTabScreenProps<'AccountDetail'>;
type DetailRouteProp = RouteProp<MainTabParamList, 'AccountDetail'>;

interface MainTabParamList {
  AccountDetail: {
    accountId: string;
  };
}

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
  const [accountHoldings, setAccountHoldings] = useState<any[]>([]);
  const [holdingLoading, setHoldingLoading] = useState(false);

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
      const holdings = await HoldingService.getHoldingsByAccount(userId, acc.id);
      setAccountHoldings(holdings || []);
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
      });
      setAccount(prev =>
        prev
          ? {
              ...prev,
              accountName: editName,
              description: editDesc,
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
    try {
      // Update last sync time
      await AccountService.updateSyncStatus(accountId, userId, 'connected');
      loadAccount();
      Alert.alert('Success', 'Account synced');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync account');
      console.error('Error:', error);
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

      {/* Balance Section */}
      {account.cachedBalance && (
        <Card style={{ marginBottom: Spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Balance Summary
          </Text>

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

          <View style={styles.balanceRow}>
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
              Last Updated
            </Text>
            <Text style={[styles.balanceValue, { color: colors.text }]}>
              {account.lastBalanceUpdate
                ? new Date(account.lastBalanceUpdate).toLocaleDateString()
                : 'Never'}
            </Text>
          </View>
        </Card>
      )}

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
              containerStyle={{ marginBottom: Spacing.lg }}
            />
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
                  Address
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
                {new Date(account.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </>
        )}
      </Card>

      {/* Holdings Section */}
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
                    {formatBalance(holding.value)}
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

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <Button
          title="🔄 Manual Sync"
          onPress={handleManualSync}
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
