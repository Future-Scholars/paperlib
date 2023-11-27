import { MessageChannelMain, MessagePortMain, utilityProcess } from "electron";
import { join } from "node:path";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import {
  IMainRPCService,
  MainRPCService,
} from "@/main/services/main-rpc-service";
import {
  IWindowProcessManagementService,
  WindowProcessManagementService,
} from "@/main/services/window-process-management-service";

export interface IExtensionProcessManagementServiceState {
  requestPort: string;
}

export const IExtensionProcessManagementService = createDecorator(
  "extensionProcessManagementService"
);

/**
 * ExtensionProcessManagementService
 * Extension service in main process.
 */
export class ExtensionProcessManagementService extends Eventable<IExtensionProcessManagementServiceState> {
  readonly extensionProcesses: { [processID: string]: Electron.UtilityProcess };

  constructor() {
    super("extensionProcessManagementService", {
      requestPort: "",
    });

    this.extensionProcesses = {};

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

  createExtensionProcess() {
    const extensionProcess = utilityProcess.fork(
      join(__dirname, "extension-entry.js")
    );

    // TODO: how to make the process ID consistency
    extensionProcess.on("message", (message: { [key: string]: string }) => {
      if (message["type"] === "request-port") {
        const senderID = message["value"];
        this.fire({ requestPort: senderID });
      }
    });

    this.extensionProcesses["extensionProcess"] = extensionProcess;
  }

  close() {
    //TODO: close all extension processes if the renderer process is closed.
  }

  // registerPort(port: MessagePortMain, callerId: string) {
  //   this.extensionProcess.postMessage(`register-rpc-message-port:${callerId}`, [
  //     port,
  //   ]);
  // }
}
