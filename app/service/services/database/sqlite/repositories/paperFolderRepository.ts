import sqlite3 from 'sqlite3';
import { PaperFolder } from '../models';
import { BaseRepository } from '../repository';

export class PaperFolderRepository extends BaseRepository<PaperFolder> {
  constructor(db: sqlite3.Database) {
    super(db, 'paper_folders', 'paper_folder_field_versions');
  }

  // CRDT-friendly create with field versioning
  async createPaperFolder(paperFolder: Omit<PaperFolder, 'createdAt' | 'updatedAt' | 'createdByDeviceId'>, deviceId: string): Promise<void> {
    await this.create(paperFolder as PaperFolder, deviceId);
  }

  // CRDT-friendly update specific fields
  async updatePaperFolderField(id: string, field: keyof PaperFolder, value: any, deviceId: string): Promise<void> {
    await this.updateField(id, field, value, deviceId);
  }

  // CRDT-friendly soft delete
  async deletePaperFolder(id: string, deviceId: string): Promise<void> {
    await this.softDelete(id, deviceId);
  }

  // CRDT-friendly restore
  async restorePaperFolder(id: string, deviceId: string): Promise<void> {
    await this.restore(id, deviceId);
  }

  // Get all papers in a specific folder
  async getPapersByFolder(folderId: string, includeDeleted: boolean = false): Promise<PaperFolder[]> {
    const whereClause = includeDeleted 
      ? 'WHERE folderId = ?' 
      : 'WHERE folderId = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM paper_folders ${whereClause}`, [folderId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get all folders for a specific paper
  async getFoldersByPaper(paperId: string, includeDeleted: boolean = false): Promise<PaperFolder[]> {
    const whereClause = includeDeleted 
      ? 'WHERE paperId = ?' 
      : 'WHERE paperId = ? AND deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM paper_folders ${whereClause}`, [paperId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get papers in folder tree (recursive)
  async getPapersInFolderTree(folderId: string, includeDeleted: boolean = false): Promise<PaperFolder[]> {
    // This is a complex query that needs to traverse the folder tree
    // For now, we'll implement a simple version that gets papers in the current folder
    // In a production environment, you might want to use a recursive CTE or implement
    // a more sophisticated tree traversal algorithm
    
    const whereClause = includeDeleted 
      ? 'WHERE folderId = ?' 
      : 'WHERE folderId = ? AND deletedAt IS NULL';
    
    const rows = await this.dbAll(`SELECT * FROM paper_folders ${whereClause}`, [folderId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get papers in folder and all subfolders (recursive)
  async getPapersInFolderAndSubfolders(folderId: string, includeDeleted: boolean = false): Promise<PaperFolder[]> {
    // This would require a recursive query to get all subfolders
    // For now, we'll implement a simple version
    const whereClause = includeDeleted 
      ? 'WHERE folderId = ?' 
      : 'WHERE folderId = ? AND deletedAt IS NULL';
    
    const rows = await this.dbAll(`SELECT * FROM paper_folders ${whereClause}`, [folderId]);
    return rows.map(row => this.rowToEntity(row));
  }

  // Check if a paper is in a specific folder
  async isPaperInFolder(paperId: string, folderId: string, includeDeleted: boolean = false): Promise<boolean> {
    const whereClause = includeDeleted 
      ? 'WHERE paperId = ? AND folderId = ?' 
      : 'WHERE paperId = ? AND folderId = ? AND deletedAt IS NULL';
    
    const row = await this.dbGet(`SELECT id FROM paper_folders ${whereClause}`, [paperId, folderId]);
    return !!row;
  }

  // Get papers by folder path (breadcrumb)
  async getPapersByFolderPath(folderPath: string[], libraryId: string, includeDeleted: boolean = false): Promise<PaperFolder[]> {
    // This is a complex operation that requires joining with the folders table
    // For now, we'll implement a simplified version
    // In production, you'd want to implement proper path-based queries
    
    if (folderPath.length === 0) return [];
    
    const whereClause = includeDeleted 
      ? 'WHERE pf.folderId IN (SELECT id FROM folders WHERE name = ? AND libraryId = ?)' 
      : 'WHERE pf.folderId IN (SELECT id FROM folders WHERE name = ? AND libraryId = ? AND deletedAt IS NULL)';
    
    const rows = await this.dbAll(
      `SELECT pf.* FROM paper_folders pf ${whereClause}`,
      [folderPath[folderPath.length - 1], libraryId]
    );
    
    return rows.map(row => this.rowToEntity(row));
  }

  // Move paper between folders
  async movePaper(paperId: string, fromFolderId: string, toFolderId: string, deviceId: string): Promise<void> {
    const now = new Date();
    
    // Start transaction
    await this.dbRun('BEGIN TRANSACTION');
    
    try {
      // Soft delete the old relationship
      await this.softDelete(paperId, deviceId);
      
      // Create new relationship
      const newPaperFolder: PaperFolder = {
        id: `${paperId}_${toFolderId}_${now.getTime()}`,
        paperId,
        folderId: toFolderId,
        op: 'add',
        timestamp: now,
        deviceId,
        createdAt: now,
        updatedAt: now,
        deletedAt: undefined,
        deletedByDeviceId: undefined,
        createdByDeviceId: deviceId
      };
      
      await this.create(newPaperFolder, deviceId);
      
      await this.dbRun('COMMIT');
    } catch (error) {
      await this.dbRun('ROLLBACK');
      throw error;
    }
  }

  // Get folder statistics
  async getFolderStatistics(folderId: string, includeDeleted: boolean = false): Promise<{ total: number; active: number; deleted: number }> {
    const whereClause = includeDeleted 
      ? 'WHERE folderId = ?' 
      : 'WHERE folderId = ? AND deletedAt IS NULL';
    
    const [total, active, deleted] = await Promise.all([
      this.dbGet(`SELECT COUNT(*) as count FROM paper_folders WHERE folderId = ?`, [folderId]),
      this.dbGet(`SELECT COUNT(*) as count FROM paper_folders ${whereClause}`, [folderId]),
      this.dbGet(`SELECT COUNT(*) as count FROM paper_folders WHERE folderId = ? AND deletedAt IS NOT NULL`, [folderId])
    ]);

    return {
      total: total.count,
      active: active.count,
      deleted: deleted.count
    };
  }

  // Get paper statistics
  async getPaperStatistics(paperId: string, includeDeleted: boolean = false): Promise<{ total: number; active: number; deleted: number }> {
    const whereClause = includeDeleted 
      ? 'WHERE paperId = ?' 
      : 'WHERE paperId = ? AND deletedAt IS NULL';
    
    const [total, active, deleted] = await Promise.all([
      this.dbGet(`SELECT COUNT(*) as count FROM paper_folders WHERE paperId = ?`, [paperId]),
      this.dbGet(`SELECT COUNT(*) as count FROM paper_folders ${whereClause}`, [paperId]),
      this.dbGet(`SELECT COUNT(*) as count FROM paper_folders WHERE paperId = ? AND deletedAt IS NOT NULL`, [paperId])
    ]);

    return {
      total: total.count,
      active: active.count,
      deleted: deleted.count
    };
  }

  // Search papers in folders by criteria
  async searchPapersInFolders(
    query: string, 
    folderIds: string[], 
    includeDeleted: boolean = false
  ): Promise<PaperFolder[]> {
    if (folderIds.length === 0) return [];
    
    const placeholders = folderIds.map(() => '?').join(',');
    const whereClause = includeDeleted 
      ? `WHERE folderId IN (${placeholders})` 
      : `WHERE folderId IN (${placeholders}) AND deletedAt IS NULL`;
    
    const rows = await this.dbAll(`SELECT * FROM paper_folders ${whereClause}`, folderIds);
    return rows.map(row => this.rowToEntity(row));
  }

  // Bulk operations
  async bulkAddPapersToFolder(paperIds: string[], folderId: string, deviceId: string): Promise<void> {
    const now = new Date();
    
    // Start transaction
    await this.dbRun('BEGIN TRANSACTION');
    
    try {
      for (const paperId of paperIds) {
        const paperFolder: PaperFolder = {
          id: `${paperId}_${folderId}_${now.getTime()}_${Math.random()}`,
          paperId,
          folderId,
          op: 'add',
          timestamp: now,
          deviceId,
          createdAt: now,
          updatedAt: now,
          deletedAt: undefined,
          deletedByDeviceId: undefined,
          createdByDeviceId: deviceId
        };
        
        await this.create(paperFolder, deviceId);
      }
      
      await this.dbRun('COMMIT');
    } catch (error) {
      await this.dbRun('ROLLBACK');
      throw error;
    }
  }

  async bulkRemovePapersFromFolder(paperIds: string[], folderId: string, deviceId: string): Promise<void> {
    const now = new Date();
    
    // Start transaction
    await this.dbRun('BEGIN TRANSACTION');
    
    try {
      for (const paperId of paperIds) {
        // Find the existing relationship and soft delete it
        const existing = await this.dbGet(
          'SELECT id FROM paper_folders WHERE paperId = ? AND folderId = ? AND deletedAt IS NULL',
          [paperId, folderId]
        );
        
        if (existing) {
          await this.softDelete(existing.id, deviceId);
        }
      }
      
      await this.dbRun('COMMIT');
    } catch (error) {
      await this.dbRun('ROLLBACK');
      throw error;
    }
  }

  // Implementation of abstract methods
  protected async insertEntity(entity: PaperFolder): Promise<void> {
    const fields = Object.keys(entity).filter(key => entity[key] !== undefined);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(field => this.serializeValue(entity[field as keyof PaperFolder]));
    
    await this.dbRun(
      `INSERT INTO paper_folders (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );
  }

  protected rowToEntity(row: any): PaperFolder {
    return {
      id: row.id,
      paperId: row.paperId,
      folderId: row.folderId,
      op: row.op,
      timestamp: new Date(row.timestamp),
      deviceId: row.deviceId,
      createdAt: new Date(row.createdAt),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
      deletedByDeviceId: row.deletedByDeviceId,
      createdByDeviceId: row.createdByDeviceId
    };
  }

  protected serializeValue(value: any): any {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    return value;
  }
}
