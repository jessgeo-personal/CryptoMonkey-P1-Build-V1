// ============================================
// NAVIGATION TYPES - Type-safe navigation
// ============================================

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Root Stack (for auth, onboarding, etc. - future use)
export type RootStackParamList = {
  Main: undefined;
  // Future: Onboarding, Auth screens
};

// Main Tab Navigator
export type MainTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Holdings: undefined;
  LiquidityPools: undefined;
  Settings: undefined;
  DevTest: undefined;
  Import: undefined;
  ColumnMapping: {
    headers: string[];
    data: any[];
    fileName: string;
  };
  ImportConfirmation: {
    parsedTransactions: any[];
    fileName: string;
    summary: any;
  };
  ManualTransaction: undefined;
  HoldingDetail: {
    asset: string;
    currentPrice: number;
  };
};





// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// Declare global navigation types for type checking
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
