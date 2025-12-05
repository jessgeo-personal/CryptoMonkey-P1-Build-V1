// ============================================
// DATABASE SERVICE EXPORTS
// ============================================

export { default as DatabaseService } from './DatabaseService';
export * from './schema';
export * from './repositories';

// Convenience function for app initialization
import DatabaseService from './DatabaseService';

export async function initializeDatabase(): Promise<void> {
  const dbService = DatabaseService.getInstance();
  await dbService.initialize();
}
