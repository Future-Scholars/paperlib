import sqlite3 from 'sqlite3';
import { RelationshipOperation } from './repository';

export abstract class RelationshipRepository {
  protected db: sqlite3.Database;
  protected tableName: string;

  constructor(db: sqlite3.Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  protected async dbAll(sql: string, params?: any[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params || [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  protected async dbGet(sql: string, params?: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params || [], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  protected async dbRun(sql: string, params?: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params || [], err => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  // CRDT-friendly add relationship
  async addRelationship(entityId: string, relatedId: string, deviceId: string): Promise<void> {
    const now = new Date();
    const id = `${entityId}_${relatedId}_${now.getTime()}`;
    
    await this.dbRun(
      `INSERT INTO ${this.tableName} (id, ${this.getEntityIdField()}, ${this.getRelatedIdField()}, op, timestamp, deviceId, createdAt, createdByDeviceId)
       VALUES (?, ?, ?, 'add', ?, ?, ?, ?)`,
      [id, entityId, relatedId, now.toISOString(), deviceId, now.toISOString(), deviceId]
    );
  }

  // CRDT-friendly remove relationship
  async removeRelationship(entityId: string, relatedId: string, deviceId: string): Promise<void> {
    const now = new Date();
    const id = `${entityId}_${relatedId}_${now.getTime()}`;
    
    await this.dbRun(
      `INSERT INTO ${this.tableName} (id, ${this.getEntityIdField()}, ${this.getRelatedIdField()}, op, timestamp, deviceId, createdAt, createdByDeviceId)
       VALUES (?, ?, ?, 'remove', ?, ?, ?, ?)`,
      [id, entityId, relatedId, now.toISOString(), deviceId, now.toISOString(), deviceId]
    );
  }

  // CRDT-friendly soft delete relationship
  async softDeleteRelationship(entityId: string, relatedId: string, deviceId: string): Promise<void> {
    const now = new Date();
    await this.dbRun(
      `UPDATE ${this.tableName} SET deletedAt = ?, deletedByDeviceId = ? WHERE ${this.getEntityIdField()} = ? AND ${this.getRelatedIdField()} = ?`,
      [now.toISOString(), deviceId, entityId, relatedId]
    );
  }

  // CRDT-friendly restore relationship
  async restoreRelationship(entityId: string, relatedId: string, deviceId: string): Promise<void> {
    await this.dbRun(
      `UPDATE ${this.tableName} SET deletedAt = NULL, deletedByDeviceId = NULL WHERE ${this.getEntityIdField()} = ? AND ${this.getRelatedIdField()} = ?`,
      [entityId, relatedId]
    );
  }

  // Get all active relationships for an entity
  async getActiveRelationships(entityId: string, includeDeleted: boolean = false): Promise<string[]> {
    let whereClause = `WHERE ${this.getEntityIdField()} = ?`;
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(
      `SELECT ${this.getRelatedIdField()}, op, timestamp, deviceId
       FROM ${this.tableName}
       ${whereClause}
       ORDER BY timestamp ASC`,
      [entityId]
    );

    const relationships = new Map<string, { op: string; timestamp: Date; deviceId: string }>();
    
    for (const row of rows) {
      const relatedId = row[this.getRelatedIdField()];
      const existing = relationships.get(relatedId);
      
      if (!existing || row.timestamp > existing.timestamp) {
        relationships.set(relatedId, {
          op: row.op,
          timestamp: new Date(row.timestamp),
          deviceId: row.deviceId
        });
      }
    }

    // Return only active (add) relationships
    return Array.from(relationships.entries())
      .filter(([_, info]) => info.op === 'add')
      .map(([relatedId, _]) => relatedId);
  }

  // Get relationship operations since a timestamp for sync
  async getRelationshipChangesSince(timestamp: Date, deviceId?: string, includeDeleted: boolean = false): Promise<RelationshipOperation[]> {
    let whereClause = 'WHERE timestamp > ?';
    const params: any[] = [timestamp.toISOString()];
    
    if (deviceId) {
      whereClause += ' AND createdByDeviceId != ?';
      params.push(deviceId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(
      `SELECT id, ${this.getEntityIdField()}, ${this.getRelatedIdField()}, op, timestamp, deviceId
       FROM ${this.tableName}
       ${whereClause}
       ORDER BY timestamp ASC`,
      params
    );

    return rows.map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      deviceId: row.deviceId,
      op: row.op as 'add' | 'remove'
    }));
  }

  // Apply remote relationship changes (for sync)
  async applyRemoteRelationshipChange(operation: RelationshipOperation, entityId: string, relatedId: string): Promise<void> {
    // Check if this operation already exists
    const existing = await this.dbGet(
      `SELECT id FROM ${this.tableName} 
       WHERE ${this.getEntityIdField()} = ? AND ${this.getRelatedIdField()} = ? AND deviceId = ? AND timestamp = ?`,
      [entityId, relatedId, operation.deviceId, operation.timestamp.toISOString()]
    );

    if (!existing) {
      await this.dbRun(
        `INSERT INTO ${this.tableName} (id, ${this.getEntityIdField()}, ${this.getRelatedIdField()}, op, timestamp, deviceId, createdAt, createdByDeviceId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [operation.id, entityId, relatedId, operation.op, operation.timestamp.toISOString(), operation.deviceId, operation.timestamp.toISOString(), operation.deviceId]
      );
    }
  }

  // Get all relationship operations for conflict resolution
  async getAllOperations(entityId: string, relatedId: string, includeDeleted: boolean = false): Promise<RelationshipOperation[]> {
    let whereClause = `WHERE ${this.getEntityIdField()} = ? AND ${this.getRelatedIdField()} = ?`;
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(
      `SELECT id, op, timestamp, deviceId
       FROM ${this.tableName}
       ${whereClause}
       ORDER BY timestamp ASC`,
      [entityId, relatedId]
    );

    return rows.map(row => ({
      id: row.id,
      timestamp: new Date(row.timestamp),
      deviceId: row.deviceId,
      op: row.op as 'add' | 'remove'
    }));
  }

  // Get relationship statistics
  async getRelationshipStatistics(entityId?: string): Promise<{
    totalRelationships: number;
    activeRelationships: number;
    deletedRelationships: number;
    relationshipsByOperation: { op: string; count: number }[];
  }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (entityId) {
      whereClause = `WHERE ${this.getEntityIdField()} = ?`;
      params.push(entityId);
    }
    
    // Get total relationships
    const totalRow = await this.dbGet(`SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`, params);
    const totalRelationships = totalRow.count;
    
    // Get active relationships (not deleted)
    const activeRow = await this.dbGet(`SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause} AND deletedAt IS NULL`, params);
    const activeRelationships = activeRow.count;
    
    // Get deleted relationships
    const deletedRow = await this.dbGet(`SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause} AND deletedAt IS NOT NULL`, params);
    const deletedRelationships = deletedRow.count;
    
    // Get relationships by operation
    const operationRows = await this.dbAll(
      `SELECT op, COUNT(*) as count FROM ${this.tableName} ${whereClause} GROUP BY op`,
      params
    );
    const relationshipsByOperation = operationRows.map(row => ({
      op: row.op,
      count: row.count
    }));
    
    return {
      totalRelationships,
      activeRelationships,
      deletedRelationships,
      relationshipsByOperation
    };
  }

  // Get relationships changed since timestamp for sync
  async getRelationshipsChangedSince(timestamp: Date, deviceId?: string, includeDeleted: boolean = false): Promise<any[]> {
    let whereClause = 'WHERE updatedAt > ?';
    const params: any[] = [timestamp.toISOString()];
    
    if (deviceId) {
      whereClause += ' AND createdByDeviceId != ?';
      params.push(deviceId);
    }
    
    if (!includeDeleted) {
      whereClause += ' AND deletedAt IS NULL';
    }
    
    const rows = await this.dbAll(
      `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY updatedAt ASC`,
      params
    );
    
    return rows;
  }

  // Abstract methods to be implemented by subclasses
  protected abstract getEntityIdField(): string;
  protected abstract getRelatedIdField(): string;
}

