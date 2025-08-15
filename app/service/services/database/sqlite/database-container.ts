import sqlite3 from 'sqlite3';
import { PaperRepository } from './repositories/paperRepository';
import { AuthorRepository } from './repositories/authorRepository';
import { TagRepository } from './repositories/tagRepository';
import { SupplementRepository } from './repositories/supplementRepository';
import { LibraryRepository } from './repositories/libraryRepository';
import { FeedRepository } from './repositories/feedRepository';
import { FolderRepository } from './repositories/folderRepository';
import { PaperAuthorRepository } from './repositories/paperAuthorRepository';
import { PaperTagRepository } from './repositories/paperTagRepository';
import { PaperFolderRepository } from './repositories/paperFolderRepository';
import { LibraryShareRepository } from './repositories/libraryShareRepository';

export interface DatabaseConfig {
  databasePath: string;
  verbose?: boolean;
}

export interface DatabaseContainer {
  // Database connection
  db: sqlite3.Database;
  
  // Entity repositories
  papers: PaperRepository;
  authors: AuthorRepository;
  tags: TagRepository;
  supplements: SupplementRepository;
  libraries: LibraryRepository;
  feeds: FeedRepository;
  folders: FolderRepository;
  
  // Relationship repositories
  paperAuthors: PaperAuthorRepository;
  paperTags: PaperTagRepository;
  paperFolders: PaperFolderRepository;
  
  // Special repositories
  libraryShares: LibraryShareRepository;
  
  // Database management
  initialize(): Promise<void>;
  close(): Promise<void>;
  getVersion(): Promise<string>;
  setVersion(version: string): Promise<void>;
}

export class SQLiteDatabaseContainer implements DatabaseContainer {
  public db: sqlite3.Database;
  public papers: PaperRepository;
  public authors: AuthorRepository;
  public tags: TagRepository;
  public supplements: SupplementRepository;
  public libraries: LibraryRepository;
  public feeds: FeedRepository;
  public folders: FolderRepository;
  public paperAuthors: PaperAuthorRepository;
  public paperTags: PaperTagRepository;
  public paperFolders: PaperFolderRepository;
  public libraryShares: LibraryShareRepository;

  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
    
    // Initialize database connection
    this.db = new sqlite3.Database(config.databasePath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        if (config.verbose) {
          console.log('Connected to SQLite database:', config.databasePath);
        }
      }
    });

    // Enable foreign keys
    this.db.run('PRAGMA foreign_keys = ON');
    
    // Initialize repositories
    this.papers = new PaperRepository(this.db);
    this.authors = new AuthorRepository(this.db);
    this.tags = new TagRepository(this.db);
    this.supplements = new SupplementRepository(this.db);
    this.libraries = new LibraryRepository(this.db);
    this.feeds = new FeedRepository(this.db);
    this.folders = new FolderRepository(this.db);
    this.paperAuthors = new PaperAuthorRepository(this.db);
    this.paperTags = new PaperTagRepository(this.db);
    this.paperFolders = new PaperFolderRepository(this.db);
    this.libraryShares = new LibraryShareRepository(this.db);

  }

  async initialize(): Promise<void> {
    try {
      // Run migrations
      await this.runMigrations();
      
      // Initialize database version if not exists
      await this.ensureVersionTable();
      
      if (this.config.verbose) {
        console.log('Database initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  private async runMigrations(): Promise<void> {
    // For now, we'll just ensure the database is created
    // In a real implementation, you'd run migration files in order
    return new Promise((resolve, reject) => {
      this.db.run('SELECT 1', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  private async ensureVersionTable(): Promise<void> {
    const version = await this.getVersion();
    if (!version) {
      await this.setVersion('1.0.0');
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          if (this.config.verbose) {
            console.log('Database connection closed');
          }
          resolve();
        }
      });
    });
  }

  async getVersion(): Promise<string> {
    try {
      const row = await this.getDbRow('SELECT version FROM db_version ORDER BY createdAt DESC LIMIT 1');
      return row ? row.version : '';
    } catch (error) {
      return '';
    }
  }

  async setVersion(version: string): Promise<void> {
    const id = `version_${Date.now()}`;
    const now = new Date().toISOString();
    const deviceId = 'system';
    
    await this.runDb(
      `INSERT INTO db_version (id, version, createdAt, createdByDeviceId) VALUES (?, ?, ?, ?)`,
      [id, version, now, deviceId]
    );
  }

  // Helper methods for database operations
  private async getDbRow(sql: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params || [], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  private async runDb(sql: string, params?: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params || [], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  // Transaction support
  async transaction<T>(operation: () => Promise<T>): Promise<T> {
    await this.runDb('BEGIN TRANSACTION');
    
    try {
      const result = await operation();
      await this.runDb('COMMIT');
      return result;
    } catch (error) {
      await this.runDb('ROLLBACK');
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.getDbRow('SELECT 1 as health');
      return result && result.health === 1;
    } catch (error) {
      return false;
    }
  }

  // Get database statistics
  async getDatabaseStats(): Promise<{
    totalPapers: number;
    totalAuthors: number;
    totalTags: number;
    totalLibraries: number;
    totalFeeds: number;
    totalFolders: number;
    databaseSize: number;
  }> {
    try {
      const [
        papersCount,
        authorsCount,
        tagsCount,
        librariesCount,
        feedsCount,
        foldersCount
      ] = await Promise.all([
        this.papers.getStatistics(),
        this.authors.getStatistics(),
        this.tags.getStatistics(),
        this.libraries.getStatistics(),
        this.feeds.getStatistics(),
        this.folders.getStatistics()
      ]);

      // Get database file size
      const fs = require('fs');
      const stats = fs.statSync(this.config.databasePath);
      const databaseSize = stats.size;

      return {
        totalPapers: papersCount.total,
        totalAuthors: authorsCount.total,
        totalTags: tagsCount.total,
        totalLibraries: librariesCount.total,
        totalFeeds: feedsCount.total,
        totalFolders: foldersCount.total,
        databaseSize
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      throw error;
    }
  }
}

// Factory function to create database container
export function createDatabaseContainer(config: DatabaseConfig): DatabaseContainer {
  return new SQLiteDatabaseContainer(config);
}

// Default configuration
export const defaultDatabaseConfig: DatabaseConfig = {
  databasePath: './paperlib.sqlite',
  verbose: false
};

