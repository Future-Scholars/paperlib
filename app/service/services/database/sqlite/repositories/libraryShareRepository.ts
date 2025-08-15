import sqlite3 from 'sqlite3';
import { LibraryShare, zLibraryShare } from '../models';
import { BaseRepository } from '../repository';

export class LibraryShareRepository extends BaseRepository<LibraryShare> {
  constructor(db: sqlite3.Database) {
    super(db, 'library_shares', 'library_field_versions');
  }

  // CRDT-friendly create with field versioning
  async createShare(share: Omit<LibraryShare, 'createdAt' | 'updatedAt' | 'createdByDeviceId'>, deviceId: string): Promise<void> {
    await this.create(share as LibraryShare, deviceId);
  }

  // CRDT-friendly update specific fields
  async updateShareField(id: string, field: keyof LibraryShare, value: any, deviceId: string): Promise<void> {
    await this.updateField(id, field, value, deviceId);
  }

  // CRDT-friendly soft delete
  async deleteShare(id: string, deviceId: string): Promise<void> {
    await this.softDelete(id, deviceId);
  }

  // CRDT-friendly restore
  async restoreShare(id: string, deviceId: string): Promise<void> {
    await this.restore(id, deviceId);
  }

  // Update share permission
  async updatePermission(id: string, permission: string, deviceId: string): Promise<void> {
    await this.updateField(id, 'permission', permission, deviceId);
  }

  // Get share by ID
  async getById(id: string, includeDeleted: boolean = false): Promise<LibraryShare | null> {
    const whereClause = includeDeleted ? 'WHERE id = ?' : 'WHERE id = ? AND deletedAt IS NULL';
    const row = await this.dbGet(`SELECT * FROM library_shares ${whereClause}`, [id]);
    if (!row) return null;
    return this.rowToEntity(row);
  }

  // Get shares by library
  async getByLibrary(libraryId: string, includeDeleted: boolean = false): Promise<LibraryShare[]> {
    const whereClause = includeDeleted ? 'WHERE libraryId = ?' : 'WHERE libraryId = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM library_shares ${whereClause}`, [libraryId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get shares by user
  async getByUser(userId: string, includeDeleted: boolean = false): Promise<LibraryShare[]> {
    const whereClause = includeDeleted ? 'WHERE userId = ?' : 'WHERE userId = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM library_shares ${whereClause}`, [userId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get share by library and user
  async getByLibraryAndUser(libraryId: string, userId: string, includeDeleted: boolean = false): Promise<LibraryShare | null> {
    let whereClause = 'WHERE libraryId = ? AND userId = ?';
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    const row = await this.dbGet(`SELECT * FROM library_shares ${whereClause}`, [libraryId, userId]);
    if (!row) return null;
    return this.rowToEntity(row);
  }

  // Check if user has access to library
  async hasAccess(libraryId: string, userId: string): Promise<boolean> {
    const share = await this.getByLibraryAndUser(libraryId, userId);
    return !!share;
  }

  // Get user's permission for library
  async getUserPermission(libraryId: string, userId: string): Promise<string | null> {
    const share = await this.getByLibraryAndUser(libraryId, userId);
    return share ? share.permission : null;
  }

  // Get all shares with pagination
  async getSharesWithPagination(
    offset: number, 
    limit: number, 
    libraryId?: string, 
    includeDeleted: boolean = false
  ): Promise<{ shares: LibraryShare[]; total: number }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'WHERE libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += whereClause ? ' AND deletedAt IS NULL' : 'WHERE deletedAt IS NULL';
    }
    
    // Get total count
    const countRow = await this.dbGet(`SELECT COUNT(*) as count FROM library_shares ${whereClause}`, params);
    const total = countRow.count;
    
    // Get shares with pagination
    const limitClause = 'LIMIT ? OFFSET ?';
    const rows = await this.dbAll(
      `SELECT * FROM library_shares ${whereClause} ORDER BY createdAt DESC ${limitClause}`,
      [...params, limit, offset]
    );
    
    const shares = rows.map(row => this.rowToEntity(row));
    
    return { shares, total };
  }

  // Get shares by permission
  async getByPermission(permission: string, libraryId?: string, includeDeleted: boolean = false): Promise<LibraryShare[]> {
    let whereClause = 'WHERE permission = ?';
    const params: any[] = [permission];
    
    if (libraryId) {
      whereClause += ' AND libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM library_shares ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get library access statistics
  async getLibraryAccessStatistics(libraryId?: string): Promise<{
    totalShares: number;
    sharesByPermission: { permission: string; count: number }[];
    mostSharedLibraries: { libraryId: string; shareCount: number }[];
  }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'WHERE libraryId = ?';
      params.push(libraryId);
    }
    
    // Get total shares
    const totalRow = await this.dbGet(`SELECT COUNT(*) as count FROM library_shares ${whereClause}`, params);
    const totalShares = totalRow.count;
    
    // Get shares by permission
    const permissionRows = await this.dbAll(
      `SELECT permission, COUNT(*) as count FROM library_shares ${whereClause} GROUP BY permission`,
      params
    );
    const sharesByPermission = permissionRows.map(row => ({
      permission: row.permission,
      count: row.count
    }));
    
    // Get most shared libraries
    const libraryRows = await this.dbAll(
      `SELECT libraryId, COUNT(*) as count FROM library_shares ${whereClause} GROUP BY libraryId ORDER BY count DESC LIMIT 10`,
      params
    );
    const mostSharedLibraries = libraryRows.map(row => ({
      libraryId: row.libraryId,
      shareCount: row.count
    }));
    
    return {
      totalShares,
      sharesByPermission,
      mostSharedLibraries
    };
  }

  // Get shares changed since timestamp for sync
  async getSharesChangedSince(timestamp: Date, deviceId?: string, includeDeleted: boolean = false): Promise<LibraryShare[]> {
    let whereClause = 'WHERE updatedAt > ?';
    const params: any[] = [timestamp.toISOString()];
    
    if (deviceId) {
      whereClause += ' AND createdByDeviceId != ?';
      params.push(deviceId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(
      `SELECT * FROM library_shares ${whereClause} ORDER BY updatedAt ASC`,
      params
    );
    
    return rows.map(row => this.rowToEntity(row));
  }

  // Convert database row to entity
  protected rowToEntity(row: any): LibraryShare {
    return {
      id: row.id,
      libraryId: row.libraryId,
      userId: row.userId,
      permission: row.permission,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      createdByDeviceId: row.createdByDeviceId,
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
      deletedByDeviceId: row.deletedByDeviceId
    };
  }
}

