import { domReady } from "@/base/misc";
import { appendLoading } from "@/base/loading";
import { RPCBridge } from "@/base/rpc/preload-bridge";
import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge } from "electron";

domReady().then(appendLoading);

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = electronAPI;
}

RPCBridge();
