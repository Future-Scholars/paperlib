import sqlite3 from 'sqlite3';
import { Feed, FeedType } from '../models';
import { BaseRepository } from '../repository';

export class FeedRepository extends BaseRepository<Feed> {
  constructor(db: sqlite3.Database) {
    super(db, 'feeds', 'feed_field_versions');
  }

  // CRDT-friendly create with field versioning
  async createFeed(feed: Omit<Feed, 'createdAt' | 'updatedAt' | 'createdByDeviceId'>, deviceId: string): Promise<void> {
    await this.create(feed as Feed, deviceId);
  }

  // CRDT-friendly update specific fields
  async updateFeedField(id: string, field: keyof Feed, value: any, deviceId: string): Promise<void> {
    await this.updateField(id, field, value, deviceId);
  }

  // CRDT-friendly soft delete
  async deleteFeed(id: string, deviceId: string): Promise<void> {
    await this.softDelete(id, deviceId);
  }

  // CRDT-friendly restore
  async restoreFeed(id: string, deviceId: string): Promise<void> {
    await this.restore(id, deviceId);
  }

  // Get feeds by library
  async getByLibrary(libraryId: string, includeDeleted: boolean = false): Promise<Feed[]> {
    const whereClause = includeDeleted 
      ? 'WHERE libraryId = ?' 
      : 'WHERE libraryId = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM feeds ${whereClause}`, [libraryId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get feeds by owner
  async getByOwner(ownedBy: string, includeDeleted: boolean = false): Promise<Feed[]> {
    const whereClause = includeDeleted 
      ? 'WHERE ownedBy = ?' 
      : 'WHERE ownedBy = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM feeds ${whereClause}`, [ownedBy]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get feeds by type
  async getByType(type: FeedType, libraryId?: string, includeDeleted: boolean = false): Promise<Feed[]> {
    let whereClause = 'WHERE type = ?';
    const params: any[] = [type];
    
    if (libraryId) {
      whereClause += ' AND libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM feeds ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get feed by URL
  async getByUrl(url: string, includeDeleted: boolean = false): Promise<Feed | null> {
    const whereClause = includeDeleted 
      ? 'WHERE url = ?' 
      : 'WHERE url = ? AND deletedAt IS NULL';
    const row = await this.dbGet(`SELECT * FROM feeds ${whereClause}`, [url]);
    if (!row) return null;
    return this.rowToEntity(row);
  }

  // Search feeds
  async searchFeeds(query: string, libraryId?: string, includeDeleted: boolean = false): Promise<Feed[]> {
    let whereClause = 'WHERE (name LIKE ? OR description LIKE ? OR url LIKE ?)';
    const params: any[] = [`%${query}%`, `%${query}%`, `%${query}%`];
    
    if (libraryId) {
      whereClause += ' AND libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM feeds ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get feeds with pagination
  async getFeedsWithPagination(
    offset: number, 
    limit: number, 
    libraryId?: string, 
    ownedBy?: string,
    includeDeleted: boolean = false
  ): Promise<{ feeds: Feed[]; total: number }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'WHERE libraryId = ?';
      params.push(libraryId);
    }
    
    if (ownedBy) {
      whereClause += whereClause ? ' AND ownedBy = ?' : 'WHERE ownedBy = ?';
      params.push(ownedBy);
    }
    
    if (!includeDeleted) {
      whereClause += whereClause ? ' AND deletedAt IS NULL' : 'WHERE deletedAt IS NULL';
    }
    
    // Get total count
    const countRow = await this.dbGet(`SELECT COUNT(*) as total FROM feeds ${whereClause}`, params);
    const total = countRow.total;
    
    // Get feeds with pagination
    const rows = await this.dbAll(
      `SELECT * FROM feeds ${whereClause} ORDER BY updatedAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    const feeds = rows.map(row => this.rowToEntity(row));
    
    return { feeds, total };
  }

  // Get feed statistics
  async getStatistics(libraryId?: string, ownedBy?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    active: number;
    deleted: number;
  }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'WHERE libraryId = ?';
      params.push(libraryId);
    }
    
    if (ownedBy) {
      whereClause += whereClause ? ' AND ownedBy = ?' : 'WHERE ownedBy = ?';
      params.push(ownedBy);
    }
    
    // Total count
    const totalRow = await this.dbGet(`SELECT COUNT(*) as total FROM feeds ${whereClause}`, params);
    const total = totalRow.total;
    
    // By type
    const typeRows = await this.dbAll(
      `SELECT type, COUNT(*) as count FROM feeds ${whereClause} AND deletedAt IS NULL GROUP BY type`,
      params
    );
    const byType: Record<string, number> = {};
    typeRows.forEach(row => { byType[row.type] = row.count; });
    
    // Active count
    const activeWhereClause = whereClause ? `${whereClause} AND deletedAt IS NULL` : 'WHERE deletedAt IS NULL';
    const activeRow = await this.dbGet(`SELECT COUNT(*) as total FROM feeds ${activeWhereClause}`, params);
    const active = activeRow.total;
    
    // Deleted count
    const deletedWhereClause = whereClause ? `${whereClause} AND deletedAt IS NOT NULL` : 'WHERE deletedAt IS NOT NULL';
    const deletedRow = await this.dbGet(`SELECT COUNT(*) as total FROM feeds ${deletedWhereClause}`, params);
    const deleted = deletedRow.total;
    
    return { total, byType, active, deleted };
  }

  // Check if URL already exists
  async isUrlExists(url: string, excludeId?: string, includeDeleted: boolean = false): Promise<boolean> {
    let whereClause = 'WHERE url = ?';
    const params: any[] = [url];
    
    if (excludeId) {
      whereClause += ' AND id != ?';
      params.push(excludeId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const row = await this.dbGet(`SELECT id FROM feeds ${whereClause}`, params);
    return !!row;
  }

  // Implementation of abstract methods
  protected async insertEntity(feed: Feed): Promise<void> {
    await this.dbRun(
      `INSERT INTO feeds (id, name, description, ownedBy, libraryId, type, url, createdAt, createdByDeviceId, updatedAt, deletedAt, deletedByDeviceId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        feed.id, feed.name, feed.description, feed.ownedBy, feed.libraryId, feed.type, feed.url,
        feed.createdAt.toISOString(), feed.createdByDeviceId, feed.updatedAt.toISOString(),
        feed.deletedAt ? feed.deletedAt.toISOString() : null, feed.deletedByDeviceId
      ]
    );
  }

  protected rowToEntity(row: any): Feed {
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

