// src/components/common/AccountCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from './Card';
import { Badge } from './Badge';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { Typography } from '../../constants/typography';
import {
  CEX_PLATFORMS,
  WALLET_TYPES,
  CONNECTION_STATUS_CONFIG,
  ACCOUNT_TYPE_LABELS,
} from '../../constants/accountConstants';
import type { Account } from '../../types/account.types';

// ============================================
// ACCOUNT CARD COMPONENT
// ============================================

interface AccountCardProps {
  account: Account;
  onPress?: () => void;
  showBalance?: boolean;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onPress,
  showBalance = true,
}) => {
  const { colors } = useTheme();
  const statusConfig = CONNECTION_STATUS_CONFIG[account.connection.status];

  // Get platform icon and name
  const getPlatformInfo = () => {
    if (account.accountType === 'cex' && account.platform) {
      return CEX_PLATFORMS[account.platform as keyof typeof CEX_PLATFORMS];
    }
    if (
      (account.accountType === 'wallet' || account.accountType === 'hardware_wallet') &&
      account.platform
    ) {
      return WALLET_TYPES[account.platform as keyof typeof WALLET_TYPES];
    }
    return null;
  };

  const platformInfo = getPlatformInfo();

  // Format balance
  const formatBalance = (value: number | undefined): string => {
    if (value === undefined) return '--';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: account.baseCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Format last sync time
  const formatLastSync = (timestamp: number | undefined): string => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const cardContent = (
    <Card noPadding>
      <View style={styles.cardContent}>
        {/* Header with platform icon, name and status */}
        <View style={styles.header}>
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
            size="sm"
          />
        </View>

        {/* Balance Section */}
        {showBalance && (
          <View
            style={[
              styles.balanceSection,
              { borderTopColor: colors.border },
            ]}
          >
            <View style={styles.balanceRow}>
              <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                Total Balance
              </Text>
              <Text style={[styles.balanceValue, { color: colors.text }]}>
                {formatBalance(account.cachedBalance?.totalValue)}
              </Text>
            </View>
            {account.cachedBalance && (
              <View style={styles.balanceDetails}>
                <Text style={[styles.assetCount, { color: colors.textSecondary }]}>
                  {account.cachedBalance.assetCount}{' '}
                  {account.cachedBalance.assetCount === 1 ? 'asset' : 'assets'}
                </Text>
                <Text style={[styles.lastSync, { color: colors.textSecondary }]}>
                  {account.connection.status === 'connected' ? '🔄' : '⏸️'}{' '}
                  {formatLastSync(account.lastBalanceUpdate)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Primary Address (for wallets) */}
        {account.primaryAddress && (
          <View style={[styles.addressSection, { borderTopColor: colors.border }]}>
            <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>
              Address:
            </Text>
            <Text
              style={[styles.addressValue, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {account.primaryAddress}
            </Text>
          </View>
        )}

        {/* Favorite indicator */}
        {account.isFavorite && (
          <View style={styles.favoriteIndicator}>
            <Text style={styles.favoriteIcon}>⭐</Text>
          </View>
        )}
      </View>
    </Card>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  cardContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  platformIcon: {
    fontSize: 28,
  },
  accountName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  accountType: {
    fontSize: Typography.fontSize.sm,
  },
  balanceSection: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.sm,
  },
  balanceValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetCount: {
    fontSize: Typography.fontSize.xs,
  },
  lastSync: {
    fontSize: Typography.fontSize.xs,
    fontStyle: 'italic',
  },
  addressSection: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginTop: Spacing.md,
  },
  addressLabel: {
    fontSize: Typography.fontSize.xs,
    marginBottom: Spacing.xs,
  },
  addressValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.mono,
  },
  favoriteIndicator: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  favoriteIcon: {
    fontSize: 16,
  },
});
