import { ExtensionManagementService } from "@/extension/services/extension-management-service";
import { ExtensionRPCService } from "@/extension/services/extension-rpc-service";

declare global {
  var extensionRPCService: ExtensionRPCService;
  var extensionManagementService: ExtensionManagementService;
  var extensionWorkingDir: string;
}
