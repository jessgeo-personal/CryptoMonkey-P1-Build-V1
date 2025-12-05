import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Spacing } from '../constants/spacing';
import { Typography } from '../constants/typography';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import { User, UserSettings, SupportedCurrency } from '../types/models';
import DatabaseService from '../services/database/DatabaseService';

// ============================================
// SETTINGS SCREEN
// ============================================

const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  'USD', 'EUR', 'GBP', 'AED', 'SGD', 'HKD', 'INR', 'CNY'
];

const CURRENCY_SYMBOLS: { [key in SupportedCurrency]: string } = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SGD: 'S$',
  HKD: 'HK$',
  INR: '₹',
  CNY: '¥',
};

export function SettingsScreen() {
  const { colors, colorScheme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  /**
   * Load user settings
   */
  const loadSettings = async () => {
    try {
      const userRepo = getUserRepository();
      const currentUser = await userRepo.getOrCreateDefaultUser();
      setUser(currentUser);
      setSettings(currentUser.settings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  /**
   * Update setting
   */
  const updateSetting = async (
    section: keyof UserSettings,
    key: string,
    value: any
  ) => {
    if (!user || !settings) return;

    try {
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          [key]: value,
        },
      };

      const userRepo = getUserRepository();
      await userRepo.updateSettings(user.id, newSettings);
      
      setSettings(newSettings);
      console.log(`✅ Setting updated: ${section}.${key} = ${value}`);
    } catch (error) {
      console.error('Error updating setting:', error);
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  /**
   * Update base currency
   */
  const updateBaseCurrency = async (currency: SupportedCurrency) => {
    if (!user) return;

    try {
      const userRepo = getUserRepository();
      const updatedUser = { ...user, baseCurrency: currency };
      await userRepo.update(updatedUser);
      
      setUser(updatedUser);
      Alert.alert('Success', `Base currency changed to ${currency}`);
    } catch (error) {
      console.error('Error updating currency:', error);
      Alert.alert('Error', 'Failed to update currency');
    }
  };

  /**
   * Reset database
   */
  const handleResetDatabase = () => {
    Alert.alert(
      'Reset Database',
      'This will delete ALL data including transactions, holdings, and settings. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = DatabaseService.getInstance();
              await db.reset();
              Alert.alert('Success', 'Database reset successfully. Please restart the app.');
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Error', 'Failed to reset database');
            }
          },
        },
      ]
    );
  };

  /**
   * Show currency picker
   */
  const showCurrencyPicker = () => {
    const buttons = SUPPORTED_CURRENCIES.map(currency => ({
      text: `${CURRENCY_SYMBOLS[currency]} ${currency}`,
      onPress: () => updateBaseCurrency(currency),
    }));
    
    buttons.push({
      text: 'Cancel',
      onPress: () => {},
    });

    Alert.alert(
      'Select Base Currency',
      'Choose your preferred currency for displaying values',
      buttons
    );
  };


  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  if (!settings) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading settings...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Customize your CryptoMonkey experience
        </Text>
      </View>

      {/* Appearance Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🎨 Appearance
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Dark Mode
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Use dark theme throughout the app
            </Text>
          </View>
          <Switch
            value={colorScheme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Compact View
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Show more information in less space
            </Text>
          </View>
          <Switch
            value={settings.display.compactView}
            onValueChange={(value) => updateSetting('display', 'compactView', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Show Zero Balances
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Display assets with zero balance
            </Text>
          </View>
          <Switch
            value={settings.display.showZeroBalances}
            onValueChange={(value) => updateSetting('display', 'showZeroBalances', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Currency Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          💰 Currency
        </Text>

        <TouchableOpacity
          style={styles.settingRow}
          onPress={showCurrencyPicker}
        >
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Base Currency
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Your preferred currency for displaying values
            </Text>
          </View>
          <View style={styles.currencyValue}>
            <Text style={[styles.currencySymbol, { color: colors.text }]}>
              {CURRENCY_SYMBOLS[user?.baseCurrency || 'USD']}
            </Text>
            <Text style={[styles.currencyCode, { color: colors.text }]}>
              {user?.baseCurrency || 'USD'}
            </Text>
            <Text style={[styles.chevron, { color: colors.textSecondary }]}>
              ›
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Notifications Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🔔 Notifications
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              LP Out of Range
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Alert when liquidity pool positions go out of range
            </Text>
          </View>
          <Switch
            value={settings.notifications.lpOutOfRange}
            onValueChange={(value) => updateSetting('notifications', 'lpOutOfRange', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Price Alerts
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Notify on significant price changes
            </Text>
          </View>
          <Switch
            value={settings.notifications.priceAlerts}
            onValueChange={(value) => updateSetting('notifications', 'priceAlerts', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Transaction Updates
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Notify about transaction confirmations
            </Text>
          </View>
          <Switch
            value={settings.notifications.transactionUpdates}
            onValueChange={(value) => updateSetting('notifications', 'transactionUpdates', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Privacy Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🔒 Privacy
        </Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Analytics
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Help improve the app with usage data
            </Text>
          </View>
          <Switch
            value={settings.privacy.analyticsEnabled}
            onValueChange={(value) => updateSetting('privacy', 'analyticsEnabled', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Crash Reports
            </Text>
            <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
              Automatically send crash reports
            </Text>
          </View>
          <Switch
            value={settings.privacy.crashReportsEnabled}
            onValueChange={(value) => updateSetting('privacy', 'crashReportsEnabled', value)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* Data Management Section */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          🗄️ Data Management
        </Text>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleResetDatabase}
        >
          <Text style={[styles.dangerButtonText, { color: colors.error }]}>
            🗑️ Reset Database
          </Text>
          <Text style={[styles.dangerButtonDescription, { color: colors.textSecondary }]}>
            Delete all data and start fresh
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
        <Text style={[styles.infoTitle, { color: colors.text }]}>
          CryptoMonkey
        </Text>
        <Text style={[styles.infoVersion, { color: colors.textSecondary }]}>
          Version 1.0.0 (Phase 1)
        </Text>
        <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
          Personal crypto wealth tracking app
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
  },
  section: {
    borderRadius: 12,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.base,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.base,
  },
  settingLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontSize: Typography.fontSize.sm,
  },
  currencyValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  currencySymbol: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
  },
  currencyCode: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  chevron: {
    fontSize: 24,
    marginLeft: Spacing.xs,
  },
  dangerButton: {
    padding: Spacing.base,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.3)',
  },
  dangerButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.xs,
  },
  dangerButtonDescription: {
    fontSize: Typography.fontSize.sm,
  },
  infoSection: {
    borderRadius: 12,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  infoTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  infoVersion: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  infoDescription: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});
