import { ipcRenderer } from "electron";
// @ts-ignore
import * as pdfjs from "pdfjs-dist/build/pdf";
// @ts-ignore
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";
import {
  PDFPageProxy,
  RenderParameters,
} from "pdfjs-dist/types/src/display/api";

import { PreviewRendererStateStore } from "@/state/renderer/appstate";

export class PreviewInteractor {
  stateStore: PreviewRendererStateStore;

  pdfWorker: Worker | null;
  renderingPage: PDFPageProxy | null;
  renderingPDF: pdfjs.PDFDocumentProxy | null;

  constructor(stateStore: PreviewRendererStateStore) {
    this.stateStore = stateStore;

    this.pdfWorker = null;
    this.renderingPage = null;
    this.renderingPDF = null;
    this.createPDFWorker();

    ipcRenderer.on("preview-file", async (event, fileURL) => {
      this.render(fileURL);
    });
  }

  async createPDFWorker() {
    if (this.pdfWorker) {
      this.pdfWorker.terminate();
    }
    this.pdfWorker = new pdfjsWorker();
    pdfjs.GlobalWorkerOptions.workerPort = this.pdfWorker;

    if (this.renderingPage) {
      this.renderingPage.cleanup();
    }
  }

  async render(fileURL: string) {
    this.stateStore.viewState.isRendering = true;
    this.createPDFWorker();
    if (this.renderingPDF) {
      this.renderingPDF.destroy();
    }

    const pdf = await pdfjs.getDocument(fileURL).promise;
    this.renderingPDF = pdf;

    const page = await pdf.getPage(1);
    this.renderingPage = page;
    var scale = 1.5;
    var viewport = page.getViewport({ scale: scale });
    var outputScale = window.devicePixelRatio || 1;
    var canvas = document.getElementById(
      "quickview-canvas"
    ) as HTMLCanvasElement;
    var context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.clearRect(0, 0, canvas.width, canvas.height);

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

    pdf.destroy();
    this.stateStore.viewState.isRendering = false;
  }

  close() {
    ipcRenderer.send("close-preview");
  }
}
