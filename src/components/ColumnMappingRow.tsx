import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface ColumnMappingRowProps {
  label: string;
  required: boolean;
  selectedColumn: string;
  availableColumns: string[];
  onSelect: (column: string) => void;
  description?: string;
}

export const ColumnMappingRow: React.FC<ColumnMappingRowProps> = ({
  label,
  required,
  selectedColumn,
  availableColumns,
  onSelect,
  description,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedColumn}
          onValueChange={onSelect}
          style={styles.picker}
        >
          <Picker.Item label="-- Select Column --" value="" />
          {availableColumns.map((col) => (
            <Picker.Item key={col} label={col} value={col} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  required: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
});
