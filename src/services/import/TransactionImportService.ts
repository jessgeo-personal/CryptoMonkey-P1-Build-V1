import { v4 as uuidv4 } from 'uuid';
import {
  ParsedTransaction,
  ImportSource,
  ImportSummary,
  DuplicateWarning,
  ImportResult,
  ImportError,
} from '../../types/import.types';
import { Transaction, Fee, TransactionType, TransactionCategory, TransactionSource } from '../../types/models';
import { getTransactionRepository } from '../database/repositories/TransactionRepository';

// ============================================
// TRANSACTION IMPORT SERVICE
// ============================================

class TransactionImportService {
  private transactionRepo = getTransactionRepository();

  /**
   * Generate import summary from parsed transactions
   */
  generateSummary(parsedTransactions: ParsedTransaction[]): ImportSummary {
    if (parsedTransactions.length === 0) {
      return {
        totalTransactions: 0,
        dateRange: { from: '', to: '' },
        assets: [],
        transactionTypes: [],
        currencies: [],
        totalFeeAmount: 0,
        duplicateWarnings: [],
      };
    }

    // Extract unique values
    const assets = Array.from(new Set(parsedTransactions.map(t => t.assetSymbol)));
    const types = Array.from(new Set(parsedTransactions.map(t => t.type)));
    const currencies = Array.from(new Set(parsedTransactions.map(t => t.currency)));

    // Date range
    const dates = parsedTransactions
      .map(t => new Date(t.date).getTime())
      .sort((a, b) => a - b);
    const fromDate = new Date(dates[0]).toLocaleDateString();
    const toDate = new Date(dates[dates.length - 1]).toLocaleDateString();

    // Total fees
    const totalFeeAmount = parsedTransactions.reduce((sum, t) => sum + (t.fee || 0), 0);

    return {
      totalTransactions: parsedTransactions.length,
      dateRange: { from: fromDate, to: toDate },
      assets,
      transactionTypes: types,
      currencies,
      totalFeeAmount,
      duplicateWarnings: [], // Populated later if duplicate checking enabled
    };
  }

  /**
   * Check for duplicate transactions (simple version for Phase 2)
   * Phase 3 will have full user review
   */
  async checkForDuplicates(
    userId: string,
    parsedTransactions: ParsedTransaction[]
  ): Promise<DuplicateWarning[]> {
    const warnings: DuplicateWarning[] = [];

    // Get all existing transactions for user
    const existingTransactions = await this.transactionRepo.findByUserId(userId, 10000);

    parsedTransactions.forEach((parsed, index) => {
      existingTransactions.forEach(existing => {
        // Check for exact or near match
        const dateMatch = this.normalizeDate(parsed.date) === this.normalizeDate(existing.timestamp.toString());
        const typeMatch = parsed.type === existing.type;
        const assetMatch =
          (parsed.assetSymbol === existing.fromAsset && parsed.quantity === existing.fromQuantity) ||
          (parsed.assetSymbol === existing.toAsset && parsed.quantity === existing.toQuantity);

        if (dateMatch && typeMatch && assetMatch) {
          warnings.push({
            csvRow: index + 1,
            csvData: parsed,
            existingTransaction: {
              id: existing.id,
              date: new Date(existing.timestamp).toLocaleDateString(),
              type: existing.type,
              asset: existing.fromAsset || existing.toAsset || 'unknown',
              quantity: existing.fromQuantity || existing.toQuantity || 0,
            },
            similarity: 'exact',
          });
        }
      });
    });

    return warnings;
  }

  /**
   * Convert ParsedTransaction to Transaction model
   * Includes fee calculation into cost basis
   */
  convertToTransaction(
    parsed: ParsedTransaction,
    userId: string,
    importSource: ImportSource
  ): Transaction {
    const now = Date.now();
    const transactionDate = new Date(parsed.date).getTime();

    // Determine transaction type and category
    const { type, category } = this.mapTransactionType(parsed.type);

    // Calculate fees
    const fees: Fee[] = [];
    if (parsed.fee && parsed.fee > 0) {
      fees.push({
        type: 'trading',
        amount: parsed.fee,
        currency: parsed.feeCurrency || parsed.currency,
        fiatValue: parsed.fee, // Simplified - in Phase 3, convert to fiat
      });
    }

    // Calculate actual cost (including fees)
    // For BUY: Cost = (Price × Qty) + Fee
    // For SELL: Proceeds = (Price × Qty) - Fee
    const effectivePrice = this.calculateEffectivePrice(
      parsed.quantity,
      parsed.pricePerUnit,
      parsed.fee || 0,
      type
    );

    const costBasisValue = effectivePrice * parsed.quantity;

    // Build transaction
    const transaction: Transaction = {
      id: uuidv4(),
      userId,
      timestamp: transactionDate,
      source: importSource.type as TransactionSource,
      sourceId: importSource.identifier || importSource.name,
      type,
      category,
      fromAsset: type === 'buy' ? undefined : parsed.assetSymbol,
      fromQuantity: type === 'buy' ? undefined : parsed.quantity,
      fromLocation: importSource.name,
      toAsset: type === 'buy' ? parsed.assetSymbol : undefined,
      toQuantity: type === 'buy' ? parsed.quantity : undefined,
      toLocation: importSource.name,
      originalFiatCurrency: (parsed.currency as any) || 'USD',
      originalFiatValue: costBasisValue,
      fees,
      rawData: JSON.stringify(parsed),
      parsingNotes: `Imported from CSV: ${parsed.notes || 'No notes'}`,
      createdAt: now,
      updatedAt: now,
    };

    return transaction;
  }

  /**
   * Calculate effective price including fees
   * For BUY: effective price increases by fee
   * For SELL: effective price decreases by fee
   */
  private calculateEffectivePrice(
    quantity: number,
    pricePerUnit: number | undefined,
    fee: number,
    transactionType: TransactionType
  ): number {
    if (!pricePerUnit) {
      return 0;
    }

    // Base price
    let effectivePrice = pricePerUnit;

    // Adjust for fees
    if (fee > 0 && quantity > 0) {
      const feePerUnit = fee / quantity;

      if (transactionType === 'buy') {
        // Buying: fee increases cost per unit
        effectivePrice += feePerUnit;
      } else if (transactionType === 'sell') {
        // Selling: fee decreases proceeds per unit
        effectivePrice -= feePerUnit;
      }
      // For other types (transfer, swap), fees are tracked but not in price
    }

    return effectivePrice;
  }

  /**
   * Map CSV transaction types to app types and categories
   */
  private mapTransactionType(csvType: string): { type: TransactionType; category: TransactionCategory } {
    const typeMap: {
      [key: string]: { type: TransactionType; category: TransactionCategory };
    } = {
      buy: { type: 'buy', category: 'fiat_to_crypto' },
      sell: { type: 'sell', category: 'crypto_to_fiat' },
      swap: { type: 'swap', category: 'crypto_to_crypto' },
      transfer_in: { type: 'transfer', category: 'transfer_in' },
      transfer_out: { type: 'transfer', category: 'transfer_out' },
      deposit: { type: 'deposit', category: 'transfer_in' },
      withdrawal: { type: 'withdrawal', category: 'transfer_out' },
    };

    return typeMap[csvType] || { type: 'buy', category: 'crypto_to_crypto' };
  }

  /**
   * Normalize date for comparison (YYYY-MM-DD)
   */
  private normalizeDate(dateStr: string | number): string {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  /**
   * Execute the import
   */
  async executeImport(
    userId: string,
    parsedTransactions: ParsedTransaction[],
    importSource: ImportSource
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      insertedCount: 0,
      skippedCount: 0,
      errors: [],
      insertedTransactionIds: [],
      failedTransactionIds: [],
    };

    if (parsedTransactions.length === 0) {
      result.success = true;
      return result;
    }

    try {
      // Convert all parsed transactions to Transaction model
      const transactionsToInsert: Transaction[] = [];
      const conversionErrors: ImportError[] = [];

      parsedTransactions.forEach((parsed, index) => {
        try {
          const transaction = this.convertToTransaction(parsed, userId, importSource);
          transactionsToInsert.push(transaction);
        } catch (error) {
          conversionErrors.push({
            rowNumber: index + 1,
            transactionData: parsed,
            error: error instanceof Error ? error.message : 'Unknown conversion error',
          });
        }
      });

      result.errors.push(...conversionErrors);
      result.skippedCount = conversionErrors.length;

      // Batch insert to database
      if (transactionsToInsert.length > 0) {
        try {
          const insertedCount = await this.transactionRepo.batchCreate(transactionsToInsert);
          result.insertedCount = insertedCount;
          result.insertedTransactionIds = transactionsToInsert.map(t => t.id);
          result.success = true;
        } catch (dbError) {
          result.success = false;
          result.errors.push({
            rowNumber: 0,
            transactionData: parsedTransactions[0],
            error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
          });
        }
      } else {
        result.success = false;
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push({
        rowNumber: 0,
        transactionData: parsedTransactions[0],
        error: error instanceof Error ? error.message : 'Unknown import error',
      });
      return result;
    }
  }
}

// Singleton instance
let instance: TransactionImportService | null = null;

export function getTransactionImportService(): TransactionImportService {
  if (!instance) {
    instance = new TransactionImportService();
  }
  return instance;
}

export default getTransactionImportService;
