import {
  MessageChannelMain,
  utilityProcess,
  MessagePortMain,
  ipcMain,
  IpcMainEvent,
  MessageEvent,
} from "electron";
import { MessagePortRPCProtocol } from "@/base/rpc/messageport-rpc-protocol";
import { createDecorator } from "@/base/injection/injection";
import {
  IMainRPCService,
  MainRPCService,
} from "@/main/services/main-rpc-service";
import {
  ExtensionProcessService,
  IExtensionProcessService,
} from "@/main/services/extension-process-service";
import {
  IWindowProcessManagementService,
  WindowProcessManagementService,
} from "@/main/services/window-management-service";

export const ICommService = createDecorator("commService");

/**
 * CommService
 * Communication service in main process.
 * This service is responsible for the communication between main process and other process to do preparation works for RPC.
 * Also, this service is responsible for transferring the message port between processes.
 */
export class CommService {
  constructor(
    @IMainRPCService private readonly _mainRPCService: MainRPCService,
    @IExtensionProcessService
    private readonly _extensionProcessService: ExtensionProcessService,
    @IWindowProcessManagementService
    private readonly _windowProcessManagementService: WindowProcessManagementService
  ) {}

  start() {
    // For all renderer processes
    ipcMain.on(
      "register-rpc-message-port",
      (event: IpcMainEvent, callerId: string) => {
        const port = event.ports[0];

        this._mainRPCService.initActionor(
          new MessagePortRPCProtocol(port, callerId)
        );

        port.start();
        port.postMessage(
          `exposed-api:${JSON.stringify(this._mainRPCService.exposedAPI())}`
        );
      }
    );

    // For extension processe

    this._extensionProcessService.extensionProcess.on(
      "message",
      (message: MessageEvent) => {
        console.log(message);
      }
    );

    const { port1, port2 } = new MessageChannelMain();
    this._extensionProcessService.registerPort(port2, "mainProcess");
    this._mainRPCService.initActionor(
      new MessagePortRPCProtocol(port1, "extensionProcess")
    );

    ipcMain.on(
      "forward-rpc-message-port",
      (event: IpcMainEvent, payload: { callerId: string; destId: string }) => {
        const port = event.ports[0];

        if (payload.destId === "extensionProcess") {
          this._extensionProcessService.registerPort(port, payload.callerId);
        } else {
          const win = this._windowProcessManagementService.browserWindows.get(
            payload.destId
          );
          win.webContents.postMessage(
            "register-rpc-message-port",
            payload.callerId,
            [port]
          );
        }
      }
    );
  }
}
