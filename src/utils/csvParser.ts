import Papa from 'papaparse';
import { CSVRow, CSVParseResult, CSVError, CSVImportConfig } from '../types/csv.types';

/**
 * Parses CSV content and returns structured data with validation
 */
export async function parseCSVContent(
  content: string,
  config: CSVImportConfig = {}
): Promise<CSVParseResult> {
  const {
    delimiter = ',',
    hasHeaders = true,
    skipEmptyLines = true,
    trimFields = true,
  } = config;

  return new Promise((resolve) => {
    Papa.parse(content, {
      delimiter,
      header: hasHeaders,
      skipEmptyLines,
      transformHeader: trimFields ? (header) => header.trim() : undefined,
      transform: trimFields ? (value) => value.trim() : undefined,
      complete: (results) => {
        const errors: CSVError[] = [];
        
        // Collect parsing errors
        if (results.errors && results.errors.length > 0) {
          results.errors.forEach((error) => {
            errors.push({
              row: error.row || 0,
              message: error.message,
              severity: 'error',
            });
          });
        }

        // Extract headers
        const headers = hasHeaders && results.meta.fields 
          ? results.meta.fields 
          : [];

        resolve({
          success: errors.length === 0,
          data: results.data as CSVRow[],
          errors,
          headers,
          rowCount: results.data.length,
        });
      },
      error: (error: Error) => {
        resolve({
          success: false,
          data: [],
          errors: [{
            row: 0,
            message: error.message,
            severity: 'error',
          }],
          headers: [],
          rowCount: 0,
        });
      },
    });
  });
}

/**
 * Detects common CSV column patterns and suggests mappings
 */
export function detectColumnMappings(headers: string[]): Partial<Record<string, string>> {
  const mappings: Partial<Record<string, string>> = {};
  
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Date detection
  const datePatterns = ['date', 'time', 'timestamp', 'datetime', 'created'];
  const dateIndex = lowerHeaders.findIndex(h => 
    datePatterns.some(p => h.includes(p))
  );
  if (dateIndex !== -1) {
    mappings.date = headers[dateIndex];
  }

  // Transaction type detection
  const typePatterns = ['type', 'transaction type', 'action', 'operation'];
  const typeIndex = lowerHeaders.findIndex(h => 
    typePatterns.some(p => h.includes(p))
  );
  if (typeIndex !== -1) {
    mappings.type = headers[typeIndex];
  }

  // Asset symbol detection
  const assetPatterns = ['asset', 'symbol', 'token', 'coin', 'cryptocurrency', 'currency'];
  const assetIndex = lowerHeaders.findIndex(h => 
    assetPatterns.some(p => h.includes(p)) && !h.includes('fee')
  );
  if (assetIndex !== -1) {
    mappings.assetSymbol = headers[assetIndex];
  }

  // Quantity detection
  const quantityPatterns = ['quantity', 'amount', 'qty', 'volume'];
  const quantityIndex = lowerHeaders.findIndex(h => 
    quantityPatterns.some(p => h.includes(p)) && !h.includes('fee') && !h.includes('total')
  );
  if (quantityIndex !== -1) {
    mappings.quantity = headers[quantityIndex];
  }

  // Price detection
  const pricePatterns = ['price', 'rate', 'price per unit', 'unit price'];
  const priceIndex = lowerHeaders.findIndex(h => 
    pricePatterns.some(p => h.includes(p))
  );
  if (priceIndex !== -1) {
    mappings.pricePerUnit = headers[priceIndex];
  }

  // Total value detection
  const totalPatterns = ['total', 'value', 'total value', 'amount'];
  const totalIndex = lowerHeaders.findIndex(h => 
    totalPatterns.some(p => h.includes(p)) && !h.includes('fee')
  );
  if (totalIndex !== -1) {
    mappings.totalValue = headers[totalIndex];
  }

  // Fee detection
  const feePatterns = ['fee', 'fees', 'commission'];
  const feeIndex = lowerHeaders.findIndex(h => 
    feePatterns.some(p => h.includes(p))
  );
  if (feeIndex !== -1) {
    mappings.fee = headers[feeIndex];
  }

  // Notes detection
  const notesPatterns = ['notes', 'note', 'memo', 'description', 'comment'];
  const notesIndex = lowerHeaders.findIndex(h => 
    notesPatterns.some(p => h.includes(p))
  );
  if (notesIndex !== -1) {
    mappings.notes = headers[notesIndex];
  }

  // Exchange detection
  const exchangePatterns = ['exchange', 'platform', 'source'];
  const exchangeIndex = lowerHeaders.findIndex(h => 
    exchangePatterns.some(p => h.includes(p))
  );
  if (exchangeIndex !== -1) {
    mappings.exchangeId = headers[exchangeIndex];
  }

  // Wallet detection
  const walletPatterns = ['wallet', 'address', 'wallet address'];
  const walletIndex = lowerHeaders.findIndex(h => 
    walletPatterns.some(p => h.includes(p))
  );
  if (walletIndex !== -1) {
    mappings.walletAddress = headers[walletIndex];
  }

  return mappings;
}

/**
 * Validates CSV structure before processing
 */
export function validateCSVStructure(parseResult: CSVParseResult): CSVError[] {
  const errors: CSVError[] = [];

  // Check if we have data
  if (parseResult.rowCount === 0) {
    errors.push({
      row: 0,
      message: 'CSV file is empty',
      severity: 'error',
    });
    return errors;
  }

  // Check if we have headers
  if (parseResult.headers.length === 0) {
    errors.push({
      row: 0,
      message: 'CSV file has no headers',
      severity: 'error',
    });
  }

  // Check for minimum required columns (at least 4: date, type, asset, quantity)
  if (parseResult.headers.length < 4) {
    errors.push({
      row: 0,
      message: 'CSV file must have at least 4 columns (date, type, asset, quantity)',
      severity: 'error',
    });
  }

  return errors;
}
