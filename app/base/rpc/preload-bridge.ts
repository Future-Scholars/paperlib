import { ipcRenderer } from "electron";

export function RPCBridge() {
  if (process.contextIsolated) {
    try {
      ipcRenderer.on("forward-response-port", (event, processID: string) => {
        const port = event.ports[0];
        window.postMessage({ type: "response-port", value: processID }, "*", [
          port,
        ]);
      });
    } catch (error) {
      if (globalThis["PLAPI"]) {
        PLAPI.logService.error(
          "Failed to initialize the RPCBridge.",
          error as Error,
          true,
          "RPCBridge"
        );
      } else {
        console.error(error);
      }
    }
  } else {
    throw new Error("contextIsolated is not enabled");
  }
}
