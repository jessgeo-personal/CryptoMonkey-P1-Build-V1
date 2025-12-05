import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { MainTabScreenProps } from '../types/navigation';
import { useTheme } from '../hooks/useTheme';
import { Card, Button } from '../components/common';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { SUPPORTED_CURRENCIES } from '../constants/currencies';

// ============================================
// SETTINGS SCREEN
// ============================================

export const SettingsScreen: React.FC<MainTabScreenProps<'Settings'>> = () => {
  const { colors, colorScheme, isDark, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Theme Toggle */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Appearance
          </Text>
          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Current: {colorScheme === 'dark' ? 'Dark' : 'Light'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.secondary, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </Card>

        {/* Base Currency */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Base Currency
          </Text>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            USD - US Dollar
          </Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            Supported: {Object.keys(SUPPORTED_CURRENCIES).join(', ')}
          </Text>
        </Card>

        {/* Account */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Account
          </Text>
          <Button
            title="CEX Connections"
            onPress={() => console.log('CEX Connections')}
            variant="outline"
            fullWidth
          />
          <Button
            title="Wallet Addresses"
            onPress={() => console.log('Wallet Addresses')}
            variant="outline"
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        </Card>

        {/* Data & Privacy */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Data & Privacy
          </Text>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Analytics
            </Text>
            <Switch
              value={false}
              onValueChange={() => console.log('Analytics toggled')}
              trackColor={{ false: colors.secondary, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
          <View style={[styles.settingRow, { marginTop: Spacing.md }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Crash Reports
            </Text>
            <Switch
              value={true}
              onValueChange={() => console.log('Crash reports toggled')}
              trackColor={{ false: colors.secondary, true: colors.primary }}
              thumbColor={colors.surface}
            />
          </View>
        </Card>

        {/* About */}
        <Card style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            About
          </Text>
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            CryptoMonkey v1.0.0
          </Text>
          <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
            Phase 1 - Development Build
          </Text>
        </Card>

        <View style={{ height: Spacing.xl }} />
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: Spacing.base,
  },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
  },
});
