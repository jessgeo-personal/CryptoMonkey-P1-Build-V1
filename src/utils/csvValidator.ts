import { CSVError, ParsedTransaction, TransactionValidationResult } from '../types/csv.types';

// Supported transaction types
const VALID_TRANSACTION_TYPES = ['buy', 'sell', 'transfer_in', 'transfer_out', 'swap'];

// Common currency codes
const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'HKD', 'INR', 'CNY', 'BTC', 'ETH', 'USDT', 'USDC'];

/**
 * Validates a date string and converts to ISO format
 */
export function validateDate(dateString: string): { isValid: boolean; isoDate?: string; error?: string } {
  if (!dateString || dateString.trim() === '') {
    return { isValid: false, error: 'Date is required' };
  }

  try {
    const trimmed = dateString.trim();
    
    // Try multiple date formats
    let parsed: Date | null = null;

    // Format 1: ISO (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss)
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      parsed = new Date(trimmed);
    }
    // Format 2: US (MM/DD/YYYY or M/D/YYYY)
    else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [month, day, year] = trimmed.split('/');
      parsed = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
    // Format 3: EU (DD/MM/YYYY or D/M/YYYY)
    else if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split('-');
      parsed = new Date(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
    // Format 4: Text format (DD-MMM-YYYY or D-MMM-YYYY)
    else if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(trimmed)) {
      parsed = new Date(trimmed);
    }
    // Format 5: Let JavaScript try to parse it
    else {
      parsed = new Date(trimmed);
    }
    
    if (!parsed || isNaN(parsed.getTime())) {
      return { isValid: false, error: `Cannot parse date: ${dateString}` };
    }

    return { isValid: true, isoDate: parsed.toISOString() };
  } catch (error) {
    return { isValid: false, error: 'Failed to parse date' };
  }
}


/**
 * Validates transaction type
 */
export function validateTransactionType(type: string): { isValid: boolean; normalizedType?: string; error?: string } {
  if (!type || type.trim() === '') {
    return { isValid: false, error: 'Transaction type is required' };
  }

  const normalized = type.toLowerCase().trim();
  
  // Map common variations to standard types
  const typeMap: { [key: string]: string } = {
    'buy': 'buy',
    'purchase': 'buy',
    'bought': 'buy',
    'sell': 'sell',
    'sold': 'sell',
    'deposit': 'transfer_in',
    'transfer_in': 'transfer_in',
    'receive': 'transfer_in',
    'received': 'transfer_in',
    'withdrawal': 'transfer_out',
    'transfer_out': 'transfer_out',
    'withdraw': 'transfer_out',
    'sent': 'transfer_out',
    'send': 'transfer_out',
    'swap': 'swap',
    'exchange': 'swap',
    'convert': 'swap',
  };

  const mappedType = typeMap[normalized];
  
  if (!mappedType) {
    return { isValid: false, error: `Unknown transaction type: ${type}` };
  }

  return { isValid: true, normalizedType: mappedType };
}

/**
 * Validates and normalizes asset symbol
 */
export function validateAssetSymbol(symbol: string): { isValid: boolean; normalizedSymbol?: string; error?: string } {
  if (!symbol || symbol.trim() === '') {
    return { isValid: false, error: 'Asset symbol is required' };
  }

  const normalized = symbol.toUpperCase().trim();
  
  // Basic validation - alphanumeric and some special chars
  if (!/^[A-Z0-9\-_.]+$/.test(normalized)) {
    return { isValid: false, error: 'Invalid asset symbol format' };
  }

  return { isValid: true, normalizedSymbol: normalized };
}

/**
 * Validates numeric value
 */
export function validateNumber(value: string, fieldName: string, allowNegative: boolean = false): { isValid: boolean; number?: number; error?: string } {
  if (!value || value.trim() === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }

  const cleaned = value.replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (!allowNegative && parsed < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative` };
  }

  return { isValid: true, number: parsed };
}

/**
 * Validates currency code
 */
export function validateCurrency(currency: string): { isValid: boolean; normalizedCurrency?: string; warning?: string } {
  if (!currency || currency.trim() === '') {
    return { isValid: false };
  }

  const normalized = currency.toUpperCase().trim();
  
  // Check if it's a known currency
  const isKnown = VALID_CURRENCIES.includes(normalized);
  
  return { 
    isValid: true, 
    normalizedCurrency: normalized,
    warning: !isKnown ? `Unknown currency code: ${normalized}. Please verify.` : undefined
  };
}

/**
 * Validates a complete transaction row
 */
export function validateTransaction(data: any, rowNumber: number): TransactionValidationResult {
  const errors: CSVError[] = [];
  
  // Validate date
  const dateResult = validateDate(data.date);
  if (!dateResult.isValid) {
    errors.push({
      row: rowNumber,
      column: 'date',
      message: dateResult.error || 'Invalid date',
      severity: 'error'
    });
  }

  // Validate transaction type
  const typeResult = validateTransactionType(data.type);
  if (!typeResult.isValid) {
    errors.push({
      row: rowNumber,
      column: 'type',
      message: typeResult.error || 'Invalid transaction type',
      severity: 'error'
    });
  }

  // Validate asset symbol
  const assetResult = validateAssetSymbol(data.assetSymbol);
  if (!assetResult.isValid) {
    errors.push({
      row: rowNumber,
      column: 'assetSymbol',
      message: assetResult.error || 'Invalid asset symbol',
      severity: 'error'
    });
  }

  // Validate quantity
  const quantityResult = validateNumber(data.quantity, 'Quantity', false);
  if (!quantityResult.isValid) {
    errors.push({
      row: rowNumber,
      column: 'quantity',
      message: quantityResult.error || 'Invalid quantity',
      severity: 'error'
    });
  }

  // Validate currency
  const currencyResult = validateCurrency(data.currency);
  if (!currencyResult.isValid) {
    errors.push({
      row: rowNumber,
      column: 'currency',
      message: 'Currency is required',
      severity: 'error'
    });
  } else if (currencyResult.warning) {
    errors.push({
      row: rowNumber,
      column: 'currency',
      message: currencyResult.warning,
      severity: 'warning'
    });
  }

  // Validate optional price per unit
  if (data.pricePerUnit) {
    const priceResult = validateNumber(data.pricePerUnit, 'Price per unit', false);
    if (!priceResult.isValid) {
      errors.push({
        row: rowNumber,
        column: 'pricePerUnit',
        message: priceResult.error || 'Invalid price',
        severity: 'error'
      });
    }
  }

  // Validate optional total value
  if (data.totalValue) {
    const totalResult = validateNumber(data.totalValue, 'Total value', false);
    if (!totalResult.isValid) {
      errors.push({
        row: rowNumber,
        column: 'totalValue',
        message: totalResult.error || 'Invalid total value',
        severity: 'error'
      });
    }
  }

  // Validate optional fee
  if (data.fee) {
    const feeResult = validateNumber(data.fee, 'Fee', false);
    if (!feeResult.isValid) {
      errors.push({
        row: rowNumber,
        column: 'fee',
        message: feeResult.error || 'Invalid fee',
        severity: 'error'
      });
    }
  }

  // Check if there are only errors (not warnings)
  const hasErrors = errors.some(e => e.severity === 'error');

  if (hasErrors) {
    return { isValid: false, errors };
  }

  // Build valid transaction object
  const transaction: ParsedTransaction = {
    date: dateResult.isoDate!,
    type: typeResult.normalizedType! as any,
    assetSymbol: assetResult.normalizedSymbol!,
    quantity: quantityResult.number!,
    currency: currencyResult.normalizedCurrency!,
  };

  // Add optional fields if present
  if (data.pricePerUnit) {
    const priceResult = validateNumber(data.pricePerUnit, 'Price', false);
    if (priceResult.isValid) {
      transaction.pricePerUnit = priceResult.number;
    }
  }

  if (data.totalValue) {
    const totalResult = validateNumber(data.totalValue, 'Total', false);
    if (totalResult.isValid) {
      transaction.totalValue = totalResult.number;
    }
  }

  if (data.fee) {
    const feeResult = validateNumber(data.fee, 'Fee', false);
    if (feeResult.isValid) {
      transaction.fee = feeResult.number;
    }
  }

  if (data.feeCurrency) {
    const feeCurrencyResult = validateCurrency(data.feeCurrency);
    if (feeCurrencyResult.isValid) {
      transaction.feeCurrency = feeCurrencyResult.normalizedCurrency;
    }
  }

  if (data.notes) {
    transaction.notes = data.notes.trim();
  }

  if (data.exchangeId) {
    transaction.exchangeId = data.exchangeId.trim();
  }

  if (data.walletAddress) {
    transaction.walletAddress = data.walletAddress.trim();
  }

  return { isValid: true, transaction, errors };
}
