import { promises as fsPromise } from "fs";
import katex from "katex";
import MarkdownIt from "markdown-it";
import tm from "markdown-it-texmath";
import * as mupdf from "mupdf";

import { errorcatching } from "@/base/error";
import { createDecorator } from "@/base/injection/injection";
import { eraseProtocol } from "@/base/url";

export const IRenderService = createDecorator("renderService");

export class RenderService {
  private _markdownIt: MarkdownIt;

  constructor() {
    this._markdownIt = new MarkdownIt({ html: true }).use(tm, {
      engine: require("katex"),
      delimiters: "dollars",
      katexOptions: { macros: { "\\RR": "\\mathbb{R}" } },
    });
  }

  /**
   * Render PDF file as PNG
   * @param fileURL - File url
   * @returns Rendered PNG buffer
   */
  async renderPDF(fileURL: string) {
    const doc = mupdf.Document.openDocument(
      await fsPromise.readFile(eraseProtocol(fileURL)),
      "application/pdf"
    );
    const page = doc.loadPage(0);
    const pix = page.toPixmap(
      mupdf.Matrix.scale(0.5, 0.5),
      mupdf.ColorSpace.DeviceRGB,
      false,
      true
    );
    const buffer = pix.asJPEG(20, false);
    return buffer;
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
