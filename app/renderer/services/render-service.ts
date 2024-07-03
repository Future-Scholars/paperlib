import { promises as fsPromise } from "fs";
import katex from "katex";
import MarkdownIt from "markdown-it";
import tm from "markdown-it-texmath";
import * as mupdf from "mupdf";

import { errorcatching } from "@/base/error";
import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { ThumbnailCache } from "@/models/paper-entity-cache";

export const IRenderService = createDecorator("renderService");

export class RenderService {
  private _pdfWorker?: Worker;
  private _markdownIt: MarkdownIt;

  constructor(
    @IPreferenceService private _preferenceService: PreferenceService
  ) {

    this._markdownIt = new MarkdownIt({ html: true }).use(tm, {
      engine: require("katex"),
      delimiters: "dollars",
      katexOptions: { macros: { "\\RR": "\\mathbb{R}" } },
    });
  }


  /**
   * Render PDF file to canvas
   * @param fileURL - File url
   * @param canvasId - Canvas id
   * @returns Renderer blob: {blob: ArrayBuffer | null, width: number, height: number}
   */
  async renderPDF(fileURL: string, canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;

    const doc = mupdf.Document.openDocument(await fsPromise.readFile(fileURL), "application/pdf");
    const page = doc.loadPage(0);
    const pix = page.toPixmap(mupdf.Matrix.identity, mupdf.ColorSpace.DeviceRGB);
    const blob = pix.asPNG();

    return { blob: blob, width: canvas.width, height: canvas.height };
  }

  /**
   * Render PDF cache to canvas
   * @param cachedThumbnail - Cached thumbnail
   * @param canvasId - Canvas id
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
   * @param content - Markdown content
   * @param renderFull - Render full content or not, default is false. If false, only render first 10 lines.
   * @returns Rendered string: {renderedStr: string, overflow: boolean}
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
   * @param url - File url
   * @param renderFull - Render full content or not, default is false. If false, only render first 10 lines.
   * @returns Rendered string: {renderedStr: string, overflow: boolean}
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
   * @param content - Math content
   * @returns Rendered HTML string
   */
  @errorcatching("Failed to render Math.", true, "RenderService", "")
  renderMath(content: string) {
    return renderWithDelimitersToString(content);
  }
}

function renderWithDelimitersToString(text: string) {
  var CleanAndRender = function (str: string) {
    return katex.renderToString(str.replace(/\\\(|\$|\\\)/g, ""), {
      throwOnError: false,
    });
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
