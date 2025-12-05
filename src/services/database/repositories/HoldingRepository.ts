import { BaseRepository } from './BaseRepository';
import { Holding, CostBasisData, LocationType, NetworkType } from '../../../types/models';

// ============================================
// HOLDING REPOSITORY
// ============================================

interface HoldingFilters {
  userId: string;
  asset?: string;
  location?: LocationType;
  locationId?: string;
  network?: NetworkType;
}

class HoldingRepository extends BaseRepository<Holding> {
  constructor() {
    super('holdings');
  }

  /**
   * Create a new holding
   */
  async create(holding: Holding): Promise<Holding> {
    const sql = `
      INSERT INTO holdings (
        id, user_id, asset, quantity, location, location_id, network,
        cost_basis_data, last_updated, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      holding.id,
      holding.userId,
      holding.asset,
      holding.quantity,
      holding.location,
      holding.locationId,
      holding.network || null,
      JSON.stringify(holding.costBasisData),
      holding.lastUpdated,
      holding.createdAt,
    ];

    await this.executeStatement(sql, params);
    console.log(`✅ Holding created: ${holding.id} (${holding.asset})`);
    return holding;
  }

  /**
   * Update holding
   */
  async update(holding: Holding): Promise<Holding> {
    const sql = `
      UPDATE holdings SET
        quantity = ?, cost_basis_data = ?, last_updated = ?
      WHERE id = ? AND user_id = ?
    `;

    const params = [
      holding.quantity,
      JSON.stringify(holding.costBasisData),
      Date.now(),
      holding.id,
      holding.userId,
    ];

    const result = await this.executeStatement(sql, params);

    if (result.changes === 0) {
      throw new Error(`Holding not found: ${holding.id}`);
    }

    console.log(`✅ Holding updated: ${holding.id}`);
    return holding;
  }

  /**
   * Find holdings by filters
   */
  async findByFilters(filters: HoldingFilters): Promise<Holding[]> {
    let sql = `SELECT * FROM holdings WHERE user_id = ?`;
    const params: any[] = [filters.userId];

    if (filters.asset) {
      sql += ` AND asset = ?`;
      params.push(filters.asset);
    }

    if (filters.location) {
      sql += ` AND location = ?`;
      params.push(filters.location);
    }

    if (filters.locationId) {
      sql += ` AND location_id = ?`;
      params.push(filters.locationId);
    }

    if (filters.network) {
      sql += ` AND network = ?`;
      params.push(filters.network);
    }

    sql += ` ORDER BY quantity DESC`;

    const results = await this.executeQuery(sql, params);
    return results.map(row => this.parseHolding(row));
  }

  /**
   * Find holdings by user ID
   */
  async findByUserId(userId: string): Promise<Holding[]> {
    return this.findByFilters({ userId });
  }

  /**
   * Find holdings by asset
   */
  async findByAsset(userId: string, asset: string): Promise<Holding[]> {
    return this.findByFilters({ userId, asset });
  }

  /**
   * Find holdings by location
   */
  async findByLocation(userId: string, location: LocationType, locationId?: string): Promise<Holding[]> {
    return this.findByFilters({ userId, location, locationId });
  }

  /**
   * Find or create holding
   */
  async findOrCreate(
    userId: string,
    asset: string,
    locationId: string,
    network?: NetworkType
  ): Promise<Holding> {
    // Try to find existing holding
    const sql = `
      SELECT * FROM holdings 
      WHERE user_id = ? AND asset = ? AND location_id = ? 
      ${network ? 'AND network = ?' : 'AND network IS NULL'}
      LIMIT 1
    `;
    
    const params = network ? [userId, asset, locationId, network] : [userId, asset, locationId];
    const existing = await this.getFirst(sql, params);

    if (existing) {
      return this.parseHolding(existing);
    }

    // Create new holding
    const newHolding: Holding = {
      id: `holding-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      asset,
      quantity: 0,
      location: 'cex', // Default, should be determined by caller
      locationId,
      network,
      costBasisData: {},
      lastUpdated: Date.now(),
      createdAt: Date.now(),
    };

    return await this.create(newHolding);
  }

  /**
   * Update holding quantity
   */
  async updateQuantity(id: string, quantity: number): Promise<void> {
    const sql = `UPDATE holdings SET quantity = ?, last_updated = ? WHERE id = ?`;
    const params = [quantity, Date.now(), id];

    const result = await this.executeStatement(sql, params);

    if (result.changes === 0) {
      throw new Error(`Holding not found: ${id}`);
    }

    console.log(`✅ Holding quantity updated: ${id} -> ${quantity}`);
  }

  /**
   * Delete holdings by user ID
   */
  async deleteByUserId(userId: string): Promise<number> {
    const sql = `DELETE FROM holdings WHERE user_id = ?`;
    const result = await this.executeStatement(sql, [userId]);
    console.log(`✅ Deleted ${result.changes} holdings for user: ${userId}`);
    return result.changes;
  }

  /**
   * Delete zero-balance holdings
   */
  async deleteZeroBalances(userId: string): Promise<number> {
    const sql = `DELETE FROM holdings WHERE user_id = ? AND quantity = 0`;
    const result = await this.executeStatement(sql, [userId]);
    console.log(`✅ Deleted ${result.changes} zero-balance holdings`);
    return result.changes;
  }

  /**
   * Get total holdings count by user
   */
  async countByUser(userId: string): Promise<number> {
    return this.count('user_id = ?', [userId]);
  }

  /**
   * Get holding by ID with parsed data
   */
  async findById(id: string): Promise<Holding | null> {
    const result = await super.findById(id);
    
    if (!result) {
      return null;
    }

    return this.parseHolding(result);
  }

  /**
   * Parse holding from database row
   */
  private parseHolding(row: any): Holding {
    return {
      id: row.id,
      userId: row.user_id,
      asset: row.asset,
      quantity: row.quantity,
      location: row.location,
      locationId: row.location_id,
      network: row.network,
      costBasisData: JSON.parse(row.cost_basis_data) as CostBasisData,
      lastUpdated: row.last_updated,
      createdAt: row.created_at,
    };
  }
}

// Singleton instance - lazy initialization
let instance: HoldingRepository | null = null;

export function getHoldingRepository(): HoldingRepository {
  if (!instance) {
    instance = new HoldingRepository();
  }
  return instance;
}

export default getHoldingRepository;

