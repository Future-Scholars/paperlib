import sqlite3 from 'sqlite3';
import { Tag, TagSchema } from '../models';

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

  getAll(): Promise<Tag[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM tags WHERE deletedAt IS NULL',
        (err, rows) => {
          if (err) return reject(err);
          try {
            resolve(rows.map(row => TagSchema.parse(this.rowToTag(row))));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  getById(id: string): Promise<Tag | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM tags WHERE id = ? AND deletedAt IS NULL',
        [id],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          try {
            resolve(TagSchema.parse(this.rowToTag(row)));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  create(tag: Tag): Promise<void> {
    return new Promise((resolve, reject) => {
      const t = { ...tag };
      this.db.run(
        `INSERT INTO tags (
          id, name, description, colour, createdAt, createdByDeviceId, deletedAt, deletedByDeviceId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.id, t.name, t.description, t.colour, t.createdAt.toISOString(), t.createdByDeviceId, t.deletedAt ? t.deletedAt.toISOString() : null, t.deletedByDeviceId
        ],
        err => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  update(id: string, tag: Partial<Tag>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(tag).filter(k => k !== 'id');
      if (fields.length === 0) return resolve();
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => {
        const v = (tag as any)[f];
        if (v instanceof Date) return v.toISOString();
        return v;
      });
      this.db.run(
        `UPDATE tags SET ${setClause} WHERE id = ?`,
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
        `UPDATE tags SET deletedAt = ?, deletedByDeviceId = ? WHERE id = ?`,
        [deletedAt, deletedByDeviceId || null, id],
        err => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  findByPaper(paperId: string): Promise<Tag[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT t.* FROM tags t
         JOIN paper_tags pt ON t.id = pt.tagId
         WHERE pt.paperId = ? AND t.deletedAt IS NULL AND pt.op = 'add'`,
        [paperId],
        (err, rows) => {
          if (err) return reject(err);
          try {
            resolve(rows.map(row => TagSchema.parse(this.rowToTag(row))));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  private rowToTag(row: any): Tag {
    return {
      ...row,
      createdAt: new Date(row.createdAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }
}

