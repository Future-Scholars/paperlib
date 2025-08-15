import sqlite3 from 'sqlite3';
import { Author } from '../models';
import { BaseRepository } from '../repository';

export class AuthorRepository extends BaseRepository<Author> {
  constructor(db: sqlite3.Database) {
    super(db, 'authors', 'author_field_versions');
  }

  // CRDT-friendly create with field versioning
  async createAuthor(author: Omit<Author, 'createdAt' | 'createdByDeviceId'>, deviceId: string): Promise<void> {
    await this.create(author as Author, deviceId);
  }

  // CRDT-friendly update specific fields
  async updateAuthorField(id: string, field: keyof Author, value: any, deviceId: string): Promise<void> {
    await this.updateField(id, field, value, deviceId);
  }

  // CRDT-friendly soft delete
  async deleteAuthor(id: string, deviceId: string): Promise<void> {
    await this.softDelete(id, deviceId);
  }

  // CRDT-friendly restore
  async restoreAuthor(id: string, deviceId: string): Promise<void> {
    await this.restore(id, deviceId);
  }

  // Get authors by name
  async getByName(name: string, includeDeleted: boolean = false): Promise<Author[]> {
    const whereClause = includeDeleted 
      ? 'WHERE name LIKE ?' 
      : 'WHERE name LIKE ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM authors ${whereClause}`, [`%${name}%`]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get authors by affiliation
  async getByAffiliation(affiliation: string, includeDeleted: boolean = false): Promise<Author[]> {
    const whereClause = includeDeleted 
      ? 'WHERE affiliation LIKE ?' 
      : 'WHERE affiliation LIKE ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM authors ${whereClause}`, [`%${affiliation}%`]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get authors by ORCID
  async getByOrcid(orcid: string, includeDeleted: boolean = false): Promise<Author | null> {
    const whereClause = includeDeleted 
      ? 'WHERE orcid = ?' 
      : 'WHERE orcid = ? AND deletedAt IS NULL';
    const row = await this.dbGet(`SELECT * FROM authors ${whereClause}`, [orcid]);
    if (!row) return null;
    return this.rowToEntity(row);
  }

  // Search authors
  async searchAuthors(query: string, includeDeleted: boolean = false): Promise<Author[]> {
    const whereClause = includeDeleted 
      ? 'WHERE (name LIKE ? OR affiliation LIKE ? OR email LIKE ?)' 
      : 'WHERE (name LIKE ? OR affiliation LIKE ? OR email LIKE ?) AND deletedAt IS NULL';
    const searchQuery = `%${query}%`;
    const rows = await this.dbAll(`SELECT * FROM authors ${whereClause}`, [searchQuery, searchQuery, searchQuery]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get authors with pagination
  async getAuthorsWithPagination(
    offset: number, 
    limit: number, 
    includeDeleted: boolean = false
  ): Promise<{ authors: Author[]; total: number }> {
    const whereClause = includeDeleted ? '' : 'WHERE deletedAt IS NULL';
    
    // Get total count
    const countRow = await this.dbGet(`SELECT COUNT(*) as total FROM authors ${whereClause}`);
    const total = countRow.total;
    
    // Get authors with pagination
    const rows = await this.dbAll(
      `SELECT * FROM authors ${whereClause} ORDER BY name ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    const authors = rows.map(row => this.rowToEntity(row));
    
    return { authors, total };
  }

  // Get author statistics
  async getStatistics(): Promise<{
    total: number;
    withAffiliation: number;
    withEmail: number;
    withOrcid: number;
    active: number;
    deleted: number;
  }> {
    // Total count
    const totalRow = await this.dbGet('SELECT COUNT(*) as total FROM authors');
    const total = totalRow.total;
    
    // With affiliation
    const affiliationRow = await this.dbGet('SELECT COUNT(*) as total FROM authors WHERE affiliation IS NOT NULL AND deletedAt IS NULL');
    const withAffiliation = affiliationRow.total;
    
    // With email
    const emailRow = await this.dbGet('SELECT COUNT(*) as total FROM authors WHERE email IS NOT NULL AND deletedAt IS NULL');
    const withEmail = emailRow.total;
    
    // With ORCID
    const orcidRow = await this.dbGet('SELECT COUNT(*) as total FROM authors WHERE orcid IS NOT NULL AND deletedAt IS NULL');
    const withOrcid = orcidRow.total;
    
    // Active count
    const activeRow = await this.dbGet('SELECT COUNT(*) as total FROM authors WHERE deletedAt IS NULL');
    const active = activeRow.total;
    
    // Deleted count
    const deletedRow = await this.dbGet('SELECT COUNT(*) as total FROM authors WHERE deletedAt IS NOT NULL');
    const deleted = deletedRow.total;
    
    return {
      total,
      withAffiliation,
      withEmail,
      withOrcid,
      active,
      deleted
    };
  }

  // Get authors by name pattern
  async getByNamePattern(pattern: string, includeDeleted: boolean = false): Promise<Author[]> {
    const whereClause = includeDeleted 
      ? 'WHERE name LIKE ?' 
      : 'WHERE name LIKE ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM authors ${whereClause} ORDER BY name ASC`, [pattern]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get authors by first name
  async getByFirstName(firstName: string, includeDeleted: boolean = false): Promise<Author[]> {
    const whereClause = includeDeleted 
      ? 'WHERE firstName LIKE ?' 
      : 'WHERE firstName LIKE ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM authors ${whereClause} ORDER BY name ASC`, [`%${firstName}%`]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get authors by last name
  async getByLastName(lastName: string, includeDeleted: boolean = false): Promise<Author[]> {
    const whereClause = includeDeleted 
      ? 'WHERE lastName LIKE ?' 
      : 'WHERE lastName LIKE ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM authors ${whereClause} ORDER BY name ASC`, [`%${lastName}%`]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Check if author name exists
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
    
    const row = await this.dbGet(`SELECT id FROM authors ${whereClause}`, params);
    return !!row;
  }

  // Implementation of abstract methods
  protected async insertEntity(author: Author): Promise<void> {
    await this.dbRun(
      `INSERT INTO authors (id, name, affiliation, email, orcid, firstName, lastName, createdAt, createdByDeviceId, deletedAt, deletedByDeviceId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        author.id, author.name, author.affiliation, author.email, author.orcid, author.firstName, author.lastName,
        author.createdAt.toISOString(), author.createdByDeviceId,
        author.deletedAt ? author.deletedAt.toISOString() : null, author.deletedByDeviceId
      ]
    );
  }

  protected rowToEntity(row: any): Author {
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
