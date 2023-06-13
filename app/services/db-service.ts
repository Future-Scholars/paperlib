import { createDecorator } from "@/base/injection/injection";
import {
  DBRepository,
  IDBRepository,
} from "@/repositories/db-repository/db-repository";

export const IDBService = createDecorator("IDBService");

export class DBService {
  constructor(@IDBRepository private readonly dbRepository: DBRepository) {}

  /**
   * Initialize the database. */
  async initialize() {
    await this.dbRepository.initRealm(true);
  }

  /**
   * Pause the synchronization of the database. */
  pauseSync() {
    // TODO: Check if cloud db used.
    this.dbRepository.pauseSync();
  }

  /**
   * Resume the synchronization of the database. */
  resumeSync() {
    this.dbRepository.resumeSync();
  }

  /**
   * Migrate the local database to the cloud database. */
  migrateLocaltoCloud() {
    void this.dbRepository.migrateLocaltoCloud();
  }
}
