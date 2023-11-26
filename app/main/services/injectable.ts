import { PreferenceService } from "@/common/services/preference-service";
import { ContextMenuService } from "@/main/services/contextmenu-service";
import { FileSystemService } from "@/main/services/filesystem-service";
import { ExtensionProcessManagementService } from "@/main/services/extension-process-management-service";
import { MainRPCService } from "@/main/services/main-rpc-service";
import { MenuService } from "@/main/services/menu-service";
import { ProxyService } from "@/main/services/proxy-service";
import { UpgradeService } from "@/main/services/upgrade-service";
import { WindowProcessManagementService } from "@/main/services/window-process-management-service";

export type IInjectable =
  | PreferenceService
  | WindowProcessManagementService
  | MainRPCService
  | FileSystemService
  | ContextMenuService
  | MenuService
  | UpgradeService
  | ProxyService
  | ExtensionProcessManagementService;
