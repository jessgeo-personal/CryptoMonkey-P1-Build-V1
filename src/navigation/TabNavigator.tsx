import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { DevTestScreen } from '../screens/DevTestScreen';
import {
  DashboardScreen,
  TransactionsScreen,
  LiquidityPoolsScreen,
  SettingsScreen,
  ImportScreen,
  ImportConfirmationScreen,
  ColumnMappingScreen,
  ManualTransactionScreen,
} from '../screens';
import { HoldingsScreen } from '../screens/HoldingsScreen';
import { useTheme } from '../hooks/useTheme';



// ============================================
// TAB BAR ICON COMPONENT
// ============================================

interface TabBarIconProps {
  emoji: string;
  focused: boolean;
  color: string;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ emoji, focused }) => {
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const TabNavigator: React.FC = () => {
  const { colors } = useTheme();

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
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon emoji="📊" focused={focused} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarLabel: 'Transactions',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon emoji="📝" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Holdings"
        component={HoldingsScreen}
        options={{
          tabBarLabel: 'Holdings',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon emoji="💎" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LiquidityPools"
        component={LiquidityPoolsScreen}
        options={{
          tabBarLabel: 'LP Pools',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon emoji="💧" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon emoji="⚙️" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="DevTest"
        component={DevTestScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size }}>🧪</Text>
          ),
          title: 'Dev Test',
        }}
      />
      <Tab.Screen
        name="Import"
        component={ImportScreen}
        options={{
          tabBarButton: () => null, // Hide from tab bar
          headerShown: true,
          title: 'Import CSV',
        }}
      />
      <Tab.Screen
        name="ColumnMapping"
        component={ColumnMappingScreen}
        options={{
          tabBarButton: () => null, // Hide from tab bar
          headerShown: true,
          title: 'Map Columns',
        }}
      />
      <Tab.Screen
        name="ImportConfirmation"
        component={ImportConfirmationScreen}
        options={{
          tabBarButton: () => null, // Hide from tab bar
          headerShown: true,
          title: 'Confirm Import',
        }}
      />
      <Tab.Screen
        name="ManualTransaction"
        component={ManualTransactionScreen}
        options={{
          tabBarButton: () => null, // Hide from tab bar
          headerShown: true,
          title: 'Add Transaction',
        }}
      />

    </Tab.Navigator>
  );
};
