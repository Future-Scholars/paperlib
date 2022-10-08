import { ipcRenderer } from "electron";
import { promises as fsPromise } from "fs";
import katex from "katex";
import MarkdownIt from "markdown-it";
// @ts-ignore
import tm from "markdown-it-texmath";
// @ts-ignore
import * as pdfjs from "pdfjs-dist/build/pdf";
import {
  PDFPageProxy,
  RenderParameters,
} from "pdfjs-dist/types/src/display/api";

import { ThumbnailCache } from "@/models/paper-entity-cache";
import { Preference } from "@/preference/preference";

export class RenderInteractor {
  preference: Preference;

  pdfWorker: Worker | null;
  renderingPage: PDFPageProxy | null;
  renderingPDF: pdfjs.PDFDocumentProxy | null;

  markdownIt: MarkdownIt;

  constructor(preference: Preference) {
    this.preference = preference;

    this.pdfWorker = null;
    this.renderingPage = null;
    this.renderingPDF = null;
    this.createPDFWorker();

    this.markdownIt = new MarkdownIt({ html: true }).use(tm, {
      engine: require("katex"),
      delimiters: "dollars",
      katexOptions: { macros: { "\\RR": "\\mathbb{R}" } },
    });
  }

  async createPDFWorker() {
    if (this.pdfWorker) {
      this.pdfWorker.terminate();
    }
    this.pdfWorker = new Worker("./build/pdf.worker.min.js");
    pdfjs.GlobalWorkerOptions.workerPort = this.pdfWorker;

    if (this.renderingPage) {
      this.renderingPage.cleanup();
    }
  }

  async render(fileURL: string) {
    this.createPDFWorker();
    if (this.renderingPDF) {
      this.renderingPDF.destroy();
    }
    const pdf = await pdfjs.getDocument(fileURL).promise;
    this.renderingPDF = pdf;

    const page = await pdf.getPage(1);
    this.renderingPage = page;
    var scale = 0.25;
    var viewport = page.getViewport({ scale: scale });
    var outputScale = window.devicePixelRatio || 1;
    var canvas = document.getElementById("preview-canvas") as HTMLCanvasElement;
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

    const blob = (await new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        resolve((await blob?.arrayBuffer()) || null);
      }, "image/png");
    })) as ArrayBuffer | null;

    if (
      this.preference.get("invertColor") &&
      (await ipcRenderer.invoke("getTheme"))
    ) {
      context.filter = "invert(0.9)";
      context.drawImage(canvas, 0, 0);
    }
    pdf.destroy();
    return { blob: blob, width: canvas.width, height: canvas.height };
  }

  async renderCache(cachedThumbnail: ThumbnailCache) {
    const url = URL.createObjectURL(new Blob([cachedThumbnail.blob]));
    const img = new Image();
    img.src = url;
    var canvas = document.getElementById("preview-canvas") as HTMLCanvasElement;
    canvas.width = cachedThumbnail.width;
    canvas.height = cachedThumbnail.height;
    var context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.clearRect(0, 0, canvas.width, canvas.height);
    img.onload = async () => {
      if (
        this.preference.get("invertColor") &&
        (await ipcRenderer.invoke("getTheme"))
      ) {
        context.filter = "invert(0.9)";
        context.drawImage(img, 0, 0);
      } else {
        context.drawImage(img, 0, 0);
      }
    };
  }

  async renderMarkdown(content: string, renderFull = false) {
    try {
      let renderContent;
      let overflow;
      if (!renderFull) {
        const lines = content.split("\n");
        const renderLines = lines.slice(0, 10)
        overflow = lines.length > 10;
        renderContent = renderLines.join("\n");
      } else {
        overflow = false;
        renderContent = content;
      }
      return { renderedStr: this.markdownIt.render(renderContent), overflow: overflow };
    } catch (e) {
      console.error(e);
      return { renderedStr: "", overflow: false };
    }
  }

  async renderMarkdownFile(url: string, renderFull = false) {
    const content = await fsPromise.readFile(
      url.replace("file://", ""),
      "utf8"
    );

    return await this.renderMarkdown(content, renderFull);
  }

  async renderMath(content: string) {
    try {
      return renderWithDelimitersToString(content);
    } catch (e) {
      console.error(e);
      return content;
    }
  }
}

function renderWithDelimitersToString(text: string) {
  var CleanAndRender = function (str: string) {
    return katex.renderToString(str.replace(/\\\(|\$|\\\)/g, ""));
  };
  return text.replace(
    /(\\\([^]*?\\\))|(\$[^]*?\$)/g,
    function (m, bracket, dollar) {
      if (bracket !== undefined) return CleanAndRender(m);
      if (dollar !== undefined)
        return (
          "<span style='width:100%;text-align:center;'>" +
          CleanAndRender(m) +
          "</span>"
        );
      return m;
    }
  );
}
