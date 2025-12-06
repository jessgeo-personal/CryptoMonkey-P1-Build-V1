import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { RealizedGainAggregate } from '../types/holding.types';

interface RealizedGainsListProps {
  aggregates: RealizedGainAggregate[];
  baseCurrency: string;
}

export const RealizedGainsList: React.FC<RealizedGainsListProps> = ({
  aggregates,
  baseCurrency,
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
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

  if (aggregates.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Realized Gains/Losses</Text>
        <Text style={styles.emptyText}>No sales recorded</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Realized Gains/Losses (Monthly)</Text>

      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {aggregates.map((agg, index) => (
          <View key={`${agg.dateRange.from}-${agg.dateRange.to}`}>
            <View style={styles.monthCard}>
              <View style={styles.monthHeader}>
                <View>
                  <Text style={styles.monthLabel}>
                    {agg.dateRange.from} to {agg.dateRange.to}
                  </Text>
                  <Text style={styles.saleCount}>
                    {agg.saleCount} sale{agg.saleCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.gainLossAmount,
                    { color: getGainLossColor(agg.totalRealizedGainLoss) },
                  ]}
                >
                  {formatCurrency(agg.totalRealizedGainLoss)}
                </Text>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Qty Sold</Text>
                  <Text style={styles.metricValue}>
                    {formatQuantity(agg.totalQuantitySold)}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Cost Basis</Text>
                  <Text style={styles.metricValue}>
                    {formatCurrency(agg.totalCostBasis)}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Proceeds</Text>
                  <Text style={styles.metricValue}>
                    {formatCurrency(agg.totalProceeds)}
                  </Text>
                </View>
              </View>

              <View style={styles.percentageRow}>
                <Text style={styles.percentageLabel}>Return:</Text>
                <Text
                  style={[
                    styles.percentageValue,
                    { color: getGainLossColor(agg.totalRealizedGainLoss) },
                  ]}
                >
                  {agg.totalRealizedGainLossPercentage.toFixed(2)}%
                </Text>
              </View>

              {/* Individual sales in this period */}
              <View style={styles.salesContainer}>
                {agg.sales.map((sale, saleIndex) => (
                  <View key={sale.transactionId}>
                    <View style={styles.saleItem}>
                      <View style={styles.saleHeader}>
                        <Text style={styles.saleDate}>{sale.date}</Text>
                        <Text style={styles.saleQuantity}>
                          {formatQuantity(sale.quantity)}
                        </Text>
                      </View>

                      <View style={styles.saleRow}>
                        <Text style={styles.saleLabel}>Sale price:</Text>
                        <Text style={styles.saleValue}>
                          {formatCurrency(sale.pricePerUnit)}
                        </Text>
                      </View>

                      <View style={styles.saleRow}>
                        <Text style={styles.saleLabel}>Cost basis:</Text>
                        <Text style={styles.saleValue}>
                          {formatCurrency(sale.costBasisUsed)}
                        </Text>
                      </View>

                      <View style={styles.saleRow}>
                        <Text style={styles.saleLabel}>G/L:</Text>
                        <Text
                          style={[
                            styles.saleValue,
                            {
                              color: getGainLossColor(sale.realizedGainLoss),
                            },
                          ]}
                        >
                          {formatCurrency(sale.realizedGainLoss)}
                        </Text>
                      </View>
                    </View>

                    {saleIndex < agg.sales.length - 1 && (
                      <View style={styles.saleDivider} />
                    )}
                  </View>
                ))}
              </View>
            </View>

            {index < aggregates.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  monthCard: {
    paddingVertical: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  saleCount: {
    fontSize: 11,
    color: '#999',
  },
  gainLossAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  percentageLabel: {
    fontSize: 12,
    color: '#666',
  },
  percentageValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  salesContainer: {
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  saleItem: {
    paddingVertical: 6,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  saleDate: {
    fontSize: 11,
    color: '#666',
  },
  saleQuantity: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2196F3',
  },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  saleLabel: {
    fontSize: 11,
    color: '#999',
  },
  saleValue: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
  },
  saleDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
});
