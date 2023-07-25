import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";
import { ExtensionManagementService } from "@/extension/services/extension-management-service";

declare global {
  var extensionRPCService: ExtensionRPCService;
  var extensionManagementService: ExtensionManagementService;
}
