import { promises as fsPromise } from "fs";
import katex from "katex";
import MarkdownIt from "markdown-it";
import tm from "markdown-it-texmath";
import * as pdfjs from "pdfjs-dist/build/pdf";
// @ts-ignore
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?worker";
import {
  PDFPageProxy,
  RenderParameters,
} from "pdfjs-dist/types/src/display/api";

import { errorcatching } from "@/base/error";
import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { ThumbnailCache } from "@/models/paper-entity-cache";

export const IRenderService = createDecorator("renderService");

export class RenderService {
  private _pdfWorker: Worker | null;
  private _renderingPage: PDFPageProxy | null;
  private _renderingPDF: pdfjs.PDFDocumentProxy | null;

  private _markdownIt: MarkdownIt;

  constructor(
    @IPreferenceService private _preferenceService: PreferenceService
  ) {
    this._pdfWorker = null;
    this._renderingPage = null;
    this._renderingPDF = null;
    this._createPDFWorker();

    this._markdownIt = new MarkdownIt({ html: true }).use(tm, {
      engine: require("katex"),
      delimiters: "dollars",
      katexOptions: { macros: { "\\RR": "\\mathbb{R}" } },
    });
  }

  private async _createPDFWorker() {
    if (this._pdfWorker) {
      this._pdfWorker.terminate();
    }
    this._pdfWorker = new pdfjsWorker();
    pdfjs.GlobalWorkerOptions.workerPort = this._pdfWorker;

    if (this._renderingPage) {
      this._renderingPage.cleanup();
    }
  }

  /**
   * Render PDF file to canvas
   * @param fileURL - file url
   * @param canvasId - canvas id
   * @returns - {blob: ArrayBuffer | null, width: number, height: number}
   */
  @errorcatching("Failed to render PDF file.", true, "RendererService", {
    blob: null,
    width: 0,
    height: 0,
  })
  async renderPDF(fileURL: string, canvasId: string) {
    this._createPDFWorker();
    if (this._renderingPDF) {
      this._renderingPDF.destroy();
    }
    const pdf = await pdfjs.getDocument({
      url: fileURL,
      useWorkerFetch: true,
      cMapUrl: "../viewer/cmaps/",
    }).promise;
    this._renderingPDF = pdf;

    const page = await pdf.getPage(1);
    this._renderingPage = page;
    var scale = 0.25;
    var viewport = page.getViewport({ scale: scale });
    var outputScale = window.devicePixelRatio || 1;
    var canvas = document.getElementById(canvasId) as HTMLCanvasElement;
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
      this._preferenceService.get("invertColor") &&
      (await PLMainAPI.windowProcessManagementService.isDarkMode())
    ) {
      context.filter = "invert(0.9)";
      context.drawImage(canvas, 0, 0);
    }
    pdf.destroy();
    return { blob: blob, width: canvas.width, height: canvas.height };
  }

  /**
   * Render PDF cache to canvas
   * @param cachedThumbnail - cached thumbnail
   * @param canvasId - canvas id
   */
  @errorcatching("Failed to render PDF cache.", true, "RenderService")
  async renderPDFCache(cachedThumbnail: ThumbnailCache, canvasId: string) {
    const url = URL.createObjectURL(new Blob([cachedThumbnail.blob]));
    const img = new Image();
    img.src = url;
    var canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    canvas.width = cachedThumbnail.width;
    canvas.height = cachedThumbnail.height;
    var context = canvas.getContext("2d") as CanvasRenderingContext2D;
    context.clearRect(0, 0, canvas.width, canvas.height);
    img.onload = async () => {
      if (
        this._preferenceService.get("invertColor") &&
        (await PLMainAPI.windowProcessManagementService.isDarkMode())
      ) {
        context.filter = "invert(0.9)";
        context.drawImage(img, 0, 0);
      } else {
        context.drawImage(img, 0, 0);
      }
    };
  }

  /**
   * Render Markdown to HTML
   * @param content - markdown content
   * @param renderFull - render full content or not
   * @returns - {renderedStr: string, overflow: boolean}
   */
  @errorcatching("Failed to render Markdown.", true, "RenderService", {
    renderedStr: "",
    overflow: false,
  })
  async renderMarkdown(content: string, renderFull = false) {
    let renderContent: string;
    let overflow: boolean;
    if (!renderFull) {
      const lines = content.split("\n");
      const renderLines = lines.slice(0, 10);
      overflow = lines.length > 10;
      renderContent = renderLines.join("\n");
    } else {
      overflow = false;
      renderContent = content;
    }
    return {
      renderedStr: this._markdownIt.render(renderContent),
      overflow: overflow,
    };
  }

  /**
   * Render Markdown file to HTML
   * @param url - file url
   * @param renderFull - render full content or not
   * @returns - {renderedStr: string, overflow: boolean}
   */
  @errorcatching("Failed to render Markdown file.", true, "RenderService", {
    renderedStr: "",
    overflow: false,
  })
  async renderMarkdownFile(url: string, renderFull = false) {
    const content = await fsPromise.readFile(
      url.replace("file://", ""),
      "utf8"
    );

    return await this.renderMarkdown(content, renderFull);
  }

  /**
   * Render Math to HTML
   * @param content - math content
   * @returns - rendered HTML string
   */
  @errorcatching("Failed to render Math.", true, "RenderService", "")
  async renderMath(content: string) {
    return renderWithDelimitersToString(content);
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
