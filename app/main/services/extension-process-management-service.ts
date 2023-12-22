import { utilityProcess } from "electron";
import { join } from "node:path";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Process } from "@/base/process-id";

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
  }

  createExtensionProcess() {
    const extensionProcess = utilityProcess.fork(
      join(__dirname, "extension-entry.js")
    );

    extensionProcess.on("message", (message: { [key: string]: string }) => {
      if (message["type"] === "request-port") {
        const senderID = message["value"];
        this.fire({ requestPort: senderID });
      }
    });

    this.extensionProcesses[Process.extension] = extensionProcess;
  }

  close() {
    for (const processID in this.extensionProcesses) {
      this.extensionProcesses[processID].kill();
    }
  }
}
