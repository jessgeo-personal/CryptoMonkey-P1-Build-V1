import { ParsedTransaction } from './csv.types';

export interface ImportSource {
  type: 'WALLET' | 'CEX' | 'DEFI' | 'OTHER';
  name: string;
  identifier?: string; // wallet address, exchange name, etc.
}

export interface ImportSummary {
  totalTransactions: number;
  dateRange: {
    from: string;
    to: string;
  };
  assets: string[];
  transactionTypes: string[];
  currencies: string[];
  totalFeeAmount: number;
  duplicateWarnings: DuplicateWarning[];
}

export interface DuplicateWarning {
  csvRow: number;
  csvData: ParsedTransaction;
  existingTransaction: {
    id: string;
    date: string;
    type: string;
    asset: string;
    quantity: number;
  };
  similarity: 'exact' | 'high' | 'medium';
}

export interface TransactionForImport {
  transaction: Transaction;
  rowNumber: number;
  isDuplicate: boolean;
  duplicateMatch?: string; // ID of matching transaction
}

export interface ImportResult {
  success: boolean;
  insertedCount: number;
  skippedCount: number;
  errors: ImportError[];
  insertedTransactionIds: string[];
  failedTransactionIds: string[];
}

export interface ImportError {
  rowNumber: number;
  transactionData: ParsedTransaction;
  error: string;
}

// Re-export for convenience
export type { ParsedTransaction } from './csv.types';
