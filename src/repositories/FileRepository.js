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
    constructor(preference) {
        const pdfjsWorker = import("pdfjs-dist/build/pdf.worker.entry");
        pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

        this.preference = preference;
    }

    // ============================================================
    // Read file from local storage
    constructUrl(url, joined, withProtocol = true) {
        var outURL;
        if (path.isAbsolute(url)) {
            outURL = url;
        } else {
            if (joined) {
                outURL = path.join(this.preference.get("appLibFolder"), url);
            } else {
                outURL = url;
            }
        }
        if (os.platform().startsWith("win")) {
            return outURL;
        } else {
            if (withProtocol) {
                if (outURL.startsWith("file://")) {
                    return outURL;
                } else {
                    return "file://" + outURL;
                }
            } else {
                return outURL.replace("file://", "");
            }
        }
    }

    async read(url) {
        console.log("read", url);
        if (url.endsWith(".pdf")) {
            if (url.startsWith("paperlib://")) {
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
            const pdf = await pdfjs.getDocument(
                this.constructUrl(url, false, true)
            ).promise;

            const entity = new PaperEntityDraft();

            if (this.preference.get("allowFetchPDFMeta")) {
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
        console.log("download", url);
        try {
            let downloadUrl = url.split("=").pop();
            let filename = url.split("/").pop();
            let targetUrl = path.join(os.homedir(), "Downloads", filename);
            console.log(targetUrl);
            console.log(downloadUrl);
            console.log(targetUrl);
            const pipeline = promisify(stream.pipeline);

            await pipeline(
                got.stream(downloadUrl),
                createWriteStream(this.constructUrl(targetUrl, false, false))
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
        return pageData
            .getTextContent(renderOptions)
            .then(function (textContent) {
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
            if (this.preference.get("deleteSourceFile")) {
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
                entity.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s/g, "_") +
                "_" +
                entity._id.toString();

            var sourceUrls = [];
            for (let url of entity.supURLs) {
                sourceUrls.push(this.constructUrl(url, true, false));
            }
            entity.supURLs = [];

            var targetUrls = [];
            for (let i = 0; i < sourceUrls.length; i++) {
                let targetSupName =
                    targetFileName +
                    "_sup" +
                    i +
                    sourceUrls[i].substr(sourceUrls[i].lastIndexOf("."));
                targetUrls.push(this.constructUrl(targetSupName, true, false));
                entity.supURLs.push(targetSupName);
            }

            sourceUrls.push(this.constructUrl(entity.mainURL, true, false));
            let targetMainName =
                targetFileName +
                "_main" +
                entity.mainURL.substr(entity.mainURL.lastIndexOf("."));
            targetUrls.push(this.constructUrl(targetMainName, true, false));
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
                sourceUrls.push(this.constructUrl(url, true, false));
            }
            sourceUrls.push(this.constructUrl(entity.mainURL, true, false));

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
            await this._remove(this.constructUrl(url, true, false));
            return true;
        } catch (error) {
            console.log(error);
            console.log("Error removing file.");
            return false;
        }
    }
}
