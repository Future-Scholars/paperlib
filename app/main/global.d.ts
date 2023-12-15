import { ContextMenuService } from "@/main/services/contextmenu-service";
import { ExtensionProcessManagementService } from "@/main/services/extension-process-management-service";
import { FileSystemService } from "@/main/services/filesystem-service";
import { MainRPCService } from "@/main/services/main-rpc-service";
import { MenuService } from "@/main/services/menu-service";
import { ProxyService } from "@/main/services/proxy-service";
import { UpgradeService } from "@/main/services/upgrade-service";
import { WindowProcessManagementService } from "@/main/services/window-process-management-service";

declare global {
  var windowProcessManagementService: WindowProcessManagementService;
  var fileSystemService: FileSystemService;
  var contextMenuService: ContextMenuService;
  var mainRPCService: MainRPCService;
  var menuService: MenuService;
  var upgradeService: UpgradeService;
  var proxyService: ProxyService;
  var extensionProcessManagementService: ExtensionProcessManagementService;
}
