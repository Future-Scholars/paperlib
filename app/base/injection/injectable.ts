import { PaperEntityRepository } from "@/repositories/db-repository/paper-repository";
import { APPService } from "@/services/app-service";
import { DatabaseService } from "@/services/database-service";
import { LogService } from "@/services/log-service";
import { PaperService } from "@/services/paper-service";
import { PreferenceService } from "@/services/preference-service";
import { StateService } from "@/services/state-service/state-service";

import { DatabaseCore } from "../database/core";

export type IInjectable =
  | APPService
  | PreferenceService
  | StateService
  | LogService
  | DatabaseService
  | DatabaseCore
  | PaperEntityRepository
  | PaperService;
