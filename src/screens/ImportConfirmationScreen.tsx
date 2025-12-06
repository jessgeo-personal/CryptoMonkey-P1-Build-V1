import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ParsedTransaction, ImportSource, ImportSummary } from '../types/import.types';
import { getTransactionImportService } from '../services/import/TransactionImportService';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import type { MainTabParamList } from '../types/navigation';

type ImportConfirmationRouteProp = RouteProp<MainTabParamList, 'ImportConfirmation'>;

export const ImportConfirmationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ImportConfirmationRouteProp>();
  const { parsedTransactions, fileName, summary, sourceLocation } = route.params;

  const [isImporting, setIsImporting] = useState(false);
  const importService = getTransactionImportService();

  const executeImport = async () => {
    setIsImporting(true);

    try {
      // Get current user
      const userRepo = getUserRepository();
      const user = await userRepo.getOrCreateDefaultUser();

      // Prepare import source
      const importSource: ImportSource = {
        type: sourceLocation as any,
        name: sourceLocation,
        identifier: `${sourceLocation}_${Date.now()}`,
      };

      // Execute import
      const result = await importService.executeImport(
        user.id,
        parsedTransactions,
        importSource
      );

      setIsImporting(false);

      if (result.success && result.insertedCount > 0) {
        // Success
        Alert.alert(
          '✅ Import Successful',
          `${result.insertedCount} transactions imported successfully.\n\nFile: ${fileName}`,
          [
            {
              text: 'View Transactions',
              onPress: () => {
                navigation.navigate('Transactions');
              },
            },
          ]
        );
      } else if (result.insertedCount === 0 && result.errors.length === 0) {
        // No transactions to import
        Alert.alert(
          'No Transactions',
          'No valid transactions found in the CSV file.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Partial or complete failure
        const errorMessage = result.errors
          .slice(0, 3)
          .map(e => `Row ${e.rowNumber}: ${e.error}`)
          .join('\n');

        Alert.alert(
          '⚠️ Import Completed with Issues',
          `Imported: ${result.insertedCount}\nSkipped: ${result.skippedCount}\n\nErrors:\n${errorMessage}${
            result.errors.length > 3 ? `\n... and ${result.errors.length - 3} more` : ''
          }`,
          [
            {
              text: 'View Transactions',
              onPress: () => navigation.navigate('Transactions'),
            },
            {
              text: 'Back to Mapping',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      setIsImporting(false);
      Alert.alert(
        '❌ Import Failed',
        `An error occurred during import: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Confirm Import</Text>
        <Text style={styles.subtitle}>
          Review your import summary before proceeding
        </Text>

        {/* File Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📄 File Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Filename:</Text>
            <Text style={styles.infoValue}>{fileName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Source:</Text>
            <Text style={styles.infoValue}>{sourceLocation}</Text>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>📊 Import Summary</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Transactions:</Text>
            <Text style={[styles.infoValue, styles.highlight]}>
              {summary.totalTransactions}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date Range:</Text>
            <Text style={styles.infoValue}>
              {summary.dateRange.from} to {summary.dateRange.to}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assets:</Text>
            <Text style={styles.infoValue}>{summary.assets.join(', ')}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Transaction Types:</Text>
            <Text style={styles.infoValue}>
              {summary.transactionTypes.join(', ')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Currencies:</Text>
            <Text style={styles.infoValue}>{summary.currencies.join(', ')}</Text>
          </View>
          {summary.totalFeeAmount > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Fees:</Text>
              <Text style={styles.infoValue}>
                {summary.totalFeeAmount.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* Warnings */}
        {summary.duplicateWarnings && summary.duplicateWarnings.length > 0 && (
          <View style={styles.warningCard}>
            <Text style={styles.cardTitle}>⚠️ Duplicate Warnings</Text>
            <Text style={styles.warningText}>
              {summary.duplicateWarnings.length} potential duplicate transactions detected.
              These will be imported anyway in this phase.
            </Text>
            {summary.duplicateWarnings.slice(0, 3).map((warning, index) => (
              <View key={index} style={styles.warningItem}>
                <Text style={styles.warningItemText}>
                  Row {warning.csvRow}: {warning.csvData.assetSymbol} ×{' '}
                  {warning.csvData.quantity}
                </Text>
              </View>
            ))}
            {summary.duplicateWarnings.length > 3 && (
              <Text style={styles.moreWarningsText}>
                + {summary.duplicateWarnings.length - 3} more
              </Text>
            )}
          </View>
        )}

        {/* Fee Calculation Note */}
        <View style={styles.noteCard}>
          <Text style={styles.cardTitle}>📝 Import Notes</Text>
          <Text style={styles.noteText}>
            • Fees are included in the cost basis calculation
          </Text>
          <Text style={styles.noteText}>
            • Buy transactions: Fee increases cost per unit
          </Text>
          <Text style={styles.noteText}>
            • Sell transactions: Fee decreases proceeds per unit
          </Text>
          <Text style={styles.noteText}>
            • Historical prices are preserved as recorded
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isImporting}
          >
            <Text style={styles.cancelButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, isImporting && styles.confirmButtonDisabled]}
            onPress={executeImport}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.confirmButtonText}>
                Import {summary.totalTransactions} Transactions
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  infoCard: {
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  highlight: {
    color: '#2196F3',
    fontSize: 16,
  },
  warningCard: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  warningText: {
    fontSize: 14,
    color: '#f57c00',
    marginBottom: 8,
    lineHeight: 20,
  },
  warningItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  warningItemText: {
    fontSize: 12,
    color: '#666',
  },
  moreWarningsText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  noteCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  noteText: {
    fontSize: 13,
    color: '#1976d2',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
