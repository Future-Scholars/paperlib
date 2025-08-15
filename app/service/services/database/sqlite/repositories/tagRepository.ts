import sqlite3 from 'sqlite3';
import { Tag } from '../models';
import { BaseRepository } from '../repository';

export class TagRepository extends BaseRepository<Tag> {
  constructor(db: sqlite3.Database) {
    super(db, 'tags', 'tag_field_versions');
  }

  // CRDT-friendly create with field versioning
  async createTag(tag: Omit<Tag, 'createdAt' | 'createdByDeviceId'>, deviceId: string): Promise<void> {
    await this.create(tag as Tag, deviceId);
  }

  // CRDT-friendly update specific fields
  async updateTagField(id: string, field: keyof Tag, value: any, deviceId: string): Promise<void> {
    await this.updateField(id, field, value, deviceId);
  }

  // CRDT-friendly soft delete
  async deleteTag(id: string, deviceId: string): Promise<void> {
    await this.softDelete(id, deviceId);
  }

  // CRDT-friendly restore
  async restoreTag(id: string, deviceId: string): Promise<void> {
    await this.restore(id, deviceId);
  }

  // Get tags by name
  async getByName(name: string, includeDeleted: boolean = false): Promise<Tag[]> {
    const whereClause = includeDeleted 
      ? 'WHERE name LIKE ?' 
      : 'WHERE name LIKE ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM tags ${whereClause}`, [`%${name}%`]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get tags by colour
  async getByColour(colour: string, includeDeleted: boolean = false): Promise<Tag[]> {
    const whereClause = includeDeleted 
      ? 'WHERE colour = ?' 
      : 'WHERE colour = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM tags ${whereClause}`, [colour]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Search tags
  async searchTags(query: string, includeDeleted: boolean = false): Promise<Tag[]> {
    const whereClause = includeDeleted 
      ? 'WHERE (name LIKE ? OR description LIKE ?)' 
      : 'WHERE (name LIKE ? OR description LIKE ?) AND deletedAt IS NULL';
    const searchQuery = `%${query}%`;
    const rows = await this.dbAll(`SELECT * FROM tags ${whereClause}`, [searchQuery, searchQuery]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get tags with pagination
  async getTagsWithPagination(
    offset: number, 
    limit: number, 
    includeDeleted: boolean = false
  ): Promise<{ tags: Tag[]; total: number }> {
    const whereClause = includeDeleted ? '' : 'WHERE deletedAt IS NULL';
    
    // Get total count
    const countRow = await this.dbGet(`SELECT COUNT(*) as total FROM tags ${whereClause}`);
    const total = countRow.total;
    
    // Get tags with pagination
    const rows = await this.dbAll(
      `SELECT * FROM tags ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const tags = rows.map(row => this.rowToEntity(row));
    
    return { tags, total };
  }

  // Get tag statistics
  async getStatistics(): Promise<{
    total: number;
    withDescription: number;
    withColour: number;
    active: number;
    deleted: number;
  }> {
    // Total count
    const totalRow = await this.dbGet('SELECT COUNT(*) as total FROM tags');
    const total = totalRow.total;
    
    // With description
    const descriptionRow = await this.dbGet('SELECT COUNT(*) as total FROM tags WHERE description IS NOT NULL AND deletedAt IS NULL');
    const withDescription = descriptionRow.total;
    
    // With colour
    const colourRow = await this.dbGet('SELECT COUNT(*) as total FROM tags WHERE colour IS NOT NULL AND deletedAt IS NULL');
    const withColour = colourRow.total;
    
    // Active count
    const activeRow = await this.dbGet('SELECT COUNT(*) as total FROM tags WHERE deletedAt IS NULL');
    const active = activeRow.total;
    
    // Deleted count
    const deletedRow = await this.dbGet('SELECT COUNT(*) as total FROM tags WHERE deletedAt IS NOT NULL');
    const deleted = deletedRow.total;
    
    return {
      total,
      withDescription,
      withColour,
      active,
      deleted
    };
  }

  // Get tags by name pattern
  async getByNamePattern(pattern: string, includeDeleted: boolean = false): Promise<Tag[]> {
    const whereClause = includeDeleted 
      ? 'WHERE name LIKE ?' 
      : 'WHERE name LIKE ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM tags ${whereClause} ORDER BY name ASC`, [pattern]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Check if tag name exists
  async isNameExists(name: string, excludeId?: string, includeDeleted: boolean = false): Promise<boolean> {
    let whereClause = 'WHERE name = ?';
    const params: any[] = [name];
    
    if (excludeId) {
      whereClause += ' AND id != ?';
      params.push(excludeId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const row = await this.dbGet(`SELECT id FROM tags ${whereClause}`, params);
    return !!row;
  }

  // Get tags by description
  async getByDescription(description: string, includeDeleted: boolean = false): Promise<Tag[]> {
    const whereClause = includeDeleted 
      ? 'WHERE description LIKE ?' 
      : 'WHERE description LIKE ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM tags ${whereClause} ORDER BY name ASC`, [`%${description}%`]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get tags sorted by usage (requires paper_tags table)
  async getByUsage(libraryId?: string, includeDeleted: boolean = false): Promise<{ tag: Tag; usageCount: number }[]> {
    let joinClause = '';
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      joinClause = 'JOIN paper_tags pt ON t.id = pt.tagId JOIN papers p ON pt.paperId = p.id';
      whereClause = 'WHERE p.libraryId = ?';
      params.push(libraryId);
    } else {
      joinClause = 'JOIN paper_tags pt ON t.id = pt.tagId';
    }
    
    if (!includeDeleted) {
      whereClause += whereClause ? ' AND t.deletedAt IS NULL' : 'WHERE t.deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(
      `SELECT t.*, COUNT(CASE WHEN pt.op = 'add' THEN 1 END) - COUNT(CASE WHEN pt.op = 'remove' THEN 1 END) as usageCount
       FROM tags t
       ${joinClause}
       ${whereClause}
       GROUP BY t.id
       HAVING usageCount > 0
       ORDER BY usageCount DESC`,
      params
    );
    
    return rows.map(row => ({
      tag: this.rowToEntity(row),
      usageCount: row.usageCount
    }));
  }

  // Implementation of abstract methods
  protected async insertEntity(tag: Tag): Promise<void> {
    await this.dbRun(
      `INSERT INTO tags (id, name, description, colour, createdAt, createdByDeviceId, deletedAt, deletedByDeviceId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tag.id, tag.name, tag.description, tag.colour,
        tag.createdAt.toISOString(), tag.createdByDeviceId,
        tag.deletedAt ? tag.deletedAt.toISOString() : null, tag.deletedByDeviceId
      ]
    );
  }

  protected rowToEntity(row: any): Tag {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }

  protected serializeValue(value: any): any {
    if (value instanceof Date) return value.toISOString();
    return value;
  }
}
