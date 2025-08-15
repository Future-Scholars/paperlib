import sqlite3 from 'sqlite3';
import { Supplement, SupplementType } from '../models';
import { BaseRepository } from '../repository';

export class SupplementRepository extends BaseRepository<Supplement> {
  constructor(db: sqlite3.Database) {
    super(db, 'supplements', 'supplement_field_versions');
  }

  // CRDT-friendly create with field versioning
  async createSupplement(supplement: Omit<Supplement, 'createdAt' | 'updatedAt' | 'createdByDeviceId'>, deviceId: string): Promise<void> {
    await this.create(supplement as Supplement, deviceId);
  }

  // CRDT-friendly update specific fields
  async updateSupplementField(id: string, field: keyof Supplement, value: any, deviceId: string): Promise<void> {
    await this.updateField(id, field, value, deviceId);
  }

  // CRDT-friendly soft delete
  async deleteSupplement(id: string, deviceId: string): Promise<void> {
    await this.softDelete(id, deviceId);
  }

  // CRDT-friendly restore
  async restoreSupplement(id: string, deviceId: string): Promise<void> {
    await this.restore(id, deviceId);
  }

  // Get supplements by paper
  async getByPaper(paperId: string, includeDeleted: boolean = false): Promise<Supplement[]> {
    const whereClause = includeDeleted 
      ? 'WHERE paperId = ?' 
      : 'WHERE paperId = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM supplements ${whereClause}`, [paperId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get supplements by type
  async getByType(type: SupplementType, paperId?: string, includeDeleted: boolean = false): Promise<Supplement[]> {
    let whereClause = 'WHERE type = ?';
    const params: any[] = [type];
    
    if (paperId) {
      whereClause += ' AND paperId = ?';
      params.push(paperId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM supplements ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get supplements by name
  async getByName(name: string, paperId?: string, includeDeleted: boolean = false): Promise<Supplement[]> {
    let whereClause = 'WHERE name LIKE ?';
    const params: any[] = [`%${name}%`];
    
    if (paperId) {
      whereClause += ' AND paperId = ?';
      params.push(paperId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM supplements ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Search supplements
  async searchSupplements(query: string, paperId?: string, includeDeleted: boolean = false): Promise<Supplement[]> {
    let whereClause = 'WHERE (name LIKE ? OR description LIKE ? OR value LIKE ?)';
    const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`];
    
    if (paperId) {
      whereClause += ' AND paperId = ?';
      params.push(paperId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM supplements ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get supplements with pagination
  async getSupplementsWithPagination(
    offset: number, 
    limit: number, 
    paperId?: string, 
    type?: SupplementType,
    includeDeleted: boolean = false
  ): Promise<{ supplements: Supplement[]; total: number }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (paperId) {
      whereClause = 'WHERE paperId = ?';
      params.push(paperId);
    }
    
    if (type) {
      whereClause += whereClause ? ' AND type = ?' : 'WHERE type = ?';
      params.push(type);
    }
    
    if (!includeDeleted) {
      whereClause += whereClause ? ' AND deletedAt IS NULL' : 'WHERE deletedAt IS NULL';
    }
    
    // Get total count
    const countRow = await this.dbGet(`SELECT COUNT(*) as total FROM supplements ${whereClause}`, params);
    const total = countRow.total;
    
    // Get supplements with pagination
    const rows = await this.dbAll(
      `SELECT * FROM supplements ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    const supplements = rows.map(row => this.rowToEntity(row));
    
    return { supplements, total };
  }

  // Get supplement statistics
  async getStatistics(paperId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    withDescription: number;
    active: number;
    deleted: number;
  }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (paperId) {
      whereClause = 'WHERE paperId = ?';
      params.push(paperId);
    }
    
    // Total count
    const totalRow = await this.dbGet(`SELECT COUNT(*) as total FROM supplements ${whereClause}`, params);
    const total = totalRow.total;
    
    // By type
    const typeRows = await this.dbAll(
      `SELECT type, COUNT(*) as count FROM supplements ${whereClause} AND deletedAt IS NULL GROUP BY type`,
      params
    );
    const byType: Record<string, number> = {};
    typeRows.forEach(row => { byType[row.type] = row.count; });
    
    // With description
    const descriptionRow = await this.dbGet(
      `SELECT COUNT(*) as total FROM supplements ${whereClause} AND deletedAt IS NULL AND description IS NOT NULL`,
      params
    );
    const withDescription = descriptionRow.total;
    
    // Active count
    const activeWhereClause = whereClause ? `${whereClause} AND deletedAt IS NULL` : 'WHERE deletedAt IS NULL';
    const activeRow = await this.dbGet(`SELECT COUNT(*) as total FROM supplements ${activeWhereClause}`, params);
    const active = activeRow.total;
    
    // Deleted count
    const deletedWhereClause = whereClause ? `${whereClause} AND deletedAt IS NOT NULL` : 'WHERE deletedAt IS NOT NULL';
    const deletedRow = await this.dbGet(`SELECT COUNT(*) as total FROM supplements ${deletedWhereClause}`, params);
    const deleted = deletedRow.total;
    
    return {
      total,
      byType,
      withDescription,
      active,
      deleted
    };
  }

  // Get supplements by value pattern
  async getByValuePattern(pattern: string, paperId?: string, includeDeleted: boolean = false): Promise<Supplement[]> {
    let whereClause = 'WHERE value LIKE ?';
    const params: any[] = [pattern];
    
    if (paperId) {
      whereClause += ' AND paperId = ?';
      params.push(paperId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM supplements ${whereClause} ORDER BY createdAt DESC`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Check if supplement name exists in paper
  async isNameExistsInPaper(name: string, paperId: string, excludeId?: string, includeDeleted: boolean = false): Promise<boolean> {
    let whereClause = 'WHERE name = ? AND paperId = ?';
    const params: any[] = [name, paperId];
    
    if (excludeId) {
      whereClause += ' AND id != ?';
      params.push(excludeId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const row = await this.dbGet(`SELECT id FROM supplements ${whereClause}`, params);
    return !!row;
  }

  // Get supplements by file type (for file supplements)
  async getByFileType(fileExtension: string, paperId?: string, includeDeleted: boolean = false): Promise<Supplement[]> {
    let whereClause = 'WHERE type = ? AND value LIKE ?';
    const params: any[] = ['file', `%.${fileExtension}`];
    
    if (paperId) {
      whereClause += ' AND paperId = ?';
      params.push(paperId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM supplements ${whereClause} ORDER BY createdAt DESC`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get supplements by URL (for URL supplements)
  async getByUrl(url: string, paperId?: string, includeDeleted: boolean = false): Promise<Supplement[]> {
    let whereClause = 'WHERE type = ? AND value LIKE ?';
    const params: any[] = ['url', `%${url}%`];
    
    if (paperId) {
      whereClause += ' AND paperId = ?';
      params.push(paperId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM supplements ${whereClause} ORDER BY createdAt DESC`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Implementation of abstract methods
  protected async insertEntity(supplement: Supplement): Promise<void> {
    await this.dbRun(
      `INSERT INTO supplements (id, paperId, name, value, type, description, createdAt, createdByDeviceId, updatedAt, deletedAt, deletedByDeviceId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        supplement.id, supplement.paperId, supplement.name, supplement.value, supplement.type, supplement.description,
        supplement.createdAt.toISOString(), supplement.createdByDeviceId, supplement.updatedAt.toISOString(),
        supplement.deletedAt ? supplement.deletedAt.toISOString() : null, supplement.deletedByDeviceId
      ]
    );
  }

  protected rowToEntity(row: any): Supplement {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }

  protected serializeValue(value: any): any {
    if (value instanceof Date) return value.toISOString();
    return value;
  }
}
