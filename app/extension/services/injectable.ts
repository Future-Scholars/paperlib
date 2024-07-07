import { NetworkTool } from "../base/network";
import { ExtensionManagementService } from "./extension-management-service";
import { ExtensionPreferenceService } from "./extension-preference-service";

export type IInjectable =
  | ExtensionManagementService
  | ExtensionPreferenceService
  | NetworkTool;
