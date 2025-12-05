import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MainTabScreenProps } from '../types/navigation';
import { useTheme } from '../hooks/useTheme';
import { Card } from '../components/common';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';

// ============================================
// PORTFOLIO SCREEN
// ============================================

export const PortfolioScreen: React.FC<MainTabScreenProps<'Portfolio'>> = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Portfolio</Text>
        
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Total Portfolio Value
          </Text>
          <Text style={[styles.valueText, { color: colors.primary }]}>
            $0.00
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            No assets yet
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            • Add CEX Account{'\n'}
            • Connect Wallet{'\n'}
            • Import Transactions
          </Text>
        </Card>

        <View style={styles.placeholder}>
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
            📊 Portfolio dashboard coming soon
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
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
  },
});
