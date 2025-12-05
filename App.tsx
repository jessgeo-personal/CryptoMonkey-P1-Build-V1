import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { initializeDatabase } from './src/services/database';
import { TabNavigator } from './src/navigation';
import { Spacing } from './src/constants/spacing';
import { Typography } from './src/constants/typography';

// ============================================
// APP INITIALIZATION COMPONENT
// ============================================

const AppContent = () => {
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
        
        // Simulate additional setup time
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsReady(true);
        console.log('✅ App initialization complete');
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
        <Text style={[styles.errorText, { color: colors.error }]}>
          ❌ Error
        </Text>
        <Text style={[styles.errorMessage, { color: colors.text }]}>
          {error}
        </Text>
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
        <Text style={[styles.logo, { color: colors.text }]}>🐵</Text>
        <Text style={[styles.loadingTitle, { color: colors.text }]}>
          CryptoMonkey
        </Text>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginTop: Spacing.lg }}
        />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Initializing...
        </Text>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <TabNavigator />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavigationContainer>
  );
};

// ============================================
// MAIN APP COMPONENT WITH PROVIDERS
// ============================================

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  logo: {
    fontSize: 80,
    marginBottom: Spacing.base,
  },
  loadingTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    marginTop: Spacing.base,
  },
  errorText: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.base,
  },
  errorMessage: {
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
  },
});
