import { APPService } from "./app-service";
import { PreferenceService } from "./preference-service";
import { StateService } from "./state-service/state-service";

export type Services = APPService | PreferenceService | StateService;
