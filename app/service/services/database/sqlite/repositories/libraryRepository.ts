import sqlite3 from 'sqlite3';
import { Library } from '../models';
import { BaseRepository } from '../repository';

export class LibraryRepository extends BaseRepository<Library> {
  constructor(db: sqlite3.Database) {
    super(db, 'libraries', 'library_field_versions');
  }

  // CRDT-friendly create with field versioning
  async createLibrary(library: Omit<Library, 'createdAt' | 'updatedAt' | 'createdByDeviceId'>, deviceId: string): Promise<void> {
    await this.create(library as Library, deviceId);
  }

  // CRDT-friendly update specific fields
  async updateLibraryField(id: string, field: keyof Library, value: any, deviceId: string): Promise<void> {
    await this.updateField(id, field, value, deviceId);
  }

  // CRDT-friendly soft delete
  async deleteLibrary(id: string, deviceId: string): Promise<void> {
    await this.softDelete(id, deviceId);
  }

  // CRDT-friendly restore
  async restoreLibrary(id: string, deviceId: string): Promise<void> {
    await this.restore(id, deviceId);
  }

  // Get library by owner
  async getByOwner(ownedBy: string, includeDeleted: boolean = false): Promise<Library[]> {
    const whereClause = includeDeleted 
      ? 'WHERE ownedBy = ?' 
      : 'WHERE ownedBy = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM libraries ${whereClause}`, [ownedBy]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get library by name
  async getByName(name: string, ownedBy?: string, includeDeleted: boolean = false): Promise<Library[]> {
    let whereClause = 'WHERE name LIKE ?';
    const params: any[] = [`%${name}%`];
    
    if (ownedBy) {
      whereClause += ' AND ownedBy = ?';
      params.push(ownedBy);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM libraries ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Search libraries
  async searchLibraries(query: string, ownedBy?: string, includeDeleted: boolean = false): Promise<Library[]> {
    let whereClause = 'WHERE (name LIKE ? OR description LIKE ?)';
    const params: any[] = [`%${query}%`, `%${query}%`];
    
    if (ownedBy) {
      whereClause += ' AND ownedBy = ?';
      params.push(ownedBy);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM libraries ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get libraries with pagination
  async getLibrariesWithPagination(
    offset: number, 
    limit: number, 
    ownedBy?: string, 
    includeDeleted: boolean = false
  ): Promise<{ libraries: Library[]; total: number }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (ownedBy) {
      whereClause = 'WHERE ownedBy = ?';
      params.push(ownedBy);
    }
    
    if (!includeDeleted) {
      whereClause += whereClause ? ' AND deletedAt IS NULL' : 'WHERE deletedAt IS NULL';
    }
    
    // Get total count
    const countRow = await this.dbGet(`SELECT COUNT(*) as total FROM libraries ${whereClause}`, params);
    const total = countRow.total;
    
    // Get libraries with pagination
    const rows = await this.dbAll(
      `SELECT * FROM libraries ${whereClause} ORDER BY updatedAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    const libraries = rows.map(row => this.rowToEntity(row));
    
    return { libraries, total };
  }

  // Get library statistics
  async getStatistics(ownedBy?: string): Promise<{
    total: number;
    active: number;
    deleted: number;
  }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (ownedBy) {
      whereClause = 'WHERE ownedBy = ?';
      params.push(ownedBy);
    }
    
    // Total count
    const totalRow = await this.dbGet(`SELECT COUNT(*) as total FROM libraries ${whereClause}`, params);
    const total = totalRow.total;
    
    // Active count
    const activeWhereClause = whereClause ? `${whereClause} AND deletedAt IS NULL` : 'WHERE deletedAt IS NULL';
    const activeRow = await this.dbGet(`SELECT COUNT(*) as total FROM libraries ${activeWhereClause}`, params);
    const active = activeRow.total;
    
    // Deleted count
    const deletedWhereClause = whereClause ? `${whereClause} AND deletedAt IS NOT NULL` : 'WHERE deletedAt IS NOT NULL';
    const deletedRow = await this.dbGet(`SELECT COUNT(*) as total FROM libraries ${deletedWhereClause}`, params);
    const deleted = deletedRow.total;
    
    return { total, active, deleted };
  }

  // Implementation of abstract methods
  protected async insertEntity(library: Library): Promise<void> {
    await this.dbRun(
      `INSERT INTO libraries (id, name, description, ownedBy, createdAt, createdByDeviceId, updatedAt, deletedAt, deletedByDeviceId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        library.id, library.name, library.description, library.ownedBy, library.createdAt.toISOString(), 
        library.createdByDeviceId, library.updatedAt.toISOString(), 
        library.deletedAt ? library.deletedAt.toISOString() : null, library.deletedByDeviceId
      ]
    );
  }

  protected rowToEntity(row: any): Library {
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

