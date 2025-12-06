import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AcquisitionHistoryList } from '../components/AcquisitionHistoryList';
import { RealizedGainsList } from '../components/RealizedGainsList';
import { getHoldingAnalyticsService } from '../services/HoldingAnalyticsService';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import { HoldingMetrics } from '../types/holding.types';
import type { MainTabParamList } from '../types/navigation';

type HoldingDetailRouteProp = RouteProp<MainTabParamList, 'HoldingDetail'> | undefined;

interface HoldingDetailParams {
  asset: string;
  currentPrice: number;
}

export const HoldingDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<HoldingDetailRouteProp>();
  
  const params = (route.params as HoldingDetailParams) || { asset: '', currentPrice: 0 };
  const { asset, currentPrice } = params;


  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<HoldingMetrics | null>(null);
  const [acquisitionHistory, setAcquisitionHistory] = useState<any[]>([]);
  const [userCurrency, setUserCurrency] = useState<string>('USD');

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const userRepo = getUserRepository();
      const user = await userRepo.getOrCreateDefaultUser();
      setUserCurrency(user.baseCurrency);

      const analyticsService = getHoldingAnalyticsService();

      // Load metrics
      const holdingMetrics = await analyticsService.calculateHoldingMetrics(
        user.id,
        asset,
        currentPrice,
        user.baseCurrency
      );
      setMetrics(holdingMetrics);

      // Load acquisition history
      const history = await analyticsService.getAcquisitionHistory(
        user.id,
        asset,
        currentPrice
      );
      setAcquisitionHistory(history);
    } catch (error) {
      console.error('Error loading holding details:', error);
      Alert.alert('Error', 'Failed to load holding details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: userCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatQuantity = (value: number): string => {
    if (value >= 1) return value.toFixed(4);
    return value.toFixed(8);
  };

  const getGainLossColor = (value: number): string => {
    return value >= 0 ? '#4CAF50' : '#f44336';
  };

  if (loading || !metrics) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.assetSymbol}>{asset}</Text>
          <Text style={styles.currentPrice}>
            {formatCurrency(currentPrice)}
          </Text>
        </View>

        {/* Current Holdings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Current Holdings</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Quantity:</Text>
            <Text style={styles.value}>
              {formatQuantity(metrics.totalQuantity)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Current Value:</Text>
            <Text style={[styles.value, { fontSize: 16, fontWeight: '600' }]}>
              {formatCurrency(metrics.currentValue)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.label}>Total Cost Basis:</Text>
            <Text style={styles.value}>
              {formatCurrency(metrics.totalCostBasis)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Unrealized Gain/Loss:</Text>
            <Text
              style={[
                styles.value,
                { color: getGainLossColor(metrics.totalGainLoss) },
              ]}
            >
              {formatCurrency(metrics.totalGainLoss)} (
              {metrics.totalGainLossPercentage.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Cost Basis by Currency */}
        {Object.keys(metrics.costBasisByLCurrency).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cost Basis by Currency</Text>

            {Object.entries(metrics.costBasisByLCurrency).map(([currency, data]) => (
              <View key={currency}>
                <View style={styles.currencySection}>
                  <Text style={styles.currencyLabel}>{currency}</Text>
                  
                  <View style={styles.row}>
                    <Text style={styles.label}>Total Cost:</Text>
                    <Text style={styles.value}>
                      {formatCurrency(data.totalCostBasis)}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>Total Fees:</Text>
                    <Text style={styles.value}>
                      {formatCurrency(data.totalFees)}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>Weighted Avg Cost:</Text>
                    <Text style={styles.value}>
                      {formatCurrency(data.weightedAverageCost)}
                    </Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>Purchases:</Text>
                    <Text style={styles.value}>{data.purchaseCount}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.label}>First Purchase:</Text>
                    <Text style={styles.value}>{data.acquisitionDate}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Acquisition History */}
        {acquisitionHistory.length > 0 && (
          <AcquisitionHistoryList
            items={acquisitionHistory}
            baseCurrency={userCurrency}
          />
        )}

        {/* Realized Gains */}
        {metrics.realizedGains.length > 0 && (
          <RealizedGainsList
            aggregates={metrics.realizedGains}
            baseCurrency={userCurrency}
          />
        )}

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadMetrics}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  assetSymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 18,
    color: '#2196F3',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  currencySection: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currencyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
