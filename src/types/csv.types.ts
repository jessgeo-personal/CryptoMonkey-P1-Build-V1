// CSV Import Types
export interface CSVRow {
  [key: string]: string;
}

export interface CSVParseResult {
  success: boolean;
  data: CSVRow[];
  errors: CSVError[];
  headers: string[];
  rowCount: number;
}

export interface CSVError {
  row: number;
  column?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParsedTransaction {
  date: string; // ISO format
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'swap';
  assetSymbol: string;
  quantity: number;
  pricePerUnit?: number;
  totalValue?: number;
  currency: string;
  fee?: number;
  feeCurrency?: string;
  notes?: string;
  exchangeId?: string;
  walletAddress?: string;
}

export interface TransactionValidationResult {
  isValid: boolean;
  transaction?: ParsedTransaction;
  errors: CSVError[];
}

export interface CSVColumnMapping {
  date: string;
  type: string;
  assetSymbol: string;
  quantity: string;
  pricePerUnit?: string;
  totalValue?: string;
  currency: string;
  fee?: string;
  feeCurrency?: string;
  notes?: string;
  exchangeId?: string;
  walletAddress?: string;
}

export interface CSVImportConfig {
  delimiter?: string;
  hasHeaders?: boolean;
  skipEmptyLines?: boolean;
  trimFields?: boolean;
}
