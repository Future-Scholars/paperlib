import sqlite3 from 'sqlite3';
import { Paper, PaperSchema } from '../models';

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

  getAll(): Promise<Paper[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM papers WHERE deletedAt IS NULL',
        (err, rows) => {
          if (err) return reject(err);
          try {
            resolve(rows.map(row => PaperSchema.parse(this.rowToPaper(row))));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  getById(id: string): Promise<Paper | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM papers WHERE id = ? AND deletedAt IS NULL',
        [id],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          try {
            resolve(PaperSchema.parse(this.rowToPaper(row)));
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  }

  create(paper: Paper): Promise<void> {
    return new Promise((resolve, reject) => {
      const p = { ...paper };
      this.db.run(
        `INSERT INTO papers (
          id, libraryId, type, title, abstract, journal, booktitle, year, month, volume, number, pages, publisher, series, edition, editor, howPublished, organization, school, institution, address, doi, arxiv, isbn, issn, notes, flag, read, feedId, feedItemId, createdAt, createdByDeviceId, updatedAt, deletedAt, deletedByDeviceId
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id, p.libraryId, p.type, p.title, p.abstract, p.journal, p.booktitle, p.year, p.month, p.volume, p.number, p.pages, p.publisher, p.series, p.edition, p.editor, p.howPublished, p.organization, p.school, p.institution, p.address, p.doi, p.arxiv, p.isbn, p.issn, p.notes, p.flag ? 1 : 0, p.read ? 1 : 0, p.feedId, p.feedItemId, p.createdAt.toISOString(), p.createdByDeviceId, p.updatedAt.toISOString(), p.deletedAt ? p.deletedAt.toISOString() : null, p.deletedByDeviceId
        ],
        err => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  }

  update(id: string, paper: Partial<Paper>): Promise<void> {
    return new Promise((resolve, reject) => {
      // Only update fields present in paper
      const fields = Object.keys(paper).filter(k => k !== 'id');
      if (fields.length === 0) return resolve();
      const setClause = fields.map(f => `${f} = ?`).join(', ');
      const values = fields.map(f => {
        const v = (paper as any)[f];
        if (f === 'flag' || f === 'read') return v ? 1 : 0;
        if (v instanceof Date) return v.toISOString();
        return v;
      });
      this.db.run(
        `UPDATE papers SET ${setClause} WHERE id = ?`,
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
        `UPDATE papers SET deletedAt = ?, deletedByDeviceId = ? WHERE id = ?`,
        [deletedAt, deletedByDeviceId || null, id],
        err => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
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

