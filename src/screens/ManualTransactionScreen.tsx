import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { DatePickerInput } from '../components/DatePickerInput';
import { AssetAutocomplete } from '../components/AssetAutocomplete';
import { getTransactionImportService } from '../services/import/TransactionImportService';
import { getUserRepository } from '../services/database/repositories/UserRepository';
import { ParsedTransaction, ImportSource } from '../types/import.types';
import { validateNumber } from '../utils/csvValidator';

export const ManualTransactionScreen: React.FC = () => {
  const navigation = useNavigation();

  // Form state
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState<'buy' | 'sell' | 'swap' | 'transfer_in' | 'transfer_out'>('buy');
  const [asset, setAsset] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [fee, setFee] = useState('');
  const [feeCurrency, setFeeCurrency] = useState('USD');
  const [sourceLocation, setSourceLocation] = useState('WALLET');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencies = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'HKD', 'INR', 'CNY'];
  const transactionTypes: Array<'buy' | 'sell' | 'swap' | 'transfer_in' | 'transfer_out'> = [
    'buy',
    'sell',
    'swap',
    'transfer_in',
    'transfer_out',
  ];

  /**
   * Validate form
   */
  const validateForm = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!date) errors.push('Date is required');
    if (!type) errors.push('Transaction type is required');
    if (!asset) errors.push('Asset symbol is required');
    if (!quantity) errors.push('Quantity is required');
    if (!pricePerUnit) errors.push('Price per unit is required');
    if (!currency) errors.push('Currency is required');

    const quantityResult = validateNumber(quantity, 'Quantity', false);
    if (!quantityResult.isValid) errors.push('Quantity must be a positive number');

    const priceResult = validateNumber(pricePerUnit, 'Price', false);
    if (!priceResult.isValid) errors.push('Price must be a positive number');

    if (fee) {
      const feeResult = validateNumber(fee, 'Fee', false);
      if (!feeResult.isValid) errors.push('Fee must be a positive number');
    }

    return { valid: errors.length === 0, errors };
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Validate
    const validation = validateForm();
    if (!validation.valid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Create ParsedTransaction
      const parsedTransaction: ParsedTransaction = {
        date: date.toISOString(),
        type,
        assetSymbol: asset.toUpperCase(),
        quantity: parseFloat(quantity),
        pricePerUnit: parseFloat(pricePerUnit),
        currency,
        fee: fee ? parseFloat(fee) : undefined,
        feeCurrency: fee ? feeCurrency : undefined,
        notes: notes || undefined,
      };

      // Get user
      const userRepo = getUserRepository();
      const user = await userRepo.getOrCreateDefaultUser();

      // Prepare import source
      const importSource: ImportSource = {
        type: sourceLocation as any,
        name: sourceLocation,
        identifier: `manual_${Date.now()}`,
      };

      // Import service
      const importService = getTransactionImportService();

      // Execute import
      const result = await importService.executeImport(user.id, [parsedTransaction], importSource);

      setIsSubmitting(false);

      if (result.success && result.insertedCount > 0) {
        // Success
        Alert.alert(
          '✅ Transaction Added',
          `${asset.toUpperCase()} transaction added successfully`,
          [
            {
              text: 'View All Transactions',
              onPress: () => {
                navigation.navigate('Transactions' as any);
              },
            },
          ]
        );
      } else {
        // Error
        const errorMsg = result.errors[0]?.error || 'Failed to add transaction';
        Alert.alert('❌ Error', errorMsg, [{ text: 'OK' }]);
      }
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert(
        '❌ Error',
        `Failed to add transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
      console.error('Submit error:', error);
    }
  };

  /**
   * Reset form
   */
  const handleReset = () => {
    Alert.alert('Reset Form', 'Clear all fields?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        onPress: () => {
          setDate(new Date());
          setType('buy');
          setAsset('');
          setQuantity('');
          setPricePerUnit('');
          setCurrency('USD');
          setFee('');
          setFeeCurrency('USD');
          setSourceLocation('WALLET');
          setNotes('');
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Add Transaction Manually</Text>
        <Text style={styles.description}>
          Record a transaction that you don't have a CSV for
        </Text>

        {/* Date */}
        <DatePickerInput
          label="Transaction Date"
          value={date}
          onDateChange={setDate}
          required
        />

        {/* Transaction Type */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Transaction Type <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={type}
              onValueChange={(value) => setType(value)}
              style={styles.picker}
            >
              {transactionTypes.map((t) => (
                <Picker.Item
                  key={t}
                  label={t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')}
                  value={t}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Asset Symbol with Autocomplete */}
        <AssetAutocomplete
          label="Asset Symbol"
          value={asset}
          onSelect={setAsset}
          placeholder="e.g. BTC, ETH..."
          required
        />

        {/* Quantity */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Quantity <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.textInputContainer}>
            <Text style={styles.inputPrefix}>Qty:</Text>
            <Text style={styles.textInput} onPress={() => {}} />
          </View>
        </View>

        {/* Using React Native TextInput for quantity */}
        <View style={styles.textInputWrapper}>
          <Text style={styles.label}>
            Quantity <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="0.00"
            placeholderTextColor="#999"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Price Per Unit */}
        <View style={styles.textInputWrapper}>
          <Text style={styles.label}>
            Price Per Unit <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="0.00"
            placeholderTextColor="#999"
            value={pricePerUnit}
            onChangeText={setPricePerUnit}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Currency */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Currency <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={currency}
              onValueChange={setCurrency}
              style={styles.picker}
            >
              {currencies.map((c) => (
                <Picker.Item key={c} label={c} value={c} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Fee (Optional) */}
        <View style={styles.textInputWrapper}>
          <Text style={styles.label}>Fee (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="0.00"
            placeholderTextColor="#999"
            value={fee}
            onChangeText={setFee}
            keyboardType="decimal-pad"
          />
        </View>

        {/* Fee Currency */}
        {fee && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Fee Currency</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={feeCurrency}
                onValueChange={setFeeCurrency}
                style={styles.picker}
              >
                {currencies.map((c) => (
                  <Picker.Item key={c} label={c} value={c} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Source Location */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Source Location</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sourceLocation}
              onValueChange={setSourceLocation}
              style={styles.picker}
            >
              <Picker.Item label="Wallet" value="WALLET" />
              <Picker.Item label="CEX (Exchange)" value="CEX" />
              <Picker.Item label="DeFi Protocol" value="DEFI" />
              <Picker.Item label="Other" value="OTHER" />
            </Picker>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.textInputWrapper}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Add any notes about this transaction..."
            placeholderTextColor="#999"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Summary Card */}
        {quantity && pricePerUnit && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Transaction Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Value:</Text>
              <Text style={styles.summaryValue}>
                {(parseFloat(quantity) * parseFloat(pricePerUnit)).toFixed(2)} {currency}
              </Text>
            </View>
            {fee && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>With Fee:</Text>
                <Text style={styles.summaryValue}>
                  {(
                    parseFloat(quantity) * parseFloat(pricePerUnit) +
                    (parseFloat(fee) || 0)
                  ).toFixed(2)}{' '}
                  {currency}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            disabled={isSubmitting}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Add Transaction</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  textInputWrapper: {
    marginBottom: 16,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputPrefix: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  summaryCard: {
    backgroundColor: '#e3f2fd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
  },
  summaryValue: {
    fontSize: 13,
    color: '#1976d2',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  resetButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 12,
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
});
