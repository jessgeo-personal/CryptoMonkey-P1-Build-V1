import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CSVRow } from '../types/csv.types';

interface CSVPreviewProps {
  headers: string[];
  data: CSVRow[];
  maxRows?: number;
}

export const CSVPreview: React.FC<CSVPreviewProps> = ({ 
  headers, 
  data, 
  maxRows = 5 
}) => {
  const previewData = data.slice(0, maxRows);

  if (headers.length === 0 || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data to preview</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Preview ({previewData.length} of {data.length} rows)
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        style={styles.tableContainer}
      >
        <View>
          {/* Header Row */}
          <View style={styles.headerRow}>
            {headers.map((header, index) => (
              <View key={index} style={styles.headerCell}>
                <Text style={styles.headerText} numberOfLines={1}>
                  {header}
                </Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          {previewData.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.dataRow}>
              {headers.map((header, colIndex) => (
                <View key={colIndex} style={styles.dataCell}>
                  <Text style={styles.dataText} numberOfLines={2}>
                    {row[header] || '-'}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {data.length > maxRows && (
        <Text style={styles.moreRowsText}>
          + {data.length - maxRows} more rows
        </Text>
      )}
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
  tableContainer: {
    maxHeight: 300,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  headerCell: {
    width: 120,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2196F3',
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataCell: {
    width: 120,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
    justifyContent: 'center',
  },
  dataText: {
    fontSize: 12,
    color: '#666',
  },
  moreRowsText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
