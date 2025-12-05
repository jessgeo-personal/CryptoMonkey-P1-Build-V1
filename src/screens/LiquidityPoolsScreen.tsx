import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MainTabScreenProps } from '../types/navigation';
import { useTheme } from '../hooks/useTheme';
import { Card, Button } from '../components/common';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';

// ============================================
// LIQUIDITY POOLS SCREEN
// ============================================

export const LiquidityPoolsScreen: React.FC<MainTabScreenProps<'LiquidityPools'>> = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Liquidity Pools</Text>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Active Positions
          </Text>
          <Text style={[styles.valueText, { color: colors.text }]}>
            0
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Total Value: $0.00
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Supported Protocols
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            • Uniswap V3 (Ethereum, Arbitrum, Optimism){'\n'}
            • Raydium (Solana){'\n'}
            • Aerodrome (Base)
          </Text>
        </Card>

        <View style={styles.placeholder}>
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            💧 No liquidity positions yet
          </Text>
          <Button
            title="Add LP Position"
            onPress={() => console.log('Add LP Position')}
            variant="outline"
            style={{ marginTop: Spacing.base }}
          />
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
    marginBottom: Spacing.sm,
  },
  valueText: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    marginVertical: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  placeholder: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: Typography.fontSize.lg,
    textAlign: 'center',
  },
});
