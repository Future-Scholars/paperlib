import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("previewInteractor", {
  onPreview: (renderCallback: (arg0: any) => void) => {
    ipcRenderer.on("preview-file", (event, fileURL) => {
      renderCallback(fileURL);
    });
  },
});
