import sqlite3 from 'sqlite3';
import { Paper, zPaper, PaperType } from '../models';
import { BaseRepository, BaseEntity } from '../repository';

export class PaperRepository extends BaseRepository<Paper> {
  constructor(db: sqlite3.Database) {
    super(db, 'papers', 'paper_field_versions');
  }

  // CRDT-friendly create with field versioning
  async createPaper(paper: Omit<Paper, 'createdAt' | 'updatedAt' | 'createdByDeviceId'>, deviceId: string): Promise<void> {
    await this.create(paper as Paper, deviceId);
  }

  // CRDT-friendly update specific fields
  async updatePaperField(id: string, field: keyof Paper, value: any, deviceId: string): Promise<void> {
    await this.updateField(id, field, value, deviceId);
  }

  // CRDT-friendly soft delete
  async deletePaper(id: string, deviceId: string): Promise<void> {
    await this.softDelete(id, deviceId);
  }

  // CRDT-friendly restore
  async restorePaper(id: string, deviceId: string): Promise<void> {
    await this.restore(id, deviceId);
  }

  // Get papers by library
  async getByLibrary(libraryId: string, includeDeleted: boolean = false): Promise<Paper[]> {
    const whereClause = includeDeleted 
      ? 'WHERE libraryId = ?' 
      : 'WHERE libraryId = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM papers ${whereClause}`, [libraryId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get papers by type
  async getByType(type: PaperType, libraryId?: string, includeDeleted: boolean = false): Promise<Paper[]> {
    let whereClause = 'WHERE type = ?';
    const params: any[] = [type];
    
    if (libraryId) {
      whereClause += ' AND libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM papers ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get papers by feed
  async getByFeed(feedId: string, includeDeleted: boolean = false): Promise<Paper[]> {
    const whereClause = includeDeleted 
      ? 'WHERE feedId = ?' 
      : 'WHERE feedId = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM papers ${whereClause}`, [feedId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Search papers by title or abstract
  async searchPapers(query: string, libraryId?: string, includeDeleted: boolean = false): Promise<Paper[]> {
    let whereClause = 'WHERE (title LIKE ? OR abstract LIKE ?)';
    const params: any[] = [`%${query}%`, `%${query}%`];
    
    if (libraryId) {
      whereClause += ' AND libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM papers ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get papers with pagination
  async getPapersWithPagination(
    offset: number, 
    limit: number, 
    libraryId?: string, 
    includeDeleted: boolean = false
  ): Promise<{ papers: Paper[]; total: number }> {
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
    const countRow = await this.dbGet(`SELECT COUNT(*) as total FROM papers ${whereClause}`, params);
    const total = countRow.total;
    
    // Get papers with pagination
    const rows = await this.dbAll(
      `SELECT * FROM papers ${whereClause} ORDER BY updatedAt DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    const papers = rows.map(row => this.rowToEntity(row));
    
    return { papers, total };
  }

  // Get papers by year range
  async getByYearRange(startYear: number, endYear: number, libraryId?: string, includeDeleted: boolean = false): Promise<Paper[]> {
    let whereClause = 'WHERE year >= ? AND year <= ?';
    const params: any[] = [startYear, endYear];
    
    if (libraryId) {
      whereClause += ' AND libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM papers ${whereClause} ORDER BY year DESC`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get papers by DOI
  async getByDoi(doi: string, includeDeleted: boolean = false): Promise<Paper | null> {
    const whereClause = includeDeleted 
      ? 'WHERE doi = ?' 
      : 'WHERE doi = ? AND deletedAt IS NULL';
    const row = await this.dbGet(`SELECT * FROM papers ${whereClause}`, [doi]);
    if (!row) return null;
    return this.rowToEntity(row);
  }

  // Get papers by arXiv ID
  async getByArxiv(arxiv: string, includeDeleted: boolean = false): Promise<Paper | null> {
    const whereClause = includeDeleted 
      ? 'WHERE arxiv = ?' 
      : 'WHERE arxiv = ? AND deletedAt IS NULL';
    const row = await this.dbGet(`SELECT * FROM papers ${whereClause}`, [arxiv]);
    if (!row) return null;
    return this.rowToEntity(row);
  }

  // Get papers by ISBN
  async getByIsbn(isbn: string, includeDeleted: boolean = false): Promise<Paper[]> {
    const whereClause = includeDeleted 
      ? 'WHERE isbn = ?' 
      : 'WHERE isbn = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM papers ${whereClause}`, [isbn]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get papers by ISSN
  async getByIssn(issn: string, includeDeleted: boolean = false): Promise<Paper[]> {
    const whereClause = includeDeleted 
      ? 'WHERE issn = ?' 
      : 'WHERE issn = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM papers ${whereClause}`, [issn]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get papers by publisher
  async getByPublisher(publisher: string, libraryId?: string, includeDeleted: boolean = false): Promise<Paper[]> {
    let whereClause = 'WHERE publisher LIKE ?';
    const params: any[] = [`%${publisher}%`];
    
    if (libraryId) {
      whereClause += ' AND libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM papers ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get papers by journal
  async getByJournal(journal: string, libraryId?: string, includeDeleted: boolean = false): Promise<Paper[]> {
    let whereClause = 'WHERE journal LIKE ?';
    const params: any[] = [`%${journal}%`];
    
    if (libraryId) {
      whereClause += ' AND libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM papers ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get papers by read status
  async getByReadStatus(read: boolean, libraryId?: string, includeDeleted: boolean = false): Promise<Paper[]> {
    let whereClause = 'WHERE read = ?';
    const params: any[] = [read ? 1 : 0];
    
    if (libraryId) {
      whereClause += ' AND libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM papers ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get papers by flag status
  async getByFlagStatus(flag: boolean, libraryId?: string, includeDeleted: boolean = false): Promise<Paper[]> {
    let whereClause = 'WHERE flag = ?';
    const params: any[] = [flag ? 1 : 0];
    
    if (libraryId) {
      whereClause += ' AND libraryId = ?';
      params.push(libraryId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(`SELECT * FROM papers ${whereClause}`, params);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get statistics
  async getStatistics(libraryId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byYear: Record<number, number>;
    byReadStatus: { read: number; unread: number };
    byFlagStatus: { flagged: number; unflagged: number };
  }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'WHERE libraryId = ?';
      params.push(libraryId);
    }
    
    // Total count
    const totalRow = await this.dbGet(`SELECT COUNT(*) as total FROM papers ${whereClause} AND deletedAt IS NULL`, params);
    const total = totalRow.total;
    
    // By type
    const typeRows = await this.dbAll(
      `SELECT type, COUNT(*) as count FROM papers ${whereClause} AND deletedAt IS NULL GROUP BY type`,
      params
    );
    const byType: Record<string, number> = {};
    typeRows.forEach(row => { byType[row.type] = row.count; });
    
    // By year
    const yearRows = await this.dbAll(
      `SELECT year, COUNT(*) as count FROM papers ${whereClause} AND deletedAt IS NULL AND year IS NOT NULL GROUP BY year ORDER BY year DESC`,
      params
    );
    const byYear: Record<number, number> = {};
    yearRows.forEach(row => { byYear[row.year] = row.count; });
    
    // By read status
    const readRow = await this.dbGet(
      `SELECT COUNT(*) as count FROM papers ${whereClause} AND deletedAt IS NULL AND read = 1`,
      params
    );
    const unreadRow = await this.dbGet(
      `SELECT COUNT(*) as count FROM papers ${whereClause} AND deletedAt IS NULL AND read = 0`,
      params
    );
    
    // By flag status
    const flaggedRow = await this.dbGet(
      `SELECT COUNT(*) as count FROM papers ${whereClause} AND deletedAt IS NULL AND flag = 1`,
      params
    );
    const unflaggedRow = await this.dbGet(
      `SELECT COUNT(*) as count FROM papers ${whereClause} AND deletedAt IS NULL AND flag = 0`,
      params
    );
    
    return {
      total,
      byType,
      byYear,
      byReadStatus: { read: readRow.count, unread: unreadRow.count },
      byFlagStatus: { flagged: flaggedRow.count, unflagged: unflaggedRow.count }
    };
  }

  // Implementation of abstract methods
  protected async insertEntity(paper: Paper): Promise<void> {
    await this.dbRun(
      `INSERT INTO papers (
        id, libraryId, type, title, abstract, journal, booktitle, year, month, volume, number, pages, publisher, series, edition, editor, howPublished, organization, school, institution, address, doi, arxiv, isbn, issn, notes, flag, read, feedId, feedItemId, createdAt, createdByDeviceId, updatedAt, deletedAt, deletedByDeviceId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paper.id, paper.libraryId, paper.type, paper.title, paper.abstract, paper.journal, paper.booktitle, paper.year, paper.month, paper.volume, paper.number, paper.pages, paper.publisher, paper.series, paper.edition, paper.editor, paper.howPublished, paper.organization, paper.school, paper.institution, paper.address, paper.doi, paper.arxiv, paper.isbn, paper.issn, paper.notes, paper.flag ? 1 : 0, paper.read ? 1 : 0, paper.feedId, paper.feedItemId, paper.createdAt.toISOString(), paper.createdByDeviceId, paper.updatedAt.toISOString(), paper.deletedAt ? paper.deletedAt.toISOString() : null, paper.deletedByDeviceId
      ]
    );
  }

  protected rowToEntity(row: any): Paper {
    return {
      ...row,
      flag: row.flag === 1,
      read: row.read === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }

  protected serializeValue(value: any): any {
    if (typeof value === 'boolean') return value ? 1 : 0;
    if (value instanceof Date) return value.toISOString();
    return value;
  }
}
