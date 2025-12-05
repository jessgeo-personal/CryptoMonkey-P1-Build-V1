import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import {
  PortfolioScreen,
  TransactionsScreen,
  LiquidityPoolsScreen,
  SettingsScreen,
} from '../screens';
import { useTheme } from '../hooks/useTheme';

// Simple icon components (using emoji for now, can replace with react-native-vector-icons later)
const TabBarIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => {
  return <span style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{emoji}</span>;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: React.FC = () => {
  const { colors, colorScheme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{
          tabBarLabel: 'Portfolio',
          tabBarIcon: ({ focused }) => <TabBarIcon emoji="💼" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Transactions',
          tabBarIcon: ({ focused }) => <TabBarIcon emoji="📝" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="LiquidityPools"
        component={LiquidityPoolsScreen}
        options={{
          tabBarLabel: 'LP Pools',
          tabBarIcon: ({ focused }) => <TabBarIcon emoji="💧" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabBarIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};
