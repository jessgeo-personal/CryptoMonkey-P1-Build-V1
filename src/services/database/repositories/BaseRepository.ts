import * as SQLite from 'expo-sqlite';
import DatabaseService from '../DatabaseService';

// ============================================
// BASE REPOSITORY - Generic CRUD Operations
// ============================================

export abstract class BaseRepository<T> {
  protected db: SQLite.SQLiteDatabase;
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.db = DatabaseService.getInstance().getDatabase();
  }

  /**
   * Execute a raw SQL query
   */
  protected async executeQuery<R = any>(
    sql: string,
    params: any[] = []
  ): Promise<R[]> {
    try {
      const result = await this.db.getAllAsync<R>(sql, params);
      return result;
    } catch (error) {
      console.error(`❌ Query failed on ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Execute a raw SQL statement (INSERT, UPDATE, DELETE)
   */
  protected async executeStatement(
    sql: string,
    params: any[] = []
  ): Promise<SQLite.SQLiteRunResult> {
    try {
      const result = await this.db.runAsync(sql, params);
      return result;
    } catch (error) {
      console.error(`❌ Statement failed on ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Get first matching record
   */
  protected async getFirst<R = any>(
    sql: string,
    params: any[] = []
  ): Promise<R | null> {
    try {
      const result = await this.db.getFirstAsync<R>(sql, params);
      return result;
    } catch (error) {
      console.error(`❌ Get first failed on ${this.tableName}:`, error);
      throw error;
    }
  }

  /**
   * Find by ID
   */
  async findById(id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
    const result = await this.getFirst<T>(sql, [id]);
    return result;
  }

  /**
   * Find all records
   */
  async findAll(): Promise<T[]> {
    const sql = `SELECT * FROM ${this.tableName}`;
    return await this.executeQuery<T>(sql);
  }

  /**
   * Delete by ID
   */
  async deleteById(id: string): Promise<boolean> {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
    const result = await this.executeStatement(sql, [id]);
    return result.changes > 0;
  }

  /**
   * Count records
   */
  async count(whereClause?: string, params?: any[]): Promise<number> {
    const sql = whereClause
      ? `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause}`
      : `SELECT COUNT(*) as count FROM ${this.tableName}`;
    
    const result = await this.getFirst<{ count: number }>(sql, params);
    return result?.count || 0;
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.count('id = ?', [id]);
    return count > 0;
  }

  /**
   * Execute in transaction
   */
  protected async transaction<R>(
    callback: (db: SQLite.SQLiteDatabase) => Promise<R>
  ): Promise<R> {
    return await DatabaseService.getInstance().transaction(callback);
  }
}
