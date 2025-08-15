import sqlite3 from 'sqlite3';

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
  createdByDeviceId?: string | null;
  deletedByDeviceId?: string | null;
}

export interface FieldVersion {
  id: string;
  timestamp: Date;
  field: string;
  deviceId: string;
  hash?: string | null;
}

export interface RelationshipOperation {
  id: string;
  timestamp: Date;
  deviceId: string;
  op: 'add' | 'remove';
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected db: sqlite3.Database;
  protected tableName: string;
  protected fieldVersionTableName: string;

  constructor(db: sqlite3.Database, tableName: string, fieldVersionTableName: string) {
    this.db = db;
    this.tableName = tableName;
    this.fieldVersionTableName = fieldVersionTableName;
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

  protected async dbRunWithResult(sql: string, params?: any[]): Promise<sqlite3.RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params || [], function(err) {
        if (err) return reject(err);
        resolve(this);
      });
    });
  }

  // CRDT-friendly create operation
  async create(entity: T, deviceId: string): Promise<void> {
    const now = new Date();
    const entityWithTimestamps = {
      ...entity,
      createdAt: now,
      updatedAt: now,
      createdByDeviceId: deviceId,
    };

    await this.insertEntity(entityWithTimestamps);
    
    // Create field versions for all non-null fields
    await this.createFieldVersions(entity.id, entityWithTimestamps, deviceId);
  }

  // CRDT-friendly update operation
  async updateField(id: string, field: string, value: any, deviceId: string): Promise<void> {
    const now = new Date();
    
    // Update the entity
    await this.dbRun(
      `UPDATE ${this.tableName} SET ${field} = ?, updatedAt = ? WHERE id = ?`,
      [this.serializeValue(value), now.toISOString(), id]
    );

    // Create field version
    await this.createFieldVersion(id, field, value, now, deviceId);
  }

  // CRDT-friendly soft delete
  async softDelete(id: string, deviceId: string): Promise<void> {
    const now = new Date();
    await this.dbRun(
      `UPDATE ${this.tableName} SET deletedAt = ?, deletedByDeviceId = ? WHERE id = ?`,
      [now.toISOString(), deviceId, id]
    );

    // Create field version for deletion
    await this.createFieldVersion(id, 'deletedAt', now, now, deviceId);
  }

  // CRDT-friendly restore
  async restore(id: string, deviceId: string): Promise<void> {
    const now = new Date();
    await this.dbRun(
      `UPDATE ${this.tableName} SET deletedAt = NULL, deletedByDeviceId = NULL, updatedAt = ? WHERE id = ?`,
      [now.toISOString(), id]
    );

    // Create field version for restoration
    await this.createFieldVersion(id, 'deletedAt', null, now, deviceId);
  }

  // Get entity by ID (including soft-deleted ones for sync)
  async getById(id: string, includeDeleted: boolean = false): Promise<T | null> {
    const whereClause = includeDeleted ? 'WHERE id = ?' : 'WHERE id = ? AND deletedAt IS NULL';
    const row = await this.dbGet(`SELECT * FROM ${this.tableName} ${whereClause}`, [id]);
    if (!row) return null;
    return this.rowToEntity(row);
  }

  // Get all entities (excluding soft-deleted ones by default)
  async getAll(includeDeleted: boolean = false): Promise<T[]> {
    const whereClause = includeDeleted ? '' : 'WHERE deletedAt IS NULL';
    const rows = await this.dbAll(`SELECT * FROM ${this.tableName} ${whereClause}`);
    return rows.map(row => this.rowToEntity(row));
  }

  // Get changes since a specific timestamp for sync
  async getChangesSince(timestamp: Date, deviceId?: string): Promise<{ entity: T; fieldVersions: FieldVersion[] }[]> {
    const deviceFilter = deviceId ? 'AND fv.deviceId != ?' : '';
    const params = deviceId ? [timestamp.toISOString(), deviceId] : [timestamp.toISOString()];
    
    // Get the entity ID field name from the field version table
    const entityIdField = this.getEntityIdFieldName();
    
    const rows = await this.dbAll(
      `SELECT DISTINCT e.*, fv.field as field, fv.timestamp as fieldTimestamp, fv.deviceId as fieldDeviceId, fv.hash
       FROM ${this.tableName} e
       JOIN ${this.fieldVersionTableName} fv ON e.id = fv.${entityIdField}
       WHERE fv.timestamp > ? ${deviceFilter}
       ORDER BY fv.timestamp ASC`,
      params
    );

    // Group by entity and collect field versions
    const entityMap = new Map<string, { entity: T; fieldVersions: FieldVersion[] }>();
    
    for (const row of rows) {
      const entityId = row.id;
      if (!entityMap.has(entityId)) {
        entityMap.set(entityId, {
          entity: this.rowToEntity(row),
          fieldVersions: []
        });
      }
      
      entityMap.get(entityId)!.fieldVersions.push({
        id: row.fieldTimestamp, // Using timestamp as ID for simplicity
        field: row.field,
        timestamp: new Date(row.fieldTimestamp),
        deviceId: row.fieldDeviceId,
        hash: row.hash
      });
    }

    return Array.from(entityMap.values());
  }

  // Apply remote changes (for sync)
  async applyRemoteChange(entity: T, fieldVersions: FieldVersion[]): Promise<void> {
    // Start transaction
    await this.dbRun('BEGIN TRANSACTION');
    
    try {
      // Check if entity exists
      const existing = await this.getById(entity.id, true);
      
      if (!existing) {
        // Create new entity
        await this.insertEntity(entity);
      } else {
        // Update existing entity with newer fields
        await this.updateEntityFromFieldVersions(entity.id, fieldVersions);
      }

      // Apply field versions
      for (const fv of fieldVersions) {
        await this.applyFieldVersion(entity.id, fv);
      }

      await this.dbRun('COMMIT');
    } catch (error) {
      await this.dbRun('ROLLBACK');
      throw error;
    }
  }

  // Get statistics for the repository
  async getStatistics(): Promise<{ total: number; active: number; deleted: number }> {
    const [total, active, deleted] = await Promise.all([
      this.dbGet(`SELECT COUNT(*) as count FROM ${this.tableName}`),
      this.dbGet(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE deletedAt IS NULL`),
      this.dbGet(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE deletedAt IS NOT NULL`)
    ]);

    return {
      total: total.count,
      active: active.count,
      deleted: deleted.count
    };
  }

  // Helper methods to be implemented by subclasses
  protected abstract insertEntity(entity: T): Promise<void>;
  protected abstract rowToEntity(row: any): T;
  protected abstract serializeValue(value: any): any;

  // Get the entity ID field name for the field version table
  protected getEntityIdFieldName(): string {
    // Convert table name to singular form and add 'Id'
    // e.g., 'papers' -> 'paperId', 'folders' -> 'folderId'
    const singularName = this.tableName.endsWith('s') 
      ? this.tableName.slice(0, -1) 
      : this.tableName;
    return `${singularName}Id`;
  }

  // Field version management
  private async createFieldVersions(entityId: string, entity: any, deviceId: string): Promise<void> {
    const fields = Object.keys(entity).filter(key => 
      key !== 'id' && 
      key !== 'createdAt' && 
      key !== 'updatedAt' && 
      key !== 'createdByDeviceId' &&
      entity[key] !== null &&
      entity[key] !== undefined
    );

    for (const field of fields) {
      await this.createFieldVersion(entityId, field, entity[field], entity.createdAt, deviceId);
    }
  }

  private async createFieldVersion(entityId: string, field: string, value: any, timestamp: Date, deviceId: string): Promise<void> {
    const hash = this.calculateHash(value);
    const entityIdField = this.getEntityIdFieldName();
    const now = new Date();
    
    await this.dbRun(
      `INSERT INTO ${this.fieldVersionTableName} (id, ${entityIdField}, field, timestamp, deviceId, hash, createdAt, createdByDeviceId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [`${entityId}_${field}_${timestamp.getTime()}`, entityId, field, timestamp.toISOString(), deviceId, hash, now.toISOString(), deviceId]
    );
  }

  private async applyFieldVersion(entityId: string, fieldVersion: FieldVersion): Promise<void> {
    const entityIdField = this.getEntityIdFieldName();
    const now = new Date();
    
    // Check if this field version already exists
    const existing = await this.dbGet(
      `SELECT id FROM ${this.fieldVersionTableName} 
       WHERE ${entityIdField} = ? AND field = ? AND deviceId = ? AND timestamp = ?`,
      [entityId, fieldVersion.field, fieldVersion.deviceId, fieldVersion.timestamp.toISOString()]
    );

    if (!existing) {
      await this.dbRun(
        `INSERT INTO ${this.fieldVersionTableName} (id, ${entityIdField}, field, timestamp, deviceId, hash, createdAt, createdByDeviceId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [`${entityId}_${fieldVersion.field}_${fieldVersion.timestamp.getTime()}`, entityId, fieldVersion.field, fieldVersion.timestamp.toISOString(), fieldVersion.deviceId, fieldVersion.hash, now.toISOString(), fieldVersion.deviceId]
      );
    }
  }

  private async updateEntityFromFieldVersions(entityId: string, fieldVersions: FieldVersion[]): Promise<void> {
    // This would need to be implemented based on the specific entity type
    // For now, we'll just update the updatedAt timestamp
    await this.dbRun(
      `UPDATE ${this.tableName} SET updatedAt = ? WHERE id = ?`,
      [new Date().toISOString(), entityId]
    );
  }

  private calculateHash(value: any): string {
    // Simple hash implementation - in production, use a proper hashing library
    return JSON.stringify(value).length.toString();
  }
}

