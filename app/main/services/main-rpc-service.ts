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
import { createDecorator } from "@/base/injection/injection";

interface IMainRPCServiceState {
  initialized: string;
}

export const IMainRPCService = createDecorator("mainRPCService");

export class MainRPCService extends RPCService<IMainRPCServiceState> {
  protected _apiNamespace = "PLMainAPI";

  constructor() {
    super("mainRPCService", { initialized: "" });

    if (process.type !== "browser") {
      throw new Error(
        "MainRPCService should only be instantiated in the main process"
      );
    }
  }

  listenProtocolCreation(): void {
    // const eiMainRPCProtocol = new EIMainRPCProtocol(
    //   actionor["windowProcessManagementService"].browserWindows
    // );
    // this.initActionor(eiMainRPCProtocol, actionor);
  }

  initProxy(
    protocol: RPCProtocol,
    exposedAPI: { [namespace: string]: string[] }
  ): void {}
}
