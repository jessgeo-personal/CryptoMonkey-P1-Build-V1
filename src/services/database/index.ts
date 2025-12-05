// ============================================
// DATABASE MODULE EXPORTS
// ============================================

export { default as DatabaseService } from './DatabaseService';
export * from './schema';

// Re-export for convenience
import DatabaseService from './DatabaseService';
export const initializeDatabase = async (): Promise<void> => {
  const dbService = DatabaseService.getInstance();
  await dbService.initialize();
};

export const getDatabase = () => {
  return DatabaseService.getInstance().getDatabase();
};

export const isDatabaseReady = (): boolean => {
  return DatabaseService.getInstance().isReady();
};
