import sqlite3 from 'sqlite3';
import { Tag, zTag } from '../models';

const DB_PATH = process.env.SQLITE_DB_PATH || 'paperlib.sqlite';

export class TagRepository {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.initTable();
  }

  private initTable() {
    this.db.run(`CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      colour TEXT,
      createdAt TEXT NOT NULL,
      createdByDeviceId TEXT,
      deletedAt TEXT,
      deletedByDeviceId TEXT
    )`);
    this.db.run(`CREATE TABLE IF NOT EXISTS paper_tags (
      id TEXT PRIMARY KEY,
      paperId TEXT NOT NULL,
      tagId TEXT NOT NULL,
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

  async getAll(): Promise<Tag[]> {
    const rows = await this.dbAll('SELECT * FROM tags WHERE deletedAt IS NULL');
    return rows.map(row => zTag.parse(this.rowToTag(row)));
  }

  async getById(id: string): Promise<Tag | null> {
    const row = await this.dbGet('SELECT * FROM tags WHERE id = ? AND deletedAt IS NULL', [id]);
    if (!row) return null;
    return zTag.parse(this.rowToTag(row));
  }

  async create(tag: Tag): Promise<void> {
    const t = { ...tag };
    await this.dbRun(
      `INSERT INTO tags (
        id, name, description, colour, createdAt, createdByDeviceId, deletedAt, deletedByDeviceId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id, t.name, t.description, t.colour, t.createdAt.toISOString(), t.createdByDeviceId, t.deletedAt ? t.deletedAt.toISOString() : null, t.deletedByDeviceId
      ]
    );
  }

  async update(id: string, tag: Partial<Tag>): Promise<void> {
    const fields = Object.keys(tag).filter(k => k !== 'id');
    if (fields.length === 0) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => {
      const v = (tag as any)[f];
      if (v instanceof Date) return v.toISOString();
      return v;
    });
    await this.dbRun(`UPDATE tags SET ${setClause} WHERE id = ?`, [...values, id]);
  }

  async delete(id: string, deletedByDeviceId?: string): Promise<void> {
    const deletedAt = new Date().toISOString();
    await this.dbRun(
      `UPDATE tags SET deletedAt = ?, deletedByDeviceId = ? WHERE id = ?`,
      [deletedAt, deletedByDeviceId || null, id]
    );
  }

  async findByPaper(paperId: string): Promise<Tag[]> {
    const rows = await this.dbAll(
      `SELECT t.* FROM tags t
       JOIN paper_tags pt ON t.id = pt.tagId
       WHERE pt.paperId = ? AND t.deletedAt IS NULL AND pt.op = 'add'`,
      [paperId]
    );
    return rows.map(row => zTag.parse(this.rowToTag(row)));
  }

  private rowToTag(row: any): Tag {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }
}
