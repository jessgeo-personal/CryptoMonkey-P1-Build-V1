import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { AcquisitionHistoryItem } from '../types/holding.types';

interface AcquisitionHistoryListProps {
  items: AcquisitionHistoryItem[];
  baseCurrency: string;
}

export const AcquisitionHistoryList: React.FC<AcquisitionHistoryListProps> = ({
  items,
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Acquisition History</Text>

      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <Text style={styles.emptyText}>No acquisitions</Text>
        ) : (
          items.map((item, index) => (
            <View key={item.transactionId} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.quantity}>
                  {formatQuantity(item.quantity)}
                </Text>
              </View>

              <View style={styles.itemRow}>
                <Text style={styles.label}>Price per unit:</Text>
                <Text style={styles.value}>
                  {formatCurrency(item.pricePerUnit)}
                </Text>
              </View>

              <View style={styles.itemRow}>
                <Text style={styles.label}>Cost:</Text>
                <Text style={styles.value}>{formatCurrency(item.totalCost)}</Text>
              </View>

              {item.fees > 0 && (
                <View style={styles.itemRow}>
                  <Text style={styles.label}>Fee:</Text>
                  <Text style={styles.value}>{formatCurrency(item.fees)}</Text>
                </View>
              )}

              <View style={styles.itemRow}>
                <Text style={styles.label}>Current value:</Text>
                <Text style={styles.value}>
                  {formatCurrency(item.currentValue)}
                </Text>
              </View>

              <View style={styles.itemRow}>
                <Text style={styles.label}>Unrealized gain/loss:</Text>
                <Text
                  style={[
                    styles.value,
                    { color: getGainLossColor(item.unrealizedGainLoss) },
                  ]}
                >
                  {formatCurrency(item.unrealizedGainLoss)} (
                  {item.unrealizedGainLossPercentage.toFixed(2)}%)
                </Text>
              </View>

              {item.notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              )}

              {index < items.length - 1 && <View style={styles.divider} />}
            </View>
          ))
        )}
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
  item: {
    paddingVertical: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  quantity: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2196F3',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
  },
  value: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  notesContainer: {
    marginTop: 8,
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  notesText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
