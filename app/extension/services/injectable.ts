import { NetworkTool } from "@/base/network";
import { ExtensionManagementService } from "@/extension/services/extension-management-service";
import { ExtensionPreferenceService } from "@/extension/services/extension-preference-service";
import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";

export type IInjectable =
  | ExtensionRPCService
  | ExtensionManagementService
  | ExtensionPreferenceService
  | NetworkTool;
