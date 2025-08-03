import sqlite3 from 'sqlite3';
import { Supplement, zSupplement } from '../models';

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

  async getAll(): Promise<Supplement[]> {
    const rows = await this.dbAll('SELECT * FROM supplements WHERE deletedAt IS NULL');
    return rows.map(row => zSupplement.parse(this.rowToSupplement(row)));
  }

  async getById(id: string): Promise<Supplement | null> {
    const row = await this.dbGet('SELECT * FROM supplements WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!row) return null;
    return zSupplement.parse(this.rowToSupplement(row));
  }

  async create(supplement: Supplement): Promise<void> {
    const s = { ...supplement };
    await this.dbRun(
      `INSERT INTO supplements (
        id, paperId, name, value, type, description, createdAt, createdByDeviceId, updatedAt, deletedAt, deletedByDeviceId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id, s.paperId, s.name, s.value, s.type, s.description, s.createdAt.toISOString(), s.createdByDeviceId, s.updatedAt.toISOString(), s.deletedAt ? s.deletedAt.toISOString() : null, s.deletedByDeviceId
      ]
    );
  }

  async update(id: string, supplement: Partial<Supplement>): Promise<void> {
    const fields = Object.keys(supplement).filter(k => k !== 'id');
    if (fields.length === 0) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
      const v = (supplement as any)[f];
      if (v instanceof Date) return v.toISOString();
      return v;
    });
    await this.dbRun(`UPDATE supplements SET ${setClause} WHERE id = ?`, [...values, id]);
  }

  async delete(id: string, deletedByDeviceId?: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    await this.dbRun(
      `UPDATE supplements SET deletedAt = ?, deletedByDeviceId = ? WHERE id = ?`,
      [deletedAt, deletedByDeviceId || null, id]
    );
  }

  async findByPaper(paperId: string): Promise<Supplement[]> {
    const rows = await this.dbAll(
      `SELECT * FROM supplements WHERE paperId = ? AND deletedAt IS NULL`,
      [paperId]
    );
    return rows.map(row => zSupplement.parse(this.rowToSupplement(row)));
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
