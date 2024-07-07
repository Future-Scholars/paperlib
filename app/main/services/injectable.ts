import { PreferenceService } from "@/main/services/preference-service";
import { ContextMenuService } from "@/main/services/contextmenu-service";
import { FileSystemService } from "@/main/services/filesystem-service";
import { UtilityProcessManagementService } from "@/main/services/utility-process-management-service";
import { MenuService } from "@/main/services/menu-service";
import { ProxyService } from "@/main/services/proxy-service";
import { UpgradeService } from "@/main/services/upgrade-service";
import { WindowProcessManagementService } from "@/main/services/window-process-management-service";

export type IInjectable =
  | PreferenceService
  | WindowProcessManagementService
  | FileSystemService
  | ContextMenuService
  | MenuService
  | UpgradeService
  | ProxyService
  | UtilityProcessManagementService;
