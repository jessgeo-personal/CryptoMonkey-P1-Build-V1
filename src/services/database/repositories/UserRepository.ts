import { BaseRepository } from './BaseRepository';
import { User, UserSettings } from '../../../types/models';

// ============================================
// USER REPOSITORY
// ============================================

class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users');
  }

  /**
   * Create a new user
   */
  async create(user: User): Promise<User> {
    const sql = `
      INSERT INTO users (id, created_at, base_currency, timezone, settings)
      VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      user.id,
      user.createdAt,
      user.baseCurrency,
      user.timezone,
      JSON.stringify(user.settings),
    ];

    await this.executeStatement(sql, params);
    console.log(`✅ User created: ${user.id}`);
    return user;
  }

  /**
   * Update user
   */
  async update(user: User): Promise<User> {
    const sql = `
      UPDATE users 
      SET base_currency = ?, timezone = ?, settings = ?
      WHERE id = ?
    `;

    const params = [
      user.baseCurrency,
      user.timezone,
      JSON.stringify(user.settings),
      user.id,
    ];

    const result = await this.executeStatement(sql, params);

    if (result.changes === 0) {
      throw new Error(`User not found: ${user.id}`);
    }

    console.log(`✅ User updated: ${user.id}`);
    return user;
  }

  /**
   * Get user by ID with parsed settings
   */
  async findById(id: string): Promise<User | null> {
    const result = await super.findById(id);
    
    if (!result) {
      return null;
    }

    return this.parseUser(result);
  }

  /**
   * Update user settings only
   */
  async updateSettings(userId: string, settings: UserSettings): Promise<void> {
    const sql = `UPDATE users SET settings = ? WHERE id = ?`;
    const params = [JSON.stringify(settings), userId];

    const result = await this.executeStatement(sql, params);

    if (result.changes === 0) {
      throw new Error(`User not found: ${userId}`);
    }

    console.log(`✅ User settings updated: ${userId}`);
  }

  /**
   * Get or create default user
   */
  async getOrCreateDefaultUser(): Promise<User> {
    const existingUsers = await this.findAll();
    
    if (existingUsers.length > 0) {
      return this.parseUser(existingUsers[0]);
    }

    // Create default user
    const defaultUser: User = {
      id: 'default-user',
      createdAt: Date.now(),
      baseCurrency: 'USD',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      settings: {
        notifications: {
          lpOutOfRange: true,
          priceAlerts: true,
          transactionUpdates: true,
        },
        privacy: {
          analyticsEnabled: false,
          crashReportsEnabled: false,
        },
        display: {
          showZeroBalances: false,
          compactView: false,
        },
      },
    };

    return await this.create(defaultUser);
  }

  /**
   * Parse user from database row
   */
  private parseUser(row: any): User {
    return {
      id: row.id,
      createdAt: row.created_at,
      baseCurrency: row.base_currency,
      timezone: row.timezone,
      settings: JSON.parse(row.settings),
    };
  }
}

// Singleton instance - lazy initialization
let instance: UserRepository | null = null;

export function getUserRepository(): UserRepository {
  if (!instance) {
    instance = new UserRepository();
  }
  return instance;
}

export default getUserRepository;

