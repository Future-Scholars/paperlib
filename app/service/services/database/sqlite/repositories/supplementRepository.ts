import sqlite3 from 'sqlite3';
import { Supplement, SupplementSchema } from '../models';

const DB_PATH = process.env.SQLITE_DB_PATH || 'paperlib.sqlite';

export class SupplementRepository {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.initTable();
  }

  private initTable() {
    this.db.run(`CREATE TABLE IF NOT EXISTS supplements (
      id TEXT PRIMARY KEY,
      paperId TEXT NOT NULL,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      createdAt TEXT NOT NULL,
      createdByDeviceId TEXT,
      updatedAt TEXT NOT NULL,
      deletedAt TEXT,
      deletedByDeviceId TEXT
    )`);
  }

  getAll(): Promise<Supplement[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM supplements WHERE deletedAt IS NULL',
        (err, rows) => {
          if (err) return reject(err);
          try {
            resolve(rows.map(row => SupplementSchema.parse(this.rowToSupplement(row))));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  getById(id: string): Promise<Supplement | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM supplements WHERE id = ? AND deletedAt IS NULL',
        [id],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          try {
            resolve(SupplementSchema.parse(this.rowToSupplement(row)));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  create(supplement: Supplement): Promise<void> {
    return new Promise((resolve, reject) => {
      const s = { ...supplement };
      this.db.run(
        `INSERT INTO supplements (
          id, paperId, name, value, type, description, createdAt, createdByDeviceId, updatedAt, deletedAt, deletedByDeviceId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          s.id, s.paperId, s.name, s.value, s.type, s.description, s.createdAt.toISOString(), s.createdByDeviceId, s.updatedAt.toISOString(), s.deletedAt ? s.deletedAt.toISOString() : null, s.deletedByDeviceId
        ],
        err => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  update(id: string, supplement: Partial<Supplement>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(supplement).filter(k => k !== 'id');
      if (fields.length === 0) return resolve();
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => {
        const v = (supplement as any)[f];
        if (v instanceof Date) return v.toISOString();
        return v;
      });
      this.db.run(
        `UPDATE supplements SET ${setClause} WHERE id = ?`,
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
        `UPDATE supplements SET deletedAt = ?, deletedByDeviceId = ? WHERE id = ?`,
        [deletedAt, deletedByDeviceId || null, id],
        err => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  findByPaper(paperId: string): Promise<Supplement[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM supplements WHERE paperId = ? AND deletedAt IS NULL`,
        [paperId],
        (err, rows) => {
          if (err) return reject(err);
          try {
            resolve(rows.map(row => SupplementSchema.parse(this.rowToSupplement(row))));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  private rowToSupplement(row: any): Supplement {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }
}

