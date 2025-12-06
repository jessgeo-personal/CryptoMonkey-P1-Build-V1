import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DatePicker from 'react-native-date-picker';

interface DatePickerInputProps {
  label: string;
  value: Date;
  onDateChange: (date: Date) => void;
  required?: boolean;
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onDateChange,
  required = false,
}) => {
  const [open, setOpen] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.dateText}>{formatDate(value)}</Text>
        <Text style={styles.calendarIcon}>📅</Text>
      </TouchableOpacity>

      <DatePicker
        modal
        open={open}
        date={value}
        onConfirm={(date) => {
          onDateChange(date);
          setOpen(false);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  calendarIcon: {
    fontSize: 20,
  },
});
