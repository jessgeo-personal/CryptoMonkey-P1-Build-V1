import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, DROP_TABLES_SQL, SCHEMA_VERSION } from './schema';

// ============================================
// DATABASE SERVICE - CryptoMonkey Phase 1
// Singleton pattern for database access
// ============================================

class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database
   * Creates tables and runs migrations if needed
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ Database already initialized');
      return;
    }

    try {
      console.log('🔄 Initializing database...');
      
      // Open database
      this.db = await SQLite.openDatabaseAsync('cryptomonkey.db');
      
      console.log('📊 Creating tables...');
      
      // Create tables
      await this.db.execAsync(CREATE_TABLES_SQL);
      
      console.log('✅ Tables created successfully');
      
      // Check schema version
      const versionResult = await this.db.getFirstAsync<{ version: number }>(
        'SELECT version FROM schema_version WHERE id = 1'
      );
      
      console.log(`📌 Schema version: ${versionResult?.version || 'unknown'}`);
      
      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  /**
   * Get database instance
   * Throws error if not initialized
   */
  public getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Check if database is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Reset database (for development/testing only)
   * Drops all tables and recreates them
   */
  public async reset(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      console.log('🔄 Resetting database...');
      
      // Drop all tables
      await this.db.execAsync(DROP_TABLES_SQL);
      console.log('🗑️  Tables dropped');
      
      // Recreate tables
      await this.db.execAsync(CREATE_TABLES_SQL);
      console.log('✅ Tables recreated');
      
      this.isInitialized = true;
      console.log('✅ Database reset complete');
      
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      throw new Error(`Database reset failed: ${error}`);
    }
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      console.log('✅ Database connection closed');
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  public async transaction<T>(
    callback: (db: SQLite.SQLiteDatabase) => Promise<T>
  ): Promise<T> {
    const db = this.getDatabase();
    
    try {
      await db.execAsync('BEGIN TRANSACTION');
      const result = await callback(db);
      await db.execAsync('COMMIT');
      return result;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }
}

export default DatabaseService;
