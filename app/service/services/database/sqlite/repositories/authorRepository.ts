import sqlite3 from 'sqlite3';
import { Author, zAuthor } from '../models';

const DB_PATH = process.env.SQLITE_DB_PATH || 'paperlib.sqlite';

export class AuthorRepository {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.initTable();
  }

  private initTable() {
    this.db.run(`CREATE TABLE IF NOT EXISTS authors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      affiliation TEXT,
      email TEXT,
      orcid TEXT,
      firstName TEXT,
      lastName TEXT,
      createdAt TEXT NOT NULL,
      createdByDeviceId TEXT,
      deletedAt TEXT,
      deletedByDeviceId TEXT
    )`);
    this.db.run(`CREATE TABLE IF NOT EXISTS paper_authors (
      id TEXT PRIMARY KEY,
      paperId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      op TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      deviceId TEXT
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

  async getAll(): Promise<Author[]> {
    const rows = await this.dbAll('SELECT * FROM authors WHERE deletedAt IS NULL');
    return rows.map(row => zAuthor.parse(this.rowToAuthor(row)));
  }

  async getById(id: string): Promise<Author | null> {
    const row = await this.dbGet('SELECT * FROM authors WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!row) return null;
    return zAuthor.parse(this.rowToAuthor(row));
  }

  async create(author: Author): Promise<void> {
    const a = { ...author };
    await this.dbRun(
      `INSERT INTO authors (
        id, name, affiliation, email, orcid, firstName, lastName, createdAt, createdByDeviceId, deletedAt, deletedByDeviceId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        a.id, a.name, a.affiliation, a.email, a.orcid, a.firstName, a.lastName, a.createdAt.toISOString(), a.createdByDeviceId, a.deletedAt ? a.deletedAt.toISOString() : null, a.deletedByDeviceId
      ]
    );
  }

  async update(id: string, author: Partial<Author>): Promise<void> {
    const fields = Object.keys(author).filter(k => k !== 'id');
    if (fields.length === 0) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
      const v = (author as any)[f];
      if (v instanceof Date) return v.toISOString();
      return v;
    });
    await this.dbRun(`UPDATE authors SET ${setClause} WHERE id = ?`, [...values, id]);
  }

  async delete(id: string, deletedByDeviceId?: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    await this.dbRun(
      `UPDATE authors SET deletedAt = ?, deletedByDeviceId = ? WHERE id = ?`,
      [deletedAt, deletedByDeviceId || null, id]
    );
  }

  async findByPaper(paperId: string): Promise<Author[]> {
    const rows = await this.dbAll(
      `SELECT a.* FROM authors a
       JOIN paper_authors pa ON a.id = pa.authorId
       WHERE pa.paperId = ? AND a.deletedAt IS NULL AND pa.op = 'add'`,
      [paperId]
    );
    return rows.map(row => zAuthor.parse(this.rowToAuthor(row)));
  }

  private rowToAuthor(row: any): Author {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }
}
