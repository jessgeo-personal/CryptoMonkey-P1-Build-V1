import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MainTabScreenProps } from '../types/navigation';
import { useTheme } from '../hooks/useTheme';
import { Card, Badge } from '../components/common';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';

// ============================================
// TRANSACTIONS SCREEN
// ============================================

export const TransactionsScreen: React.FC<MainTabScreenProps<'Transactions'>> = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Transactions</Text>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Transaction History
          </Text>
          <View style={styles.badgeRow}>
            <Badge label="All" variant="neutral" style={{ marginRight: 8 }} />
            <Badge label="CEX" variant="info" style={{ marginRight: 8 }} />
            <Badge label="Wallet" variant="info" style={{ marginRight: 8 }} />
            <Badge label="DEX" variant="info" />
          </View>
        </Card>

        <View style={styles.placeholder}>
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            📝 No transactions yet
          </Text>
          <Text style={[styles.placeholderSubtext, { color: colors.textSecondary }]}>
            Import CEX statements or connect wallets to see your transaction history
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.base,
  },
  card: {
    marginBottom: Spacing.base,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  placeholder: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: Typography.fontSize.lg,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  placeholderSubtext: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});
