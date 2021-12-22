import * as pdfjs from "pdfjs-dist";
import { formatString } from "../utils/misc";
import { PaperEntityDraft } from "../models/PaperEntity";
import { promises as fsPromise, createWriteStream } from "fs";
import path from "path";
import os from "os";
import got from "got";
const stream = require("stream");
const { promisify } = require("util");

export class FileRepository {
  constructor(appStore) {
    const pdfjsWorker = import("pdfjs-dist/build/pdf.worker.entry");
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

    this.appStore = appStore;
  }

  // ============================================================
  // Read file from local storage
  constructUrl(url, joined) {
    if (path.isAbsolute(url)) {
      return url.replace("file://", "");
    } else {
      if (joined) {
        if (os.platform().startsWith("win")) {
          return path.join(this.appStore.get("appLibFolder"), url);
        } else {
          return "file://" + path.join(this.appStore.get("appLibFolder"), url);
        }
      } else {
        if (os.platform().startsWith("win")) {
          return url;
        } else {
          return "file://" + url;
        }
      }
    }
  }

  async read(url, webURL) {
    if (url.endsWith(".pdf")) {
      if (webURL) {
        return this.downloadPDF(url);
      } else {
        return await this.readPDF(url);
      }
    } else {
      throw new Error("Unsupported file type.");
    }
  }

  async readPDF(url) {
    try {
      const pdf = await pdfjs.getDocument(this.constructUrl(url)).promise;

      const entity = new PaperEntityDraft();

      if (this.appStore.get("allowFetchPDFMeta")) {
        const metaData = await pdf.getMetadata();
        const title = metaData.info.Title;
        const authors = metaData.info.Author;
        entity.setValue("title", title, false);
        entity.setValue("authors", authors, false);
      }

      // extract doi
      const firstPageText = await this.getPDFText(pdf);
      let doi = this.extractDOI(firstPageText);
      entity.setValue("doi", doi, false);
      let arxivId = this.extractArxivId(firstPageText);
      entity.setValue("arxiv", arxivId, false);

      entity.setValue("mainURL", url, false);
      return entity;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async downloadPDF(url) {
    try {
      let downloadUrl = url.split("=").pop();
      let filename = url.split("/").pop();
      let targetUrl = path.join(process.env.HOME, "Downloads", filename);
      console.log(downloadUrl);
      console.log(targetUrl);
      const pipeline = promisify(stream.pipeline);

      await pipeline(
        got.stream(downloadUrl),
        createWriteStream(
          this.constructUrl(targetUrl, false).replace("file://", "")
        )
      );
      return this.readPDF(targetUrl);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  renderPage(pageData) {
    const renderOptions = {
      normalizeWhitespace: false,
      disableCombineTextItems: false,
    };
    return pageData.getTextContent(renderOptions).then(function (textContent) {
      let lastY,
        text = "";
      for (const item of textContent.items) {
        if (lastY === item.transform[5] || !lastY) {
          text += item.str;
        } else {
          text += "\n" + item.str;
        }
        lastY = item.transform[5];
      }
      return text;
    });
  }

  async getPDFText(pdfData) {
    let firstPageText = "";
    const pageData = await pdfData.getPage(1);
    const pageText = await this.renderPage(pageData);
    firstPageText = `${firstPageText}\n\n${pageText}`;
    return firstPageText;
  }

  extractDOI(pdfText) {
    const doiRegex = new RegExp(
      "(?:" + '(10[.][0-9]{4,}(?:[.][0-9]+)*/(?:(?![%"#? ])\\S)+)' + ")",
      "g"
    );
    const doi = pdfText.match(doiRegex);
    if (doi) {
      return formatString({ str: doi[0], removeWhite: true });
    } else {
      return null;
    }
  }

  extractArxivId(pdfText) {
    const arxivRegex = new RegExp(
      "arXiv:(\\d{4}.\\d{4,5}|[a-z\\-] (\\.[A-Z]{2})?\\/\\d{7})(v\\d )?",
      "g"
    );
    const arxiv = pdfText.match(arxivRegex);
    if (arxiv) {
      return formatString({ str: arxiv[0], removeWhite: true });
    } else {
      return null;
    }
  }

  // ============================================================
  // Move local file to destination
  async _move(sourcePath, targetPath) {
    var _sourcePath = JSON.parse(JSON.stringify(sourcePath)).replace(
      "file://",
      ""
    );
    var _targetPath = JSON.parse(JSON.stringify(targetPath)).replace(
      "file://",
      ""
    );

    try {
      await fsPromise.copyFile(_sourcePath, _targetPath);
      if (this.appStore.get("deleteSourceFile")) {
        await fsPromise.unlink(sourcePath);
      }
      return true;
    } catch (error) {
      console.log("Copy file error: " + error);
      return false;
    }
  }

  // Move to DB folder
  async move(entity) {
    try {
      let targetFileName =
        entity.title.replace(/[^a-zA-Z ]/g, "").replace(/\s/g, "_") +
        "_" +
        entity.id.toString();

      var sourceUrls = [];
      for (let url of entity.supURLs) {
        sourceUrls.push(this.constructUrl(url, true));
      }
      entity.supURLs = [];

      var targetUrls = [];
      for (let i = 0; i < sourceUrls.length; i++) {
        let targetSupName =
          targetFileName +
          "_sup" +
          i +
          sourceUrls[i].substr(sourceUrls[i].lastIndexOf("."));
        targetUrls.push(this.constructUrl(targetSupName, true));
        entity.supURLs.push(targetSupName);
      }

      sourceUrls.push(this.constructUrl(entity.mainURL, true));
      let targetMainName =
        targetFileName +
        "_main" +
        entity.mainURL.substr(entity.mainURL.lastIndexOf("."));
      targetUrls.push(this.constructUrl(targetMainName, true));
      entity.mainURL = targetMainName;

      var promiseList = [];
      for (let i = 0; i < sourceUrls.length; i++) {
        if (sourceUrls[i] !== targetUrls[i]) {
          promiseList.push(this._move(sourceUrls[i], targetUrls[i]));
        }
      }
      if (promiseList.length > 0) {
        let successes = await Promise.all(promiseList);
        let success = successes.every((success) => success);
        return success;
      } else {
        return true;
      }
    } catch (error) {
      console.log(error);
      console.log("Error moving file.");
      return false;
    }
  }

  // Remove local file
  async _remove(sourcePath) {
    try {
      var _sourcePath = sourcePath.replace("file://", "");
      await fsPromise.unlink(_sourcePath);
      return true;
    } catch (error) {
      console.log("Remove file error: " + error);
      return false;
    }
  }

  async remove(entity) {
    try {
      var sourceUrls = [];
      for (let url of entity.supURLs) {
        sourceUrls.push(this.constructUrl(url, true));
      }
      sourceUrls.push(this.constructUrl(entity.mainURL, true));

      var promiseList = [];
      for (let url of sourceUrls) {
        promiseList.push(this._remove(url));
      }

      let successes = await Promise.all(promiseList);
      let success = successes.every((success) => success);
      return success;
    } catch (error) {
      console.log(error);
      console.log("Error removing file.");
      return false;
    }
  }

  async removeFile(url) {
    try {
      await this._remove(this.constructUrl(url, true));
      return true;
    } catch (error) {
      console.log(error);
      console.log("Error removing file.");
      return false;
    }
  }
}
