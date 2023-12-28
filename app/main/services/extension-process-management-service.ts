import { utilityProcess } from "electron";
import { join } from "path";

import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Process } from "@/base/process-id";

export interface IExtensionProcessManagementServiceState {
  requestPort: string;
  destroyed: string;
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
      destroyed: "",
    });

    this.extensionProcesses = {};
  }

  @errorcatching(
    "Failed to create extension process.",
    true,
    "ExtProcessManagement"
  )
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

  @errorcatching(
    "Failed to close extension process.",
    true,
    "ExtProcessManagement"
  )
  close() {
    for (const processID in this.extensionProcesses) {
      this.extensionProcesses[processID].kill();
      this.fire({ destroyed: processID });
    }
  }
}
