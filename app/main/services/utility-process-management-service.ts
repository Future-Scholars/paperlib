import { utilityProcess } from "electron";

import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import { Process } from "@/base/process-id";
import { ProcessStorage } from "@/base/process-storage";

import extensionProcessEntry from "../../extension/extension-entry?modulePath";
import serviceProcessEntry from "../../service/service-entry?modulePath";

export interface IUtilityProcessManagementServiceState {
  requestPort: string;
  destroyed: string;
  serviceReady: string;
}

export const IUtilityProcessManagementService = createDecorator(
  "utilityProcessManagementService"
);

export class UtilityProcessManagementService extends Eventable<IUtilityProcessManagementServiceState> {
  public utlityProcesses: ProcessStorage;

  constructor() {
    super("utilityProcessManagementService", {
      requestPort: "",
      destroyed: "",
      serviceReady: "",
    });

    this.utlityProcesses = new ProcessStorage();
  }

  @errorcatching(
    "Failed to create the utility process.",
    true,
    "UtiProcessManagement"
  )
  create(id: string, entry: string) {
    const process = utilityProcess.fork(entry);

    process.on("message", (message: { [key: string]: string }) => {
      if (message["type"] === "request-port") {
        const senderID = message["value"];
        this.fire({ requestPort: senderID });
      } else if (message["type"] === "service-ready") {
        const senderID = message["value"];
        this.fire({ serviceReady: senderID });
      }
    });

    this.utlityProcesses.set(id, process);
  }

  @errorcatching(
    "Failed to create the extension utility process.",
    true,
    "UtiProcessManagement"
  )
  createExtensionProcess() {
    this.create(Process.extension, extensionProcessEntry);
  }

  createServiceProcess() {
    this.create(Process.service, serviceProcessEntry);
  }

  @errorcatching(
    "Failed to close the utility process.",
    true,
    "UtiProcessManagement"
  )
  close(id?: string) {
    if (id) {
      this.utlityProcesses.destroy(id);
    } else {
      for (const [id, process] of Object.entries(this.utlityProcesses.all())) {
        process.kill();
        this.fire({ destroyed: id });
      }
    }
  }
}
