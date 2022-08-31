// @ts-ignore
import * as pdfjs from "pdfjs-dist/build/pdf";
import { ipcRenderer } from "electron";
import { promises as fsPromise } from "fs";
import {
  PDFPageProxy,
  RenderParameters,
} from "pdfjs-dist/types/src/display/api";
import MarkdownIt from "markdown-it";
// @ts-ignore
import tm from "markdown-it-texmath";
import katex from "katex";

import { Preference } from "../utils/preference";

export class RenderInteractor {
  preference: Preference;
  markdownIt: MarkdownIt;
  pdfWorker: Worker | null;
  renderingPage: PDFPageProxy | null;
  renderingPDF: pdfjs.PDFDocumentProxy | null;

  constructor(preference: Preference) {
    this.preference = preference;

    this.pdfWorker = null;
    this.renderingPage = null;
    this.renderingPDF = null;
    this.createPDFWorker();

    this.markdownIt = new MarkdownIt().use(tm, {
      engine: require("katex"),
      delimiters: "dollars",
      katexOptions: { macros: { "\\RR": "\\mathbb{R}" } },
    });
  }

  async createPDFWorker() {
    if (this.pdfWorker) {
      this.pdfWorker.terminate();
    }
    this.pdfWorker = new Worker("./pdf.worker.min.js");
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
    if (
      this.preference.get("invertColor") &&
      (await ipcRenderer.invoke("getTheme"))
    ) {
      context.filter = "invert(0.9)";
      context.drawImage(canvas, 0, 0);
    }
    pdf.destroy();
    return true;
  }

  async renderMarkdown(content: string) {
    try {
      return this.markdownIt.render(content);
    } catch (e) {
      console.log(e);
      return "";
    }
  }

  async renderMarkdownFile(url: string) {
    // Read content from file
    try {
      const content = await fsPromise.readFile(
        url.replace("file://", ""),
        "utf8"
      );
      return this.markdownIt.render(content);
    } catch (e) {
      console.log(e);
      return "";
    }
  }

  async renderMath(content: string) {
    try {
      return renderWithDelimitersToString(content);
    } catch (e) {
      console.log(e);
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
