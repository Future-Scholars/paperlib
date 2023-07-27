import { MainRPCService } from "@/main/services/main-rpc-service";
import { WindowProcessManagementService } from "@/main/services/window-management-service";
import { FileSystemService } from "@/main/services/filesystem-service";
import { ContextMenuService } from "@/main/services/contextmenu-service";
import { MenuService } from "@/main/services/menu-service";
import { UpgradeService } from "@/main/services/upgrade-service";
import { ProxyService } from "@/main/services/proxy-service";
import { ExtensionProcessService } from "@/main/services/extension-process-service";

declare global {
  var windowProcessManagementService: WindowProcessManagementService;
  var fileSystemService: FileSystemService;
  var contextMenuService: ContextMenuService;
  var mainRPCService: MainRPCService;
  var menuService: MenuService;
  var upgradeService: UpgradeService;
  var proxyService: ProxyService;
  var extensionProcessService: ExtensionProcessService;
}
