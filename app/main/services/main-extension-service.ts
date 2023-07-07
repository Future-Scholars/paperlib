import { MessageChannelMain, utilityProcess } from "electron";
import { join } from "node:path";
import {
  MainRPCService,
  IMainRPCService,
} from "@/main/services/main-rpc-service";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { createDecorator } from "@/base/injection/injection";
import {
  IWindowProcessManagementService,
  WindowProcessManagementService,
} from "@/main/services/window-management-service";

export const IMainExtensionService = createDecorator("mainExtensionService");

/**
 * MainExtensionService
 * Extension service in main process.
 */
export class MainExtensionService {
  private readonly _extensionProcess: Electron.UtilityProcess;

  constructor(
    @IMainRPCService private readonly _mainRPCService: MainRPCService,
    @IWindowProcessManagementService
    private readonly _windowProcessManagementService: WindowProcessManagementService
  ) {
    this._extensionProcess = utilityProcess.fork(
      join(__dirname, "extension-entry.js")
    );

    const { port1, port2 } = new MessageChannelMain();
    const protocol = new MessagePortRPCProtocol(port1, "mainProcess");
    this._mainRPCService.initActionor(protocol);
    this._mainRPCService.initProxy(protocol, "extensionProcess");

    this._extensionProcess.postMessage(
      "create-messageport-rpc-protocol:mainProcess",
      [port2]
    );

    this._windowProcessManagementService.on(
      "created",
      (payload: { key: string; value: string }) => {
        const { port1, port2 } = new MessageChannelMain();

        this._extensionProcess.postMessage(
          `create-messageport-rpc-protocol:${payload.value}`,
          [port2]
        );

        this._windowProcessManagementService.browserWindows
          .get(payload.value)
          .webContents.postMessage(
            "create-messageport-rpc-protocol",
            "extensionProcess",
            [port1]
          );
      }
    );

    this._windowProcessManagementService.on(
      "close",
      (payload: { key: string; value: string }) => {
        if (payload.value === "rendererProcess") {
          this._extensionProcess.kill();
        }
      }
    );
  }
}
