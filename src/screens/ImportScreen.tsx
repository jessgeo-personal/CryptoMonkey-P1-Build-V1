import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { CSVPreview } from '../components/CSVPreview';
import { parseCSVContent, validateCSVStructure } from '../utils/csvParser';
import { CSVParseResult, CSVError } from '../types/csv.types';
import { useNavigation } from '@react-navigation/native';
import type { MainTabScreenProps } from '../types/navigation';


export const ImportScreen: React.FC = () => {
  const navigation = useNavigation<MainTabScreenProps<'Import'>['navigation']>();
  const [isLoading, setIsLoading] = useState(false);

  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [errors, setErrors] = useState<CSVError[]>([]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/csv', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });


      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      
      // Validate file extension
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.txt')) {
        Alert.alert(
          'Invalid File Type',
          'Please select a CSV file (.csv or .txt)',
          [{ text: 'OK' }]
        );
        return;
      }
      
      setFileName(file.name);
      setIsLoading(true);

      setErrors([]);

      // Read file content
      const response = await fetch(file.uri);
      const content = await response.text();

      // Parse CSV
      const parsed = await parseCSVContent(content, {
        hasHeaders: true,
        skipEmptyLines: true,
        trimFields: true,
      });

      // Validate structure
      const structureErrors = validateCSVStructure(parsed);
      
      if (structureErrors.length > 0) {
        setErrors(structureErrors);
        setParseResult(null);
      } else {
        setParseResult(parsed);
        setErrors(parsed.errors);
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      
      // Detailed error logging
      console.error('Document picker error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to read CSV file';
      Alert.alert(
        'Error',
        `Could not read file: ${errorMessage}`,
        [{ text: 'OK' }]
      );
    }

  };

  const clearImport = () => {
    setFileName(null);
    setParseResult(null);
    setErrors([]);
  };

  const proceedToMapping = () => {
    if (!parseResult) return;
    
    navigation.navigate('ColumnMapping', {
      headers: parseResult.headers,
      data: parseResult.data,
      fileName: fileName || 'unknown.csv',
    });
  };


  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Import Transactions from CSV</Text>
        <Text style={styles.description}>
          Select a CSV file containing your transaction history. 
          We'll help you map the columns and import your data.
        </Text>

        {/* File Picker Button */}
        <TouchableOpacity
          style={styles.pickButton}
          onPress={pickDocument}
          disabled={isLoading}
        >
          <Text style={styles.pickButtonText}>
            {fileName ? 'Change File' : 'Select CSV File'}
          </Text>
        </TouchableOpacity>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Parsing CSV...</Text>
          </View>
        )}

        {/* File Info */}
        {fileName && !isLoading && (
          <View style={styles.fileInfo}>
            <Text style={styles.fileInfoLabel}>Selected File:</Text>
            <Text style={styles.fileInfoText}>{fileName}</Text>
            {parseResult && (
              <Text style={styles.fileInfoText}>
                {parseResult.rowCount} rows, {parseResult.headers.length} columns
              </Text>
            )}
          </View>
        )}

        {/* Errors Display */}
        {errors.length > 0 && (
          <View style={styles.errorsContainer}>
            <Text style={styles.errorsTitle}>
              {errors.some(e => e.severity === 'error') ? 'Errors' : 'Warnings'}
            </Text>
            {errors.map((error, index) => (
              <View 
                key={index} 
                style={[
                  styles.errorItem,
                  error.severity === 'error' ? styles.errorItemError : styles.errorItemWarning
                ]}
              >
                <Text style={styles.errorText}>
                  {error.row > 0 ? `Row ${error.row}: ` : ''}
                  {error.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* CSV Preview */}
        {parseResult && parseResult.data.length > 0 && (
          <>
            <CSVPreview
              headers={parseResult.headers}
              data={parseResult.data}
              maxRows={5}
            />

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearImport}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  errors.some(e => e.severity === 'error') && styles.continueButtonDisabled
                ]}
                onPress={proceedToMapping}
                disabled={errors.some(e => e.severity === 'error')}
              >
                <Text style={styles.continueButtonText}>
                  Continue to Mapping
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>CSV Format Guidelines:</Text>
          <Text style={styles.instructionText}>
            • First row should contain column headers
          </Text>
          <Text style={styles.instructionText}>
            • Required columns: Date, Type, Asset, Quantity
          </Text>
          <Text style={styles.instructionText}>
            • Optional columns: Price, Total, Fee, Notes
          </Text>
          <Text style={styles.instructionText}>
            • Transaction types: buy, sell, transfer_in, transfer_out, swap
          </Text>
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
    marginBottom: 24,
    lineHeight: 20,
  },
  pickButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  fileInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  fileInfoLabel: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '600',
    marginBottom: 4,
  },
  fileInfoText: {
    fontSize: 14,
    color: '#333',
    marginTop: 2,
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
  errorText: {
    fontSize: 12,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  clearButtonText: {
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
  instructionsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});
