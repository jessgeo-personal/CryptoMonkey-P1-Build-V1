import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ParsedTransaction } from '../types/csv.types';

interface MappedDataPreviewProps {
  transactions: ParsedTransaction[];
  maxRows?: number;
}

export const MappedDataPreview: React.FC<MappedDataPreviewProps> = ({
  transactions,
  maxRows = 3,
}) => {
  const previewData = transactions.slice(0, maxRows);

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No mapped data to preview</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Preview ({previewData.length} of {transactions.length} transactions)
      </Text>

      <ScrollView style={styles.scrollView}>
        {previewData.map((tx, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Type:</Text>
              <Text style={styles.rowValue}>{tx.type}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Asset:</Text>
              <Text style={styles.rowValue}>{tx.assetSymbol}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Quantity:</Text>
              <Text style={styles.rowValue}>{tx.quantity}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date:</Text>
              <Text style={styles.rowValue}>
                {new Date(tx.date).toLocaleDateString()}
              </Text>
            </View>

            {tx.pricePerUnit && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Price:</Text>
                <Text style={styles.rowValue}>
                  {tx.pricePerUnit} {tx.currency}
                </Text>
              </View>
            )}

            {tx.totalValue && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Total:</Text>
                <Text style={styles.rowValue}>
                  {tx.totalValue} {tx.currency}
                </Text>
              </View>
            )}

            {tx.fee && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Fee:</Text>
                <Text style={styles.rowValue}>
                  {tx.fee} {tx.feeCurrency || tx.currency}
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {transactions.length > maxRows && (
        <Text style={styles.moreText}>
          + {transactions.length - maxRows} more transactions
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  scrollView: {
    maxHeight: 400,
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rowLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  moreText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
