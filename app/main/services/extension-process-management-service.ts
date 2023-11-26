import { MessageChannelMain, utilityProcess, MessagePortMain } from "electron";
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
} from "@/main/services/window-process-management-service";

export const IExtensionProcessManagementService = createDecorator(
  "extensionProcessService"
);

/**
 * ExtensionProcessManagementService
 * Extension service in main process.
 */
export class ExtensionProcessManagementService {
  // readonly extensionProcess: Electron.UtilityProcess;

  constructor() {
    // this.extensionProcess = utilityProcess.fork(
    //   join(__dirname, "extension-entry.js")
    // );
    // this._windowProcessManagementService.on(
    //   "created",
    //   (payload: { key: string; value: string }) => {
    //     const { port1, port2 } = new MessageChannelMain();
    //     this._extensionProcess.postMessage(
    //       `create-messageport-rpc-protocol:${payload.value}`,
    //       [port2]
    //     );
    //     this._windowProcessManagementService.browserWindows
    //       .get(payload.value)
    //       .webContents.postMessage(
    //         "create-messageport-rpc-protocol",
    //         "extensionProcess",
    //         [port1]
    //       );
    //   }
    // );
    // this._windowProcessManagementService.on(
    //   "close",
    //   (payload: { key: string; value: string }) => {
    //     if (payload.value === "rendererProcess") {
    //       this._extensionProcess.kill();
    //     }
    //   }
    // );
  }

  // registerPort(port: MessagePortMain, callerId: string) {
  //   this.extensionProcess.postMessage(`register-rpc-message-port:${callerId}`, [
  //     port,
  //   ]);
  // }
}
