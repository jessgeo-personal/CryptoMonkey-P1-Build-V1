import { BaseRepository } from './BaseRepository';
import { Transaction, Fee, TransactionType, TransactionSource } from '../../../types/models';

// ============================================
// TRANSACTION REPOSITORY
// ============================================

interface TransactionFilters {
  userId: string;
  startDate?: number;
  endDate?: number;
  source?: TransactionSource;
  type?: TransactionType;
  asset?: string;
  limit?: number;
  offset?: number;
}

class TransactionRepository extends BaseRepository<Transaction> {
  constructor() {
    super('transactions');
  }

  /**
   * Create a new transaction
   */
  async create(transaction: Transaction): Promise<Transaction> {
    const sql = `
      INSERT INTO transactions (
        id, user_id, timestamp, source, source_id, type, category,
        from_asset, from_quantity, from_location,
        to_asset, to_quantity, to_location,
        original_fiat_currency, original_fiat_value,
        fees, raw_data, parsing_notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      transaction.id,
      transaction.userId,
      transaction.timestamp,
      transaction.source,
      transaction.sourceId,
      transaction.type,
      transaction.category,
      transaction.fromAsset || null,
      transaction.fromQuantity || null,
      transaction.fromLocation || null,
      transaction.toAsset || null,
      transaction.toQuantity || null,
      transaction.toLocation || null,
      transaction.originalFiatCurrency,
      transaction.originalFiatValue || null,
      JSON.stringify(transaction.fees),
      transaction.rawData || null,
      transaction.parsingNotes || null,
      transaction.createdAt,
      transaction.updatedAt,
    ];

    await this.executeStatement(sql, params);
    console.log(`✅ Transaction created: ${transaction.id}`);
    return transaction;
  }

  /**
   * Update transaction
   */
  async update(transaction: Transaction): Promise<Transaction> {
    const sql = `
      UPDATE transactions SET
        timestamp = ?, source = ?, source_id = ?, type = ?, category = ?,
        from_asset = ?, from_quantity = ?, from_location = ?,
        to_asset = ?, to_quantity = ?, to_location = ?,
        original_fiat_currency = ?, original_fiat_value = ?,
        fees = ?, raw_data = ?, parsing_notes = ?,
        updated_at = ?
      WHERE id = ? AND user_id = ?
    `;

    const params = [
      transaction.timestamp,
      transaction.source,
      transaction.sourceId,
      transaction.type,
      transaction.category,
      transaction.fromAsset || null,
      transaction.fromQuantity || null,
      transaction.fromLocation || null,
      transaction.toAsset || null,
      transaction.toQuantity || null,
      transaction.toLocation || null,
      transaction.originalFiatCurrency,
      transaction.originalFiatValue || null,
      JSON.stringify(transaction.fees),
      transaction.rawData || null,
      transaction.parsingNotes || null,
      Date.now(),
      transaction.id,
      transaction.userId,
    ];

    const result = await this.executeStatement(sql, params);

    if (result.changes === 0) {
      throw new Error(`Transaction not found: ${transaction.id}`);
    }

    console.log(`✅ Transaction updated: ${transaction.id}`);
    return transaction;
  }

  /**
   * Find transactions with filters
   */
  async findByFilters(filters: TransactionFilters): Promise<Transaction[]> {
    let sql = `SELECT * FROM transactions WHERE user_id = ?`;
    const params: any[] = [filters.userId];

    // Add optional filters
    if (filters.startDate) {
      sql += ` AND timestamp >= ?`;
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      sql += ` AND timestamp <= ?`;
      params.push(filters.endDate);
    }

    if (filters.source) {
      sql += ` AND source = ?`;
      params.push(filters.source);
    }

    if (filters.type) {
      sql += ` AND type = ?`;
      params.push(filters.type);
    }

    if (filters.asset) {
      sql += ` AND (from_asset = ? OR to_asset = ?)`;
      params.push(filters.asset, filters.asset);
    }

    // Order by timestamp descending
    sql += ` ORDER BY timestamp DESC`;

    // Add pagination
    if (filters.limit) {
      sql += ` LIMIT ?`;
      params.push(filters.limit);

      if (filters.offset) {
        sql += ` OFFSET ?`;
        params.push(filters.offset);
      }
    }

    const results = await this.executeQuery(sql, params);
    return results.map(row => this.parseTransaction(row));
  }

  /**
   * Find transactions by user ID
   */
  async findByUserId(userId: string, limit?: number): Promise<Transaction[]> {
    return this.findByFilters({ userId, limit });
  }

  /**
   * Find transactions by asset
   */
  async findByAsset(userId: string, asset: string): Promise<Transaction[]> {
    return this.findByFilters({ userId, asset });
  }

  /**
   * Find transactions by source
   */
  async findBySource(userId: string, source: TransactionSource): Promise<Transaction[]> {
    return this.findByFilters({ userId, source });
  }

  /**
   * Get recent transactions
   */
  async getRecent(userId: string, limit: number = 50): Promise<Transaction[]> {
    return this.findByFilters({ userId, limit });
  }

  /**
   * Get transaction count by user
   */
  async countByUser(userId: string): Promise<number> {
    return this.count('user_id = ?', [userId]);
  }

  /**
   * Delete transactions by user ID
   */
  async deleteByUserId(userId: string): Promise<number> {
    const sql = `DELETE FROM transactions WHERE user_id = ?`;
    const result = await this.executeStatement(sql, [userId]);
    console.log(`✅ Deleted ${result.changes} transactions for user: ${userId}`);
    return result.changes;
  }

    /**
   * Batch insert transactions
   * @returns Number of transactions successfully inserted
   */
  async batchCreate(transactions: Transaction[]): Promise<number> {
    let insertedCount = 0;
    
    try {
      await this.transaction(async (db) => {
        for (const transaction of transactions) {
          await this.create(transaction);
          insertedCount++;
        }
      });
      console.log(`✅ Batch created ${insertedCount}/${transactions.length} transactions`);
      return insertedCount;
    } catch (error) {
      console.error(`❌ Batch creation failed after ${insertedCount} transactions:`, error);
      throw error;
    }
  }


  /**
   * Get transaction by ID with parsed data
   */
  async findById(id: string): Promise<Transaction | null> {
    const result = await super.findById(id);
    
    if (!result) {
      return null;
    }

    return this.parseTransaction(result);
  }

  /**
   * Parse transaction from database row
   */
  private parseTransaction(row: any): Transaction {
    return {
      id: row.id,
      userId: row.user_id,
      timestamp: row.timestamp,
      source: row.source,
      sourceId: row.source_id,
      type: row.type,
      category: row.category,
      fromAsset: row.from_asset,
      fromQuantity: row.from_quantity,
      fromLocation: row.from_location,
      toAsset: row.to_asset,
      toQuantity: row.to_quantity,
      toLocation: row.to_location,
      originalFiatCurrency: row.original_fiat_currency,
      originalFiatValue: row.original_fiat_value,
      fees: JSON.parse(row.fees) as Fee[],
      rawData: row.raw_data,
      parsingNotes: row.parsing_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Singleton instance - lazy initialization
let instance: TransactionRepository | null = null;

export function getTransactionRepository(): TransactionRepository {
  if (!instance) {
    instance = new TransactionRepository();
  }
  return instance;
}

export default getTransactionRepository;

