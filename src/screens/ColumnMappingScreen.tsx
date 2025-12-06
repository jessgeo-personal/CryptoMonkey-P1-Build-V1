import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { getTransactionImportService } from '../services/import/TransactionImportService';
import { ColumnMappingRow } from '../components/ColumnMappingRow';
import { MappedDataPreview } from '../components/MappedDataPreview';
import { detectColumnMappings } from '../utils/csvParser';
import { validateTransaction } from '../utils/csvValidator';
import { CSVColumnMapping, ParsedTransaction, CSVError } from '../types/csv.types';
import type { MainTabParamList } from '../types/navigation';

type ColumnMappingRouteProp = RouteProp<MainTabParamList, 'ColumnMapping'>;

export const ColumnMappingScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<ColumnMappingRouteProp>();
  const { headers, data, fileName } = route.params;
  const [sourceLocation, setSourceLocation] = useState<string>('WALLET');

  const [mappings, setMappings] = useState<Partial<CSVColumnMapping>>({});
  const [mappedTransactions, setMappedTransactions] = useState<ParsedTransaction[]>([]);
  const [errors, setErrors] = useState<CSVError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Auto-detect mappings on mount
  useEffect(() => {
    const detected = detectColumnMappings(headers);
    setMappings(detected as Partial<CSVColumnMapping>);
  }, [headers]);

  // Validate and map transactions whenever mappings change
  useEffect(() => {
    validateMappings();
  }, [mappings]);

  const validateMappings = () => {
    setIsValidating(true);
    const validatedTransactions: ParsedTransaction[] = [];
    const validationErrors: CSVError[] = [];

    // Check required fields
    if (!mappings.date || !mappings.type || !mappings.assetSymbol || !mappings.quantity || !mappings.currency) {
      setMappedTransactions([]);
      setErrors([]);
      setIsValidating(false);
      return;
    }

    // Map and validate each row
    data.forEach((row, index) => {
      const mappedRow = {
        date: mappings.date ? row[mappings.date] : '',
        type: mappings.type ? row[mappings.type] : '',
        assetSymbol: mappings.assetSymbol ? row[mappings.assetSymbol] : '',
        quantity: mappings.quantity ? row[mappings.quantity] : '',
        currency: mappings.currency ? row[mappings.currency] : '',
        pricePerUnit: mappings.pricePerUnit ? row[mappings.pricePerUnit] : undefined,
        totalValue: mappings.totalValue ? row[mappings.totalValue] : undefined,
        fee: mappings.fee ? row[mappings.fee] : undefined,
        feeCurrency: mappings.feeCurrency ? row[mappings.feeCurrency] : undefined,
        notes: mappings.notes ? row[mappings.notes] : undefined,
        exchangeId: mappings.exchangeId ? row[mappings.exchangeId] : undefined,
        walletAddress: mappings.walletAddress ? row[mappings.walletAddress] : undefined,
      };

      const validation = validateTransaction(mappedRow, index + 1);
      
      if (validation.isValid && validation.transaction) {
        validatedTransactions.push(validation.transaction);
      }
      
      validationErrors.push(...validation.errors);
    });

    setMappedTransactions(validatedTransactions);
    setErrors(validationErrors);
    setIsValidating(false);
  };

  const updateMapping = (field: keyof CSVColumnMapping, column: string) => {
    setMappings((prev) => ({
      ...prev,
      [field]: column || undefined,
    }));
  };

  const isRequiredFieldsMapped = (): boolean => {
    return !!(
      mappings.date &&
      mappings.type &&
      mappings.assetSymbol &&
      mappings.quantity &&
      mappings.currency
    );
  };

  const hasOnlyWarnings = (): boolean => {
    return errors.every(e => e.severity === 'warning');
  };

  const canProceed = (): boolean => {
    return isRequiredFieldsMapped() && 
           mappedTransactions.length > 0 && 
           (errors.length === 0 || hasOnlyWarnings());
  };

  const proceedToImport = () => {
    if (!canProceed()) {
      Alert.alert(
        'Cannot Proceed',
        'Please fix all errors and ensure required fields are mapped.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Generate import summary
    const importService = getTransactionImportService();
    const summary = importService.generateSummary(mappedTransactions);

    // Navigate to confirmation
    navigation.navigate('ImportConfirmation' as any, {
      parsedTransactions: mappedTransactions,
      fileName: fileName || 'unknown.csv',
      summary,
      sourceLocation,
    });
  };



  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Map CSV Columns</Text>
        <Text style={styles.description}>
          Map your CSV columns to transaction fields. Required fields are marked with *.
        </Text>

        <View style={styles.fileInfo}>
          <Text style={styles.fileInfoText}>📄 {fileName}</Text>
          <Text style={styles.fileInfoText}>
            {data.length} rows, {headers.length} columns
          </Text>
        </View>

        {/* Required Fields */}
        <Text style={styles.sectionTitle}>Required Fields</Text>

        <ColumnMappingRow
          label="Date"
          required
          selectedColumn={mappings.date || ''}
          availableColumns={headers}
          onSelect={(col) => updateMapping('date', col)}
          description="Transaction date (any common date format)"
        />

        <ColumnMappingRow
          label="Transaction Type"
          required
          selectedColumn={mappings.type || ''}
          availableColumns={headers}
          onSelect={(col) => updateMapping('type', col)}
          description="buy, sell, swap, transfer_in, transfer_out, etc."
        />

        <ColumnMappingRow
          label="Asset Symbol"
          required
          selectedColumn={mappings.assetSymbol || ''}
          availableColumns={headers}
          onSelect={(col) => updateMapping('assetSymbol', col)}
          description="BTC, ETH, USDT, etc."
        />

        <ColumnMappingRow
          label="Quantity"
          required
          selectedColumn={mappings.quantity || ''}
          availableColumns={headers}
          onSelect={(col) => updateMapping('quantity', col)}
          description="Amount of asset transacted"
        />

        <ColumnMappingRow
          label="Currency"
          required
          selectedColumn={mappings.currency || ''}
          availableColumns={headers}
          onSelect={(col) => updateMapping('currency', col)}
          description="USD, EUR, AED, etc."
        />

        {/* Optional Fields */}
        <Text style={styles.sectionTitle}>Optional Fields</Text>

        <ColumnMappingRow
          label="Price Per Unit"
          required={false}
          selectedColumn={mappings.pricePerUnit || ''}
          availableColumns={headers}
          onSelect={(col) => updateMapping('pricePerUnit', col)}
          description="Price per unit in the specified currency"
        />

        <ColumnMappingRow
          label="Total Value"
          required={false}
          selectedColumn={mappings.totalValue || ''}
          availableColumns={headers}
          onSelect={(col) => updateMapping('totalValue', col)}
          description="Total transaction value"
        />

        <ColumnMappingRow
          label="Fee"
          required={false}
          selectedColumn={mappings.fee || ''}
          availableColumns={headers}
          onSelect={(col) => updateMapping('fee', col)}
          description="Transaction fee amount"
        />

        <ColumnMappingRow
          label="Fee Currency"
          required={false}
          selectedColumn={mappings.feeCurrency || ''}
          availableColumns={headers}
          onSelect={(col) => updateMapping('feeCurrency', col)}
          description="Currency of the fee (if different)"
        />

        <ColumnMappingRow
          label="Notes"
          required={false}
          selectedColumn={mappings.notes || ''}
          availableColumns={headers}
          onSelect={(col) => updateMapping('notes', col)}
          description="Additional notes or comments"
        />

        {/* Validation Summary */}
        {isRequiredFieldsMapped() && (
          <View style={styles.validationSummary}>
            <Text style={styles.validationTitle}>Validation Summary</Text>
            <Text style={styles.validationText}>
              ✅ {mappedTransactions.length} valid transactions
            </Text>
            {errorCount > 0 && (
              <Text style={[styles.validationText, styles.errorText]}>
                ❌ {errorCount} errors
              </Text>
            )}
            {warningCount > 0 && (
              <Text style={[styles.validationText, styles.warningText]}>
                ⚠️ {warningCount} warnings
              </Text>
            )}
          </View>
        )}

        {/* Errors Display */}
        {errors.length > 0 && (
          <View style={styles.errorsContainer}>
            <Text style={styles.errorsTitle}>
              {errorCount > 0 ? 'Errors & Warnings' : 'Warnings'}
            </Text>
            {errors.slice(0, 10).map((error, index) => (
              <View
                key={index}
                style={[
                  styles.errorItem,
                  error.severity === 'error' ? styles.errorItemError : styles.errorItemWarning,
                ]}
              >
                <Text style={styles.errorText}>
                  Row {error.row}: {error.message}
                </Text>
              </View>
            ))}
            {errors.length > 10 && (
              <Text style={styles.moreErrorsText}>
                + {errors.length - 10} more issues
              </Text>
            )}
          </View>
        )}

        {/* Preview */}
        {mappedTransactions.length > 0 && (
          <MappedDataPreview transactions={mappedTransactions} maxRows={3} />
        )}

        {/* Source Location Selector */}
        <View style={styles.sourceLocationContainer}>
          <Text style={styles.sectionTitle}>Source Location</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={sourceLocation}
              onValueChange={(value) => setSourceLocation(value)}
              style={styles.locationPicker}
            >
              <Picker.Item label="Wallet" value="WALLET" />
              <Picker.Item label="CEX (Exchange)" value="CEX" />
              <Picker.Item label="DeFi Protocol" value="DEFI" />
              <Picker.Item label="Other" value="OTHER" />
            </Picker>
          </View>
        </View>


        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.continueButton,
              !canProceed() && styles.continueButtonDisabled,
            ]}
            onPress={proceedToImport}
            disabled={!canProceed()}
          >
            <Text style={styles.continueButtonText}>
              Continue to Import ({mappedTransactions.length})
            </Text>
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
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  fileInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  fileInfoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  validationSummary: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  validationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  errorText: {
    color: '#d32f2f',
  },
  warningText: {
    color: '#f57c00',
  },
  errorsContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorItem: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  errorItemError: {
    backgroundColor: '#ffebee',
  },
  errorItemWarning: {
    backgroundColor: '#fff3e0',
  },
  moreErrorsText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  backButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  backButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  continueButton: {
    flex: 2,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
    sourceLocationContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 8,
  },
  locationPicker: {
    height: 50,
  },

});
