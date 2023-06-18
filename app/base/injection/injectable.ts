import { CacheDatabaseCore } from "@/base/database/cache-core";
import { DatabaseCore } from "@/base/database/core";
import { CategorizerRepository } from "@/repositories/db-repository/categorizer-repository-v2";
import { PaperEntityRepository } from "@/repositories/db-repository/paper-repository";
import { FileSourceRepository } from "@/repositories/filesource-repository/filesource-repository";
import { APPService } from "@/services/app-service";
import { BufferService } from "@/services/buffer-service";
import { CacheService } from "@/services/cache-service";
import { CategorizerService } from "@/services/categorizer-service";
import { DatabaseService } from "@/services/database-service";
import { FileService } from "@/services/file-service";
import { LogService } from "@/services/log-service";
import { PaperService } from "@/services/paper-service";
import { PreferenceService } from "@/services/preference-service";
import { ScrapeService } from "@/services/scrape-service";
import { StateService } from "@/services/state-service/state-service";

export type IInjectable =
  | APPService
  | PreferenceService
  | StateService
  | LogService
  | DatabaseService
  | DatabaseCore
  | PaperEntityRepository
  | PaperService
  | BufferService
  | CategorizerRepository
  | ScrapeService
  | FileService
  | CacheService
  | CacheDatabaseCore
  | CategorizerService
  | FileSourceRepository;
