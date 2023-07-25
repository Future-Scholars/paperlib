import { ExtensionManagementService } from "@/extension/services/extension-management-service";
import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";

export type IInjectable = ExtensionRPCService | ExtensionManagementService;
