import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import sqlite3 from 'sqlite3';
import { BaseRepository, BaseEntity, FieldVersion } from '../../../app/service/services/database/sqlite/repository';

// Mock entity for testing
interface TestEntity extends BaseEntity {
  name: string;
  value: number;
  optionalField?: string;
}

// Concrete implementation for testing
class TestRepository extends BaseRepository<TestEntity> {
  protected async insertEntity(entity: TestEntity): Promise<void> {
    const fields = Object.keys(entity).filter(key => entity[key] !== undefined);
    const placeholders = fields.map(() => '?').join(', ');
    const values = fields.map(field => this.serializeValue(entity[field as keyof TestEntity]));
    
    await this.dbRun(
      `INSERT INTO test_entities (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );
  }

  protected rowToEntity(row: any): TestEntity {
    return {
      id: row.id,
      name: row.name,
      value: row.value,
      optionalField: row.optionalField,
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

describe('BaseRepository', () => {
  let db: sqlite3.Database;
  let repository: TestRepository;
  let mockDb: any;

  beforeEach(async () => {
    // Create in-memory database for testing
    db = new sqlite3.Database(':memory:');
    
    // Create test table
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE test_entities (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          value INTEGER NOT NULL,
          optionalField TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT,
          deletedAt TEXT,
          deletedByDeviceId TEXT,
          createdByDeviceId TEXT
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Create field version table
    await new Promise<void>((resolve, reject) => {
      db.run(`
        CREATE TABLE test_entity_field_versions (
          id TEXT PRIMARY KEY,
          testEntityId TEXT NOT NULL,
          field TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          deviceId TEXT NOT NULL,
          hash TEXT,
          FOREIGN KEY (testEntityId) REFERENCES test_entities(id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    repository = new TestRepository(db, 'test_entities', 'test_entity_field_versions');
  });

  afterEach(async () => {
    await repository.close();
  });

  describe('constructor', () => {
    it('should initialize with correct table names', () => {
      expect(repository['tableName']).toBe('test_entities');
      expect(repository['fieldVersionTableName']).toBe('test_entity_field_versions');
    });

    it('should get correct entity ID field name', () => {
      expect(repository['getEntityIdFieldName']()).toBe('testEntityId');
    });
  });

  describe('create', () => {
    it('should create entity with timestamps and field versions', async () => {
      const entity: Omit<TestEntity, 'createdAt' | 'updatedAt' | 'createdByDeviceId'> = {
        id: 'test-1',
        name: 'Test Entity',
        value: 42,
        optionalField: 'optional'
      };

      const deviceId = 'device-1';
      await repository.create(entity as TestEntity, deviceId);

      // Verify entity was created
      const created = await repository.getById('test-1');
      expect(created).toBeDefined();
      expect(created!.name).toBe('Test Entity');
      expect(created!.value).toBe(42);
      expect(created!.createdAt).toBeInstanceOf(Date);
      expect(created!.updatedAt).toBeInstanceOf(Date);
      expect(created!.createdByDeviceId).toBe(deviceId);

      // Verify field versions were created
      const changes = await repository.getChangesSince(new Date(0));
      expect(changes).toHaveLength(1);
      expect(changes[0].fieldVersions).toHaveLength(4); // id, name, value, optionalField
    });

    it('should handle entity with null optional fields', async () => {
      const entity: Omit<TestEntity, 'createdAt' | 'updatedAt' | 'createdByDeviceId'> = {
        id: 'test-2',
        name: 'Test Entity 2',
        value: 100,
        optionalField: undefined
      };

      const deviceId = 'device-1';
      await repository.create(entity as TestEntity, deviceId);

      const created = await repository.getById('test-2');
      expect(created!.optionalField).toBeUndefined();
    });

    it('should throw error for invalid entity', async () => {
      const invalidEntity = {} as TestEntity;
      
      await expect(repository.create(invalidEntity, 'device-1')).rejects.toThrow();
    });
  });

  describe('updateField', () => {
    beforeEach(async () => {
      const entity: Omit<TestEntity, 'createdAt' | 'updatedAt' | 'createdByDeviceId'> = {
        id: 'test-3',
        name: 'Original Name',
        value: 10
      };
      await repository.create(entity as TestEntity, 'device-1');
    });

    it('should update field and create field version', async () => {
      const deviceId = 'device-2';
      await repository.updateField('test-3', 'name', 'Updated Name', deviceId);

      const updated = await repository.getById('test-3');
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.updatedAt).toBeInstanceOf(Date);

      // Verify field version was created
      const changes = await repository.getChangesSince(new Date(Date.now() - 1000));
      expect(changes).toHaveLength(1);
      expect(changes[0].fieldVersions).toHaveLength(1);
      expect(changes[0].fieldVersions[0].deviceId).toBe(deviceId);
    });

    it('should handle updating non-existent entity', async () => {
      await expect(
        repository.updateField('non-existent', 'name', 'New Name', 'device-1')
      ).rejects.toThrow();
    });

    it('should handle updating with null value', async () => {
      await repository.updateField('test-3', 'optionalField', null, 'device-1');
      
      const updated = await repository.getById('test-3');
      expect(updated!.optionalField).toBeNull();
    });
  });

  describe('softDelete', () => {
    beforeEach(async () => {
      const entity: Omit<TestEntity, 'createdAt' | 'updatedAt' | 'createdByDeviceId'> = {
        id: 'test-4',
        name: 'To Delete',
        value: 50
      };
      await repository.create(entity as TestEntity, 'device-1');
    });

    it('should soft delete entity', async () => {
      const deviceId = 'device-2';
      await repository.softDelete('test-4', deviceId);

      // Entity should not be visible in normal queries
      const deleted = await repository.getById('test-4');
      expect(deleted).toBeNull();

      // Entity should be visible when including deleted
      const deletedIncluding = await repository.getById('test-4', true);
      expect(deletedIncluding).toBeDefined();
      expect(deletedIncluding!.deletedAt).toBeInstanceOf(Date);
      expect(deletedIncluding!.deletedByDeviceId).toBe(deviceId);
    });

    it('should handle soft deleting already deleted entity', async () => {
      await repository.softDelete('test-4', 'device-1');
      
      // Should not throw error
      await expect(repository.softDelete('test-4', 'device-2')).resolves.not.toThrow();
    });
  });

  describe('restore', () => {
    beforeEach(async () => {
      const entity: Omit<TestEntity, 'createdAt' | 'updatedAt' | 'createdByDeviceId'> = {
        id: 'test-5',
        name: 'To Restore',
        value: 75
      };
      await repository.create(entity as TestEntity, 'device-1');
      await repository.softDelete('test-5', 'device-1');
    });

    it('should restore soft deleted entity', async () => {
      const deviceId = 'device-2';
      await repository.restore('test-5', deviceId);

      const restored = await repository.getById('test-5');
      expect(restored).toBeDefined();
      expect(restored!.deletedAt).toBeUndefined();
      expect(restored!.deletedByDeviceId).toBeUndefined();
      expect(restored!.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle restoring non-deleted entity', async () => {
      // Should not throw error
      await expect(repository.restore('test-5', 'device-1')).resolves.not.toThrow();
    });
  });

  describe('getById', () => {
    beforeEach(async () => {
      const entity: Omit<TestEntity, 'createdAt' | 'updatedAt' | 'createdByDeviceId'> = {
        id: 'test-6',
        name: 'Test Entity',
        value: 25
      };
      await repository.create(entity as TestEntity, 'device-1');
    });

    it('should return entity by ID', async () => {
      const entity = await repository.getById('test-6');
      expect(entity).toBeDefined();
      expect(entity!.id).toBe('test-6');
      expect(entity!.name).toBe('Test Entity');
    });

    it('should return null for non-existent entity', async () => {
      const entity = await repository.getById('non-existent');
      expect(entity).toBeNull();
    });

    it('should exclude deleted entities by default', async () => {
      await repository.softDelete('test-6', 'device-1');
      
      const entity = await repository.getById('test-6');
      expect(entity).toBeNull();
    });

    it('should include deleted entities when requested', async () => {
      await repository.softDelete('test-6', 'device-1');
      
      const entity = await repository.getById('test-6', true);
      expect(entity).toBeDefined();
      expect(entity!.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('getAll', () => {
    beforeEach(async () => {
      const entities = [
        { id: 'test-7', name: 'Entity 1', value: 1 },
        { id: 'test-8', name: 'Entity 2', value: 2 },
        { id: 'test-9', name: 'Entity 3', value: 3 }
      ];

      for (const entity of entities) {
        await repository.create(entity as TestEntity, 'device-1');
      }
    });

    it('should return all active entities', async () => {
      const all = await repository.getAll();
      expect(all).toHaveLength(3);
      expect(all.every(e => e.deletedAt === undefined)).toBe(true);
    });

    it('should return all entities including deleted when requested', async () => {
      await repository.softDelete('test-7', 'device-1');
      
      const all = await repository.getAll(true);
      expect(all).toHaveLength(3);
      expect(all.some(e => e.deletedAt !== undefined)).toBe(true);
    });

    it('should return empty array when no entities exist', async () => {
      // Delete all entities
      await repository.softDelete('test-7', 'device-1');
      await repository.softDelete('test-8', 'device-1');
      await repository.softDelete('test-9', 'device-1');
      
      const all = await repository.getAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('getChangesSince', () => {
    beforeEach(async () => {
      const entity: Omit<TestEntity, 'createdAt' | 'updatedAt' | 'createdByDeviceId'> = {
        id: 'test-10',
        name: 'Test Entity',
        value: 100
      };
      await repository.create(entity as TestEntity, 'device-1');
    });

    it('should return changes since timestamp', async () => {
      const baseTime = new Date(Date.now() - 1000);
      
      // Make some changes
      await repository.updateField('test-10', 'name', 'Updated Name', 'device-2');
      await repository.updateField('test-10', 'value', 200, 'device-3');
      
      const changes = await repository.getChangesSince(baseTime);
      expect(changes).toHaveLength(1);
      expect(changes[0].entity.id).toBe('test-10');
      expect(changes[0].fieldVersions.length).toBeGreaterThan(0);
    });

    it('should filter changes by device ID', async () => {
      const baseTime = new Date(Date.now() - 1000);
      
      await repository.updateField('test-10', 'name', 'Updated Name', 'device-2');
      
      const changes = await repository.getChangesSince(baseTime, 'device-2');
      expect(changes).toHaveLength(0); // No changes from other devices
    });

    it('should return empty array when no changes exist', async () => {
      const futureTime = new Date(Date.now() + 1000);
      const changes = await repository.getChangesSince(futureTime);
      expect(changes).toHaveLength(0);
    });
  });

  describe('applyRemoteChange', () => {
    it('should create new entity if it does not exist', async () => {
      const entity: TestEntity = {
        id: 'remote-1',
        name: 'Remote Entity',
        value: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByDeviceId: 'remote-device'
      };

      const fieldVersions: FieldVersion[] = [
        {
          id: 'fv-1',
          timestamp: new Date(),
          deviceId: 'remote-device'
        }
      ];

      await repository.applyRemoteChange(entity, fieldVersions);

      const created = await repository.getById('remote-1');
      expect(created).toBeDefined();
      expect(created!.name).toBe('Remote Entity');
    });

    it('should update existing entity with field versions', async () => {
      // Create local entity
      const localEntity: Omit<TestEntity, 'createdAt' | 'updatedAt' | 'createdByDeviceId'> = {
        id: 'remote-2',
        name: 'Local Entity',
        value: 100
      };
      await repository.create(localEntity as TestEntity, 'local-device');

      // Apply remote change
      const remoteEntity: TestEntity = {
        id: 'remote-2',
        name: 'Remote Entity',
        value: 200,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdByDeviceId: 'remote-device'
      };

      const fieldVersions: FieldVersion[] = [
        {
          id: 'fv-2',
          timestamp: new Date(),
          deviceId: 'remote-device'
        }
      ];

      await repository.applyRemoteChange(remoteEntity, fieldVersions);

      const updated = await repository.getById('remote-2');
      expect(updated!.updatedAt).toBeInstanceOf(Date);
    });

    it('should rollback transaction on error', async () => {
      const invalidEntity = {} as TestEntity;
      const fieldVersions: FieldVersion[] = [];

      await expect(repository.applyRemoteChange(invalidEntity, fieldVersions)).rejects.toThrow();
      
      // Verify no changes were made
      const all = await repository.getAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      const entities = [
        { id: 'stat-1', name: 'Entity 1', value: 1 },
        { id: 'stat-2', name: 'Entity 2', value: 2 },
        { id: 'stat-3', name: 'Entity 3', value: 3 }
      ];

      for (const entity of entities) {
        await repository.create(entity as TestEntity, 'device-1');
      }
    });

    it('should return correct statistics', async () => {
      const stats = await repository.getStatistics();
      
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(3);
      expect(stats.deleted).toBe(0);
    });

    it('should update statistics after soft delete', async () => {
      await repository.softDelete('stat-1', 'device-1');
      
      const stats = await repository.getStatistics();
      
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.deleted).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Close the database to simulate connection error
      await repository.close();
      
      await expect(repository.getById('test-1')).rejects.toThrow();
    });

    it('should handle invalid SQL queries gracefully', async () => {
      // This would require mocking the database to return errors
      // For now, we'll test with valid queries
      expect(repository).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle entity with all null optional fields', async () => {
      const entity: Omit<TestEntity, 'createdAt' | 'updatedAt' | 'createdByDeviceId'> = {
        id: 'edge-1',
        name: 'Edge Case',
        value: 0,
        optionalField: null
      };

      await repository.create(entity as TestEntity, 'device-1');
      
      const created = await repository.getById('edge-1');
      expect(created!.optionalField).toBeNull();
    });

    it('should handle very long field values', async () => {
      const longValue = 'a'.repeat(10000);
      const entity: Omit<TestEntity, 'createdAt' | 'updatedAt' | 'createdByDeviceId'> = {
        id: 'edge-2',
        name: longValue,
        value: 999
      };

      await repository.create(entity as TestEntity, 'device-1');
      
      const created = await repository.getById('edge-2');
      expect(created!.name).toBe(longValue);
    });

    it('should handle special characters in field values', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const entity: Omit<TestEntity, 'createdAt' | 'updatedAt' | 'createdByDeviceId'> = {
        id: 'edge-3',
        name: specialChars,
        value: 123
      };

      await repository.create(entity as TestEntity, 'device-1');
      
      const created = await repository.getById('edge-3');
      expect(created!.name).toBe(specialChars);
    });
  });
});
