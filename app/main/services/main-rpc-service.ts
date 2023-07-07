import { EIMainRPCProtocol } from "@/base/rpc/ei-main-rpc-protocol";
import { RPCProtocol, RPCService } from "@/base/rpc/rpc-service";
import {
  IWindowProcessManagementService,
  WindowProcessManagementService,
} from "@/main/services/window-management-service";
import {
  FileSystemService,
  IFileSystemService,
} from "@/main/services/filesystem-service";
import {
  ContextMenuService,
  IContextMenuService,
} from "@/main/services/contextmenu-service";
import {
  IUpgradeService,
  UpgradeService,
} from "@/main/services/upgrade-service";
import { IMenuService, MenuService } from "@/main/services/menu-service";
import { IProxyService, ProxyService } from "@/main/services/proxy-service";

interface IMainRPCServiceState {
  initialized: number;
}

export class MainRPCService extends RPCService<IMainRPCServiceState> {
  constructor(
    @IWindowProcessManagementService
    private readonly _windowProcessManagementService: WindowProcessManagementService,
    @IFileSystemService private readonly _fileSystemService: FileSystemService,
    @IContextMenuService
    private readonly _contextMenuService: ContextMenuService,
    @IMenuService private readonly _menuService: MenuService,
    @IUpgradeService private readonly _upgradeService: UpgradeService,
    @IProxyService private readonly _proxyService: ProxyService
  ) {
    super("mainRPCService", { initialized: 0 });

    this._listenProtocolCreation();
  }

  _listenProtocolCreation(): void {
    if (process.type !== "browser") {
      throw new Error(
        "MainRPCService should only be instantiated in the main process"
      );
    }

    const eiMainRPCProtocol = new EIMainRPCProtocol(
      this._windowProcessManagementService.browserWindows
    );
    this._initActionor(eiMainRPCProtocol);
  }

  _initActionor(protocol: RPCProtocol): void {
    protocol.set(
      "windowProcessManagementService",
      this._windowProcessManagementService
    );
    protocol.set("fileSystemService", this._fileSystemService);
    protocol.set("contextMenuService", this._contextMenuService);
    protocol.set("menuService", this._menuService);
    protocol.set("upgradeService", this._upgradeService);
    protocol.set("proxyService", this._proxyService);
  }

  _initProxy(protocol: RPCProtocol, protocolId: string): void {
    if (protocolId === "extensionProcess") {
    }
  }
}
