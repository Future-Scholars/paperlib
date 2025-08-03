import sqlite3 from 'sqlite3';
import { Author, AuthorSchema } from '../models';

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

  getAll(): Promise<Author[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM authors WHERE deletedAt IS NULL',
        (err, rows) => {
          if (err) return reject(err);
          try {
            resolve(rows.map(row => AuthorSchema.parse(this.rowToAuthor(row))));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  getById(id: string): Promise<Author | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM authors WHERE id = ? AND deletedAt IS NULL',
        [id],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          try {
            resolve(AuthorSchema.parse(this.rowToAuthor(row)));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  create(author: Author): Promise<void> {
    return new Promise((resolve, reject) => {
      const a = { ...author };
      this.db.run(
        `INSERT INTO authors (
          id, name, affiliation, email, orcid, firstName, lastName, createdAt, createdByDeviceId, deletedAt, deletedByDeviceId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          a.id, a.name, a.affiliation, a.email, a.orcid, a.firstName, a.lastName, a.createdAt.toISOString(), a.createdByDeviceId, a.deletedAt ? a.deletedAt.toISOString() : null, a.deletedByDeviceId
        ],
        err => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  update(id: string, author: Partial<Author>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(author).filter(k => k !== 'id');
      if (fields.length === 0) return resolve();
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => {
        const v = (author as any)[f];
        if (v instanceof Date) return v.toISOString();
        return v;
      });
      this.db.run(
        `UPDATE authors SET ${setClause} WHERE id = ?`,
        [...values, id],
        err => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  delete(id: string, deletedByDeviceId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const deletedAt = new Date().toISOString();
      this.db.run(
        `UPDATE authors SET deletedAt = ?, deletedByDeviceId = ? WHERE id = ?`,
        [deletedAt, deletedByDeviceId || null, id],
        err => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  findByPaper(paperId: string): Promise<Author[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT a.* FROM authors a
         JOIN paper_authors pa ON a.id = pa.authorId
         WHERE pa.paperId = ? AND a.deletedAt IS NULL AND pa.op = 'add'`,
        [paperId],
        (err, rows) => {
          if (err) return reject(err);
          try {
            resolve(rows.map(row => AuthorSchema.parse(this.rowToAuthor(row))));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  private rowToAuthor(row: any): Author {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }
}

