import { APPService } from "./app-service";
import { LogService } from "./log-service";
import { PreferenceService } from "./preference-service";
import { StateService } from "./state-service/state-service";

export type Services =
  | APPService
  | PreferenceService
  | StateService
  | LogService;
