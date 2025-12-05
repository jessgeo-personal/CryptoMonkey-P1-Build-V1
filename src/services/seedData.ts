import { getUserRepository } from './database/repositories/UserRepository';
import { getTransactionRepository } from './database/repositories/TransactionRepository';
import { getHoldingRepository } from './database/repositories/HoldingRepository';
import {
  generateMockUser,
  generateMockTransactions,
  generateMockHoldings,
  generateBuyTransaction,
  generateSellTransaction,
} from '../utils/mockData';

// ============================================
// DATA SEEDING SERVICE
// ============================================

/**
 * Seed database with test data
 */
export async function seedTestData(): Promise<void> {
  console.log('🌱 Starting data seeding...');

  try {
    const userRepo = getUserRepository();
    const transactionRepo = getTransactionRepository();
    const holdingRepo = getHoldingRepository();

    // Get or create default user
    let user = await userRepo.getOrCreateDefaultUser();
    console.log(`✅ User ready: ${user.id}`);

    // Check if data already exists
    const existingTxCount = await transactionRepo.countByUser(user.id);
    const existingHoldingCount = await holdingRepo.countByUser(user.id);

    if (existingTxCount > 0 || existingHoldingCount > 0) {
      console.log(`📊 Data already exists (${existingTxCount} txs, ${existingHoldingCount} holdings)`);
      console.log('💡 Skip seeding or delete existing data first');
      return;
    }

    // Generate realistic transactions
    console.log('💰 Creating sample transactions...');
    
    const transactions = [
      // BTC purchases
      generateBuyTransaction(user.id, 'BTC', 0.5, 45000),
      generateBuyTransaction(user.id, 'BTC', 0.3, 47000),
      
      // ETH purchases
      generateBuyTransaction(user.id, 'ETH', 2, 3000),
      generateBuyTransaction(user.id, 'ETH', 1.5, 3200),
      
      // Stablecoin purchases
      generateBuyTransaction(user.id, 'USDT', 5000, 1),
      generateBuyTransaction(user.id, 'USDC', 3000, 1),
      
      // Some sells
      generateSellTransaction(user.id, 'BTC', 0.1, 48000),
      generateSellTransaction(user.id, 'ETH', 0.5, 3500),
    ];

    // Add timestamps spread over the last 30 days
    transactions.forEach((tx, index) => {
      tx.timestamp = Date.now() - (30 - index * 3) * 24 * 60 * 60 * 1000;
    });

    // Batch create transactions
    await transactionRepo.batchCreate(transactions);
    console.log(`✅ Created ${transactions.length} transactions`);

    // Generate holdings
    console.log('💎 Creating sample holdings...');
    
    const holdings = generateMockHoldings(user.id, 5);
    
    for (const holding of holdings) {
      await holdingRepo.create(holding);
    }
    
    console.log(`✅ Created ${holdings.length} holdings`);

    console.log('🎉 Data seeding complete!');
    
  } catch (error) {
    console.error('❌ Data seeding failed:', error);
    throw error;
  }
}

/**
 * Clear all user data
 */
export async function clearAllData(userId: string): Promise<void> {
  console.log('🗑️  Clearing all data...');

  try {
    const transactionRepo = getTransactionRepository();
    const holdingRepo = getHoldingRepository();

    const txDeleted = await transactionRepo.deleteByUserId(userId);
    const holdingsDeleted = await holdingRepo.deleteByUserId(userId);

    console.log(`✅ Deleted ${txDeleted} transactions, ${holdingsDeleted} holdings`);
  } catch (error) {
    console.error('❌ Clear data failed:', error);
    throw error;
  }
}
