import { contextBridge, ipcRenderer } from "electron";
// @ts-ignore
import * as pdfjs from "pdfjs-dist/build/pdf";
import { RenderParameters } from "pdfjs-dist/types/src/display/api";

pdfjs.GlobalWorkerOptions.workerPort = new Worker("./pdf.worker.min.js");

contextBridge.exposeInMainWorld("quicklookInteractor", {
  preview: () => {
    ipcRenderer.on("preview-file", async (event, fileURL) => {
      // @ts-ignore
      const pdf = await pdfjs.getDocument(fileURL).promise;
      const page = await pdf.getPage(1);
      var scale = 1;
      var viewport = page.getViewport({ scale: scale });
      var outputScale = window.devicePixelRatio || 1;
      var canvas = document.getElementById(
        "preview-canvas"
      ) as HTMLCanvasElement;
      var context = canvas.getContext("2d") as CanvasRenderingContext2D;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      var transform =
        outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
      var renderContext = {
        canvasContext: context,
        transform: transform,
        viewport: viewport,
      } as RenderParameters;
      await page.render(renderContext).promise;
    });
  },

  closePreview: () => {
    ipcRenderer.send("close-preview");
  },
});
