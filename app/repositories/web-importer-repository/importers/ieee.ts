import { createWriteStream } from "fs";
import got from "got";
import { parse } from "node-html-parser";
import os from "os";
import path from "path";
import stream from "stream";
import { CookieJar } from "tough-cookie";
import { promisify } from "util";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { constructFileURL } from "@/utils/path";

import { WebContentType, WebImporter } from "./importer";

export class IEEEWebImporter extends WebImporter {
  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    const urlRegExp = new RegExp("^https?://ieeexplore.ieee.org/document");
    super(stateStore, preference, urlRegExp);
  }

  async parsingProcess(
    webContent: WebContentType
  ): Promise<PaperEntity | boolean> {
    let entityDraft: PaperEntity | boolean = false;

    const cookieJar = new CookieJar();

    const root = parse(webContent.document);
    const metaNodes = root.querySelectorAll("script");
    const meta = metaNodes.find((node) =>
      node.rawText.includes("xplGlobal.document.metadata")
    );
    if (meta) {
      entityDraft = new PaperEntity(true);
      const metaStr = meta.rawText;

      const title = metaStr.match(/"title":"(.*?)",/);
      if (title) {
        entityDraft.title = title[1];
      }
      const publication = metaStr.match(/"publicationTitle":"(.*?)",/);
      if (publication) {
        entityDraft.publication = publication[1];
      }
      const doi = metaStr.match(/"doi":"(.*?)",/);
      if (doi) {
        entityDraft.doi = doi[1];
      }
      const publicationYear = metaStr.match(/"publicationYear":"(.*?)",/);
      if (publicationYear) {
        entityDraft.publicationYear = publicationYear[1];
      }

      const firstNames = metaStr.matchAll(/"firstName":"(.*?)",/g);
      const lastNames = metaStr.matchAll(/"lastNames":"(.*?)",/g);
      let firstNamesList: string[] = [];
      let lastNamesList: string[] = [];
      for (const match of firstNames) {
        firstNamesList.push(match[1]);
      }
      for (const match of lastNames) {
        lastNamesList.push(match[1]);
      }
      entityDraft.authors = firstNamesList
        .map((firstName, index) => {
          return `${firstName} ${lastNamesList[index]}`;
        })
        .join(", ");

      const pdfPath = metaStr.match(/"pdfPath":"(.*?)",/);
      const pdfAccessNode = root.querySelector(".pdf-btn-link");
      if (pdfPath && pdfAccessNode) {
        const url = `https://ieeexplore.ieee.org${pdfPath[1].replace(
          "iel7",
          "ielx7"
        )}`;

        for (const cookie of webContent.cookies) {
          if (cookie) {
            await cookieJar.setCookie(
              // @ts-ignore
              `${cookie.name}=${cookie.value}; domain=${cookie.domain}`,
              // @ts-ignore
              `https://${cookie.domain}/`
            );
          }
        }
        const headers = {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
          "Content-Type": "application/pdf",
        };
        const options = {
          headers: headers,
          retry: 0,
          timeout: {
            request: 5000,
          },
          rejectUnauthorized: false,
          cookieJar,
        };
        try {
          let filename = url.split("/").pop() as string;
          if (!filename.endsWith(".pdf")) {
            filename += ".pdf";
          }
          const targetUrl = path.join(os.homedir(), "Downloads", filename);
          const pipeline = promisify(stream.pipeline);
          await pipeline(
            // TODO: check this
            got.stream(url, options),
            createWriteStream(constructFileURL(targetUrl, false, false))
          );
          entityDraft.mainURL = targetUrl;
        } catch (e) {
          console.log(e);
        }
      }
    }

    return entityDraft;
  }
}
