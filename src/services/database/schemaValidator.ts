// FILE: src/services/database/schemaValidator.ts
// NEW FILE - Schema validation helper

import DatabaseService from './DatabaseService';
import type { SQLiteDatabase } from 'expo-sqlite';

// ============================================
// SCHEMA VALIDATOR - Debug Helper
// ============================================

class SchemaValidator {
  /**
   * Verify all required tables exist
   */
  static async validateSchema(): Promise<{
    valid: boolean;
    tables: { [key: string]: boolean };
    errors: string[];
  }> {
    const requiredTables = [
      'users',
      'transactions',
      'holdings',
      'liquidity_pool_positions',
      'nft_holdings',
      'exchange_rates',
      'tokens',           // ✅ NEW
      'account_tokens',   // ✅ NEW
      'schema_version',
    ];

    const results: { [key: string]: boolean } = {};
    const errors: string[] = [];

    try {
      const db = DatabaseService.getInstance().getDatabase();

      for (const table of requiredTables) {
        try {
          const result = await db.getFirstAsync(
            `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
            [table]
          );
          results[table] = result !== null;

          if (!result) {
            errors.push(`❌ Missing table: ${table}`);
          } else {
            console.log(`✅ Table exists: ${table}`);
          }
        } catch (error) {
          results[table] = false;
          errors.push(`⚠️ Error checking table ${table}: ${error}`);
        }
      }

      const allValid = Object.values(results).every(v => v === true);

      return {
        valid: allValid,
        tables: results,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        tables: {},
        errors: [`Failed to validate schema: ${error}`],
      };
    }
  }

  /**
   * Verify token tables have correct columns
   */
  static async validateTokenTables(): Promise<{
    valid: boolean;
    tokensColumns: string[];
    accountTokensColumns: string[];
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      const db = DatabaseService.getInstance().getDatabase();

      // Check tokens table columns using PRAGMA
      const tokensInfo = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(tokens)'
      );
      const tokensColumns = tokensInfo.map((col: any) => col.name);

      // Check account_tokens table columns using PRAGMA
      const accountTokensInfo = await db.getAllAsync<{ name: string }>(
        'PRAGMA table_info(account_tokens)'
      );
      const accountTokensColumns = accountTokensInfo.map((col: any) => col.name);
      // Validate required columns
      const requiredTokensColumns = [
        'id',
        'symbol',
        'name',
        'network',
        'decimals',
        'category',
        'is_stablecoin',
        'is_active',
      ];

      const requiredAccountTokensColumns = [
        'id',
        'account_id',
        'token_id',
        'is_enabled',
        'priority',
      ];

      for (const col of requiredTokensColumns) {
        if (!tokensColumns.includes(col)) {
          errors.push(`❌ Missing column in tokens table: ${col}`);
        }
      }

      for (const col of requiredAccountTokensColumns) {
        if (!accountTokensColumns.includes(col)) {
          errors.push(`❌ Missing column in account_tokens table: ${col}`);
        }
      }

      if (errors.length === 0) {
        console.log('✅ Tokens table columns: OK');
        console.log('✅ Account tokens table columns: OK');
      }

      return {
        valid: errors.length === 0,
        tokensColumns,
        accountTokensColumns,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        tokensColumns: [],
        accountTokensColumns: [],
        errors: [`Failed to validate token tables: ${error}`],
      };
    }
  }

  /**
   * Full schema validation with logging
   */
  static async fullValidation(): Promise<boolean> {
    console.log('\n========================================');
    console.log('🔍 FULL SCHEMA VALIDATION');
    console.log('========================================\n');

    // Step 1: Validate table existence
    console.log('Step 1: Checking table existence...');
    const tableValidation = await this.validateSchema();
    
    if (!tableValidation.valid) {
      console.error('❌ Table validation failed:');
      tableValidation.errors.forEach(err => console.error(err));
      return false;
    }
    console.log('✅ All required tables exist\n');

    // Step 2: Validate token table columns
    console.log('Step 2: Checking token table columns...');
    const columnValidation = await this.validateTokenTables();
    
    if (!columnValidation.valid) {
      console.error('❌ Column validation failed:');
      columnValidation.errors.forEach(err => console.error(err));
      return false;
    }
    console.log('✅ All token table columns exist\n');

    // Step 3: Count records (optional)
    try {
      const db = DatabaseService.getInstance().getDatabase();
      const tokenCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM tokens'
      );
      console.log(`📊 Tokens in database: ${tokenCount?.count || 0}\n`);
    } catch (error) {
      console.log('⚠️ Could not count tokens (table may be empty)\n');
    }

    console.log('========================================');
    console.log('✅ SCHEMA VALIDATION PASSED');
    console.log('========================================\n');

    return true;
  }
}

export default SchemaValidator;
