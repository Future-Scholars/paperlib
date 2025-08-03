import sqlite3 from 'sqlite3';
import { Paper, zPaper } from '../models';

const DB_PATH = process.env.SQLITE_DB_PATH || 'paperlib.sqlite';

export class PaperRepository {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.initTable();
  }

  private initTable() {
    this.db.run(`CREATE TABLE IF NOT EXISTS papers (
      id TEXT PRIMARY KEY,
      libraryId TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      abstract TEXT,
      journal TEXT,
      booktitle TEXT,
      year INTEGER,
      month INTEGER,
      volume TEXT,
      number TEXT,
      pages TEXT,
      publisher TEXT,
      series TEXT,
      edition TEXT,
      editor TEXT,
      howPublished TEXT,
      organization TEXT,
      school TEXT,
      institution TEXT,
      address TEXT,
      doi TEXT,
      arxiv TEXT,
      isbn TEXT,
      issn TEXT,
      notes TEXT,
      flag INTEGER,
      read INTEGER,
      feedId TEXT,
      feedItemId TEXT,
      createdAt TEXT NOT NULL,
      createdByDeviceId TEXT,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      deletedByDeviceId TEXT
    )`);
  }

  private async dbAll(sql: string, params?: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params || [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  private async dbGet(sql: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params || [], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  private async dbRun(sql: string, params?: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params || [], err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async getAll(): Promise<Paper[]> {
    const rows = await this.dbAll('SELECT * FROM papers WHERE deletedAt IS NULL');
    return rows.map(row => zPaper.parse(this.rowToPaper(row)));
  }

  async getById(id: string): Promise<Paper | null> {
    const row = await this.dbGet('SELECT * FROM papers WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!row) return null;
    return zPaper.parse(this.rowToPaper(row));
  }

  async create(paper: Paper): Promise<void> {
    const p = { ...paper };
    await this.dbRun(
      `INSERT INTO papers (
        id, libraryId, type, title, abstract, journal, booktitle, year, month, volume, number, pages, publisher, series, edition, editor, howPublished, organization, school, institution, address, doi, arxiv, isbn, issn, notes, flag, read, feedId, feedItemId, createdAt, createdByDeviceId, updatedAt, deletedAt, deletedByDeviceId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id, p.libraryId, p.type, p.title, p.abstract, p.journal, p.booktitle, p.year, p.month, p.volume, p.number, p.pages, p.publisher, p.series, p.edition, p.editor, p.howPublished, p.organization, p.school, p.institution, p.address, p.doi, p.arxiv, p.isbn, p.issn, p.notes, p.flag ? 1 : 0, p.read ? 1 : 0, p.feedId, p.feedItemId, p.createdAt.toISOString(), p.createdByDeviceId, p.updatedAt.toISOString(), p.deletedAt ? p.deletedAt.toISOString() : null, p.deletedByDeviceId
      ]
    );
  }

  async update(id: string, paper: Partial<Paper>): Promise<void> {
    const fields = Object.keys(paper).filter(k => k !== 'id');
    if (fields.length === 0) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
      const v = (paper as any)[f];
      if (f === 'flag' || f === 'read') return v ? 1 : 0;
      if (v instanceof Date) return v.toISOString();
      return v;
    });
    await this.dbRun(`UPDATE papers SET ${setClause} WHERE id = ?`, [...values, id]);
  }

  async delete(id: string, deletedByDeviceId?: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    await this.dbRun(
      `UPDATE papers SET deletedAt = ?, deletedByDeviceId = ? WHERE id = ?`,
      [deletedAt, deletedByDeviceId || null, id]
    );
  }

  private rowToPaper(row: any): Paper {
    return {
      ...row,
      flag: row.flag === 1,
      read: row.read === 1,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }
}
