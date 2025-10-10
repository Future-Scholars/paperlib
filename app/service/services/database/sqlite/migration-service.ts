import { Migrator, MigrationProvider, Migration } from 'kysely';
import { db } from './db';
import { ILogService, LogService } from '@/common/services/log-service';

/**
 * Custom migration provider that handles both dev and build environments
 */
class PaperlibMigrationProvider implements MigrationProvider {
  constructor(
    private readonly _logService: LogService
  ) {}

  async getMigrations(): Promise<Record<string, Migration>> {
    const migrations: Record<string, Migration> = {};
    
    try {
      // Try to load the migration dynamically
      const migrationModule = await import('./migrations/v3.2.0-beta0');
      
      if (migrationModule.up && migrationModule.down) {
        migrations['v3.2.0-beta0'] = {
          up: migrationModule.up,
          down: migrationModule.down,
        };
        
        this._logService.info(
          'Loaded migration v3.2.0-beta0 successfully',
          '',
          false,
          'SQLiteMigration'
        );
      }
    } catch (error) {
      this._logService.error(
        'Failed to load migration v3.2.0-beta0',
        error as Error,
        true,
        'SQLiteMigration'
      );
      throw error;
    }

    return migrations;
  }
}

export class SQLiteMigrationService {
  private migrator: Migrator;

  constructor(
    @ILogService private readonly _logService: LogService
  ) {
    this.migrator = new Migrator({
      db,
      provider: new PaperlibMigrationProvider(this._logService),
    });
  }


  /**
   * Run all pending migrations
   */
  async migrateToLatest(): Promise<void> {
    try {
      this._logService.info('Starting SQLite database migrations...', '', false, 'SQLiteMigration');

      const { error, results } = await this.migrator.migrateToLatest();

      if (results) {
        results.forEach((result) => {
          if (result.status === 'Success') {
            this._logService.info(
              `Migration "${result.migrationName}" executed successfully`,
              '',
              false,
              'SQLiteMigration'
            );
          } else if (result.status === 'NotExecuted') {
            this._logService.info(
              `Migration "${result.migrationName}" not executed`,
              '',
              false,
              'SQLiteMigration'
            );
          } else {
            if (error instanceof Error) {
              this._logService.error(
                `Failed to execute migration "${result.migrationName}"`,
                error,
                true,
                'SQLiteMigration'
              );
            } else {
              this._logService.error(
                `Failed to execute migration "${result.migrationName}"`,
                new Error(error as string),
                true,
                'SQLiteMigration'
              );
            }
          }
        });
      }

      if (error) {
        if (error instanceof Error) {
          this._logService.error(
            'SQLite migration failed',
            error,
            true,
            'SQLiteMigration'
          );
          throw error;
        } else {
          this._logService.error(
            'SQLite migration failed',
            new Error(error as string),
            true,
            'SQLiteMigration'
          );
          throw new Error(error as string);
        }
      }

      this._logService.info('SQLite database migrations completed successfully', '', false, 'SQLiteMigration');
    } catch (error) {
      this._logService.error(
        'Failed to run SQLite migrations',
        error as Error,
        true,
        'SQLiteMigration'
      );
      throw error;
    }
  }

  /**
   * Get the list of pending migrations
   */
  async getPendingMigrations(): Promise<string[]> {
    try {
      const migrations = await this.migrator.getMigrations();
      return migrations.filter((m) => !m.executedAt).map((m) => m.name);
    } catch (error) {
      this._logService.error(
        'Failed to get pending migrations',
        error instanceof Error ? error : new Error(error as string),
        true,
        'SQLiteMigration'
      );
      return [];
    }
  }

  /**
   * Check if migrations are needed
   */
  async needsMigration(): Promise<boolean> {
    const pending = await this.getPendingMigrations();
    return pending.length > 0;
  }

  /**
   * Rollback to a specific migration
   */
  async migrateDown(targetMigration?: string): Promise<void> {
    try {
      this._logService.info(
        `Rolling back SQLite database${targetMigration ? ` to ${targetMigration}` : ''}...`,
        '',
        false,
        'SQLiteMigration'
      );
      if (targetMigration) {
        const migrations = await this.migrator.getMigrations();
        const found = migrations.find(migration => migration.name === targetMigration);
        if (!found) {
          this._logService.error(
            `Migration "${targetMigration}" not found`,
            '',
            true,
            'SQLiteMigration'
          );
          throw new Error(`Migration "${targetMigration}" not found`);
        }

        const { error, results } = await this.migrator.migrateDown();

        if (results) {
          results.forEach((result) => {
            if (result.status === 'Success') {
              this._logService.info(
                `Migration "${result.migrationName}" rolled back successfully`,
                '',
                false,
                'SQLiteMigration'
              );
            } else if (result.status === 'Error') {
              this._logService.error(
                `Failed to rollback migration "${result.migrationName}"`,
                error instanceof Error ? error : new Error(error as string),
                true,
                'SQLiteMigration'
              );
            }
          });
        }
      } else {
        const { error, results } = await this.migrator.migrateDown();
        if (error) {
          this._logService.error(
            'SQLite migration rollback failed',
            error instanceof Error ? error : new Error(error as string),
            true,
            'SQLiteMigration'
          );
          throw error;
        }
        if (results) {
          results.forEach((result) => {
            this._logService.info(
              `Migration "${result.migrationName}" rolled back successfully`,
              '',
              false,
              'SQLiteMigration'
            );
          });
        }
        this._logService.info('SQLite database rollback completed', '', false, 'SQLiteMigration');
      }

    } catch (error) {
      this._logService.error(
        'Failed to rollback SQLite migrations',
        error as Error,
        true,
        'SQLiteMigration'
      );
      throw error;
    }
  }
}
