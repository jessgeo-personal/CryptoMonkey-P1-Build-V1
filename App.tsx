import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';
import { initializeDatabase } from './src/services/database';
import { useTheme } from './src/hooks/useTheme';
import { Button, Card, Badge, Input } from './src/components/common';
import { Spacing } from './src/constants/spacing';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors, colorScheme } = useTheme();

  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 Starting CryptoMonkey...');
        
        // Initialize database
        await initializeDatabase();
        console.log('✅ Database ready');
        
        setIsReady(true);
      } catch (e) {
        console.error('❌ Initialization failed:', e);
        setError(e instanceof Error ? e.message : 'Unknown error');
      }
    }

    prepare();
  }, []);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
        <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
          Check console for details
        </Text>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Initializing CryptoMonkey...
        </Text>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.background }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>🐵 CryptoMonkey</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Design System Demo
        </Text>
        <Text style={[styles.mode, { color: colors.textSecondary }]}>
          Mode: {colorScheme}
        </Text>

        {/* Badges Demo */}
        <Card style={{ marginTop: Spacing.lg, width: '90%' }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Badges</Text>
          <View style={styles.badgeRow}>
            <Badge label="Success" variant="success" style={{ marginRight: 8 }} />
            <Badge label="Error" variant="error" style={{ marginRight: 8 }} />
            <Badge label="Warning" variant="warning" style={{ marginRight: 8 }} />
          </View>
          <View style={[styles.badgeRow, { marginTop: 8 }]}>
            <Badge label="Info" variant="info" style={{ marginRight: 8 }} />
            <Badge label="Neutral" variant="neutral" />
          </View>
        </Card>

        {/* Buttons Demo */}
        <Card style={{ marginTop: Spacing.base, width: '90%' }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Buttons</Text>
          <Button
            title="Primary Button"
            onPress={() => console.log('Primary pressed')}
            variant="primary"
            fullWidth
          />
          <Button
            title="Secondary Button"
            onPress={() => console.log('Secondary pressed')}
            variant="secondary"
            fullWidth
            style={{ marginTop: 8 }}
          />
          <Button
            title="Outline Button"
            onPress={() => console.log('Outline pressed')}
            variant="outline"
            fullWidth
            style={{ marginTop: 8 }}
          />
          <Button
            title="Small Button"
            onPress={() => console.log('Small pressed')}
            size="sm"
            style={{ marginTop: 8 }}
          />
        </Card>

        {/* Input Demo */}
        <Card style={{ marginTop: Spacing.base, width: '90%', marginBottom: Spacing.xl }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Input</Text>
          <Input
            label="Wallet Address"
            placeholder="0x..."
            containerStyle={{ marginTop: 8 }}
          />
          <Input
            label="Amount"
            placeholder="0.00"
            keyboardType="numeric"
            containerStyle={{ marginTop: 12 }}
          />
          <Input
            label="Error Example"
            placeholder="Invalid input"
            error="This field is required"
            containerStyle={{ marginTop: 12 }}
          />
        </Card>

        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  mode: {
    fontSize: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
