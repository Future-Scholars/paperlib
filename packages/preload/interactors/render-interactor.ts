// @ts-ignore
import * as pdfjs from "pdfjs-dist/build/pdf";
import { ipcRenderer } from "electron";
import { promises as fsPromise } from "fs";
import { RenderParameters } from "pdfjs-dist/types/src/display/api";
import MarkdownIt from "markdown-it";
// @ts-ignore
import tm from "markdown-it-texmath";

import { Preference } from "../utils/preference";

export class RenderInteractor {
  preference: Preference;
  markdownIt: MarkdownIt;

  constructor(preference: Preference) {
    this.preference = preference;

    pdfjs.GlobalWorkerOptions.workerPort = new Worker("./pdf.worker.min.js");

    this.markdownIt = new MarkdownIt().use(tm, {
      engine: require("katex"),
      delimiters: "dollars",
      katexOptions: { macros: { "\\RR": "\\mathbb{R}" } },
    });
  }

  async render(fileURL: string) {
    // @ts-ignore
    const pdf = await pdfjs.getDocument(fileURL).promise;
    const page = await pdf.getPage(1);
    var scale = 0.25;
    var viewport = page.getViewport({ scale: scale });
    var outputScale = window.devicePixelRatio || 1;
    var canvas = document.getElementById("preview-canvas") as HTMLCanvasElement;
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
    if (
      this.preference.get("invertColor") &&
      (await ipcRenderer.invoke("getTheme"))
    ) {
      context.filter = "invert(0.9)";
      context.drawImage(canvas, 0, 0);
    }
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
}
