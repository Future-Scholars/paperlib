import sqlite3 from 'sqlite3';
import { Folder } from '../models';
import { BaseRepository } from '../repository';

export class FolderRepository extends BaseRepository<Folder> {
  constructor(db: sqlite3.Database) {
    super(db, 'folders', 'folder_field_versions');
  }

  // CRDT-friendly create with field versioning
  async createFolder(folder: Omit<Folder, 'createdAt' | 'updatedAt' | 'createdByDeviceId'>, deviceId: string): Promise<void> {
    await this.create(folder as Folder, deviceId);
  }

  // CRDT-friendly update specific fields
  async updateFolderField(id: string, field: keyof Folder, value: any, deviceId: string): Promise<void> {
    await this.updateField(id, field, value, deviceId);
  }

  // CRDT-friendly soft delete
  async deleteFolder(id: string, deviceId: string): Promise<void> {
    await this.softDelete(id, deviceId);
  }

  // CRDT-friendly restore
  async restoreFolder(id: string, deviceId: string): Promise<void> {
    await this.restore(id, deviceId);
  }

  // Get folders by library
  async getByLibrary(libraryId: string, includeDeleted: boolean = false): Promise<Folder[]> {
    const whereClause = includeDeleted 
      ? 'WHERE libraryId = ?' 
      : 'WHERE libraryId = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM folders ${whereClause}`, [libraryId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get root folders (no parent)
  async getRootFolders(libraryId: string, includeDeleted: boolean = false): Promise<Folder[]> {
    const whereClause = includeDeleted 
      ? 'WHERE libraryId = ? AND parentId IS NULL' 
      : 'WHERE libraryId = ? AND parentId IS NULL AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM folders ${whereClause}`, [libraryId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get child folders
  async getChildFolders(parentId: string, includeDeleted: boolean = false): Promise<Folder[]> {
    const whereClause = includeDeleted 
      ? 'WHERE parentId = ?' 
      : 'WHERE parentId = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM folders ${whereClause}`, [parentId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get folder tree (recursive)
  async getFolderTree(libraryId: string, includeDeleted: boolean = false): Promise<Folder[]> {
    const whereClause = includeDeleted 
      ? 'WHERE libraryId = ?' 
      : 'WHERE libraryId = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM folders ${whereClause} ORDER BY parentId, name`, [libraryId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get folder path (breadcrumb)
  async getFolderPath(folderId: string, includeDeleted: boolean = false): Promise<Folder[]> {
    const path: Folder[] = [];
    let currentId = folderId;
    
    while (currentId) {
      const folder = await this.getById(currentId, includeDeleted);
      if (!folder) break;
      
      path.unshift(folder);
      currentId = folder.parentId || '';
    }
    
    return path;
  }

  // Get folder by name in parent
  async getByNameInParent(name: string, parentId: string | null, libraryId: string, includeDeleted: boolean = false): Promise<Folder | null> {
    let whereClause = 'WHERE name = ? AND libraryId = ?';
    const params: any[] = [name, libraryId];
    
    if (parentId === null) {
      whereClause += ' AND parentId IS NULL';
    } else {
      whereClause += ' AND parentId = ?';
      params.push(parentId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const row = await this.dbGet(`SELECT * FROM folders ${whereClause}`, params);
    if (!row) return null;
    return this.rowToEntity(row);
  }

  // Search folders
  async searchFolders(query: string, libraryId?: string, includeDeleted: boolean = false): Promise<Folder[]> {
    let whereClause = 'WHERE (name LIKE ? OR description LIKE ?)';
    const params: any[] = [`%${query}%`, `%${query}%`];
    
    if (libraryId) {
      whereClause += ' AND libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM folders ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get folders with pagination
  async getFoldersWithPagination(
    offset: number, 
    limit: number, 
    libraryId?: string, 
    parentId?: string | null,
    includeDeleted: boolean = false
  ): Promise<{ folders: Folder[]; total: number }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'WHERE libraryId = ?';
      params.push(libraryId);
    }
    
    if (parentId === null) {
      whereClause += whereClause ? ' AND parentId IS NULL' : 'WHERE parentId IS NULL';
    } else if (parentId !== undefined) {
      whereClause += whereClause ? ' AND parentId = ?' : 'WHERE parentId = ?';
      params.push(parentId);
    }
    
    if (!includeDeleted) {
      whereClause += whereClause ? ' AND deletedAt IS NULL' : 'WHERE deletedAt IS NULL';
    }
    
    // Get total count
    const countRow = await this.dbGet(`SELECT COUNT(*) as total FROM folders ${whereClause}`, params);
    const total = countRow.total;
    
    // Get folders with pagination
    const rows = await this.dbAll(
      `SELECT * FROM folders ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    const folders = rows.map(row => this.rowToEntity(row));
    
    return { folders, total };
  }

  // Get folder statistics
  async getStatistics(libraryId?: string): Promise<{
    total: number;
    rootFolders: number;
    nestedFolders: number;
    active: number;
    deleted: number;
  }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'WHERE libraryId = ?';
      params.push(libraryId);
    }
    
    // Total count
    const totalRow = await this.dbGet(`SELECT COUNT(*) as total FROM folders ${whereClause}`, params);
    const total = totalRow.total;
    
    // Root folders count
    const rootWhereClause = whereClause ? `${whereClause} AND parentId IS NULL` : 'WHERE parentId IS NULL';
    const rootRow = await this.dbGet(`SELECT COUNT(*) as total FROM folders ${rootWhereClause}`, params);
    const rootFolders = rootRow.total;
    
    // Nested folders count
    const nestedWhereClause = whereClause ? `${whereClause} AND parentId IS NOT NULL` : 'WHERE parentId IS NOT NULL';
    const nestedRow = await this.dbGet(`SELECT COUNT(*) as total FROM folders ${nestedWhereClause}`, params);
    const nestedFolders = nestedRow.total;
    
    // Active count
    const activeWhereClause = whereClause ? `${whereClause} AND deletedAt IS NULL` : 'WHERE deletedAt IS NULL';
    const activeRow = await this.dbGet(`SELECT COUNT(*) as total FROM folders ${activeWhereClause}`, params);
    const active = activeRow.total;
    
    // Deleted count
    const deletedWhereClause = whereClause ? `${whereClause} AND deletedAt IS NOT NULL` : 'WHERE deletedAt IS NOT NULL';
    const deletedRow = await this.dbGet(`SELECT COUNT(*) as total FROM folders ${deletedWhereClause}`, params);
    const deleted = deletedRow.total;
    
    return { total, rootFolders, nestedFolders, active, deleted };
  }

  // Check if folder name exists in parent
  async isNameExistsInParent(name: string, parentId: string | null, libraryId: string, excludeId?: string, includeDeleted: boolean = false): Promise<boolean> {
    let whereClause = 'WHERE name = ? AND libraryId = ?';
    const params: any[] = [name, libraryId];
    
    if (parentId === null) {
      whereClause += ' AND parentId IS NULL';
    } else {
      whereClause += ' AND parentId = ?';
      params.push(parentId);
    }
    
    if (excludeId) {
      whereClause += ' AND id != ?';
      params.push(excludeId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const row = await this.dbGet(`SELECT id FROM folders ${whereClause}`, params);
    return !!row;
  }

  // Implementation of abstract methods
  protected async insertEntity(folder: Folder): Promise<void> {
    await this.dbRun(
      `INSERT INTO folders (id, name, description, parentId, libraryId, createdAt, createdByDeviceId, updatedAt, deletedAt, deletedByDeviceId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        folder.id, folder.name, folder.description, folder.parentId, folder.libraryId,
        folder.createdAt.toISOString(), folder.createdByDeviceId, folder.updatedAt.toISOString(),
        folder.deletedAt ? folder.deletedAt.toISOString() : null, folder.deletedByDeviceId
      ]
    );
  }

  protected rowToEntity(row: any): Folder {
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

