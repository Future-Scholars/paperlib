import { PreferenceService } from "@/common/services/preference-service";
import { ContextMenuService } from "@/main/services/contextmenu-service";
import { FileSystemService } from "@/main/services/filesystem-service";
import { ExtensionProcessService } from "@/main/services/extension-process-service";
import { MainRPCService } from "@/main/services/main-rpc-service";
import { MenuService } from "@/main/services/menu-service";
import { ProxyService } from "@/main/services/proxy-service";
import { UpgradeService } from "@/main/services/upgrade-service";
import { WindowProcessManagementService } from "@/main/services/window-management-service";

export type IInjectable =
  | PreferenceService
  | WindowProcessManagementService
  | MainRPCService
  | FileSystemService
  | ContextMenuService
  | MenuService
  | UpgradeService
  | ProxyService
  | ExtensionProcessService;
