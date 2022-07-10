import path, { isAbsolute } from "path";
import { createClient, WebDAVClient } from "webdav";
import keytar from "keytar";
import chokidar from "chokidar";

import { FileBackend } from "./backend";

import { PaperEntityDraft } from "../../../models/PaperEntityDraft";
import { promises as fsPromise, readFileSync, existsSync, mkdirSync } from "fs";

import { Preference } from "../../../utils/preference";
import { SharedState } from "../../../utils/appstate";
import { constructFileURL } from "../../../utils/path";

export class WebDavFileBackend implements FileBackend {
  sharedState: SharedState;
  preference: Preference;

  webdavClient: WebDAVClient | null;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

    this.webdavClient = null;

    chokidar
      .watch(this.preference.get("appLibFolder") as string)
      .on("change", async (filePath) => {
        if (
          filePath &&
          !filePath.endsWith(".realm") &&
          !filePath.endsWith(".realm.lock") &&
          !filePath.endsWith(".write.mx") &&
          !filePath.endsWith(".control.mx")
        ) {
          try {
            await this._local2serverMove(
              filePath,
              constructFileURL(
                path.basename(filePath),
                false,
                true,
                "",
                "webdav://"
              )
            );
          } catch (error) {
            console.log(error);
            this.sharedState.set(
              "viewState.alertInformation",
              `Could not upload file to webdav: ${error as string}`
            );
          }
        }
      });
    void this.check();
  }

  async check() {
    if (this.webdavClient) {
      return true;
    }
    this.webdavClient = createClient(
      this.preference.get("webdavURL") as string,
      {
        username: this.preference.get("webdavUsername") as string,
        password: (await keytar.getPassword("paperlib", "webdav")) as string,
      }
    );

    try {
      const content = await this.webdavClient.getDirectoryContents("/");
      this.sharedState.set("viewState.syncFileStorageAvaliable", true);
      return true;
    } catch (error) {
      console.log(error);
      this.sharedState.set(
        "viewState.alertInformation",
        "Could not connect to webdav, check your username, password and url."
      );
      return false;
    }
  }

  async access(url: string, download = true): Promise<string> {
    await this.check();
    const basename = path.basename(url);
    const localURL = constructFileURL(
      basename,
      true,
      false,
      this.preference.get("appLibFolder") as string
    );
    // Check if file exists on local temp disk.
    const isExist = existsSync(localURL);
    if (!isExist) {
      if (download) {
        try {
          await this._server2localMove(
            constructFileURL(basename, false, true, "", "webdav://"),
            localURL
          );
        } catch (error) {
          console.log(error);
          this.sharedState.set(
            "viewState.alertInformation",
            `Could not download file from webdav: ${error as string}`
          );
          return "";
        }
      } else {
        if (
          await this._serverExists(
            constructFileURL(basename, false, true, "", "webdav://")
          )
        ) {
          return "donwloadRequired://";
        } else {
          return "";
        }
      }
    } else {
      const pathStat = await fsPromise.lstat(localURL.replace("file://", ""));
      if (!pathStat.isFile()) {
        return "";
      }
    }

    return Promise.resolve(
      constructFileURL(localURL, false, true, "", "file://")
    );
  }

  async _serverExists(url: string): Promise<boolean> {
    const _URL = url.replace("webdav://", "/paperlib/");

    return (await this.webdavClient?.exists(_URL)) === true;
  }

  async _server2serverMove(
    sourceURL: string,
    targetURL: string
  ): Promise<boolean> {
    const _sourceURL = sourceURL.replace("webdav://", "/paperlib/");
    const _targetURL = targetURL.replace("webdav://", "/paperlib/");
    await this.webdavClient?.moveFile(_sourceURL, _targetURL);
    return true;
  }

  async _local2localMove(
    sourceURL: string,
    targetURL: string
  ): Promise<boolean> {
    const _sourceURL = sourceURL.replace("file://", "");
    const _targetURL = targetURL.replace("file://", "");
    const stat = await fsPromise.lstat(_sourceURL);
    if (stat.isDirectory()) {
      return false;
    }
    try {
      await fsPromise.copyFile(_sourceURL, _targetURL);
      return true;
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Could not copy file: ${error as string}`
      );
      return false;
    }
  }

  async _local2serverMove(
    sourceURL: string,
    targetURL: string
  ): Promise<boolean> {
    const _sourceURL = sourceURL.replace("file://", "");
    const _targetURL = targetURL.replace("webdav://", "/paperlib/");

    const buffer = readFileSync(_sourceURL);
    await this.webdavClient?.putFileContents(_targetURL, buffer, {
      overwrite: true,
    });

    return true;
  }

  async _server2localMove(
    sourceURL: string,
    targetURL: string
  ): Promise<boolean> {
    const _sourceURL = sourceURL.replace("webdav://", "/paperlib/");
    const _targetURL = targetURL.replace("file://", "/");

    const buffer: Buffer = (await this.webdavClient?.getFileContents(
      _sourceURL
    )) as Buffer;

    await fsPromise.appendFile(_targetURL, Buffer.from(buffer));

    return true;
  }

  async _move(
    sourceURL: string,
    targetURL: string,
    targetCacheURL: string,
    forceDelete: boolean = false
  ): Promise<boolean> {
    try {
      let success;
      if (sourceURL.startsWith("file://")) {
        success = await this._local2localMove(sourceURL, targetCacheURL);
        success = await this._local2serverMove(sourceURL, targetURL);
        if (this.preference.get("deleteSourceFile") as boolean) {
          await fsPromise.unlink(sourceURL);
        }
      } else if (sourceURL.startsWith("webdav://")) {
        success = await this._server2serverMove(sourceURL, targetURL);
        if (
          ((this.preference.get("deleteSourceFile") as boolean) ||
            forceDelete) &&
          sourceURL.toLowerCase() !== targetURL.toLowerCase()
        ) {
          await this.webdavClient?.deleteFile(
            sourceURL.replace("webdav://", "/paperlib/")
          );
        }
      } else {
        throw new Error("Invalid source URL:" + sourceURL);
      }
      return success;
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Could not upload to webdav: ${error as string}`
      );
      return false;
    }
  }

  async move(
    entity: PaperEntityDraft,
    forceDelete: boolean = false
  ): Promise<PaperEntityDraft | null> {
    await this.check();

    let title =
      entity.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s/g, "_") ||
      "untitled";
    const firstCharTitle =
      title
        .split("_")
        .map((word: string) => {
          if (word) {
            return word.slice(0, 1);
          } else {
            return "";
          }
        })
        .filter((c: string) => c && c === c.toUpperCase())
        .join("") || "untitled";
    let author =
      entity.authors.split(",").map((author) => author.trim())[0] ||
      "anonymous";
    const firstName = author.split(" ")[0] || "anonymous";
    const lastName =
      author.split(" ")[author.split(" ").length - 1] || "anonymous";
    const year = entity.pubTime || "0000";
    const publication = entity.publication || "unknown";
    let id = entity._id.toString();

    let formatedFileName = "";
    if (this.preference.get("renamingFormat") === "short") {
      formatedFileName = `${firstCharTitle}_${id}`;
    } else if (this.preference.get("renamingFormat") === "authortitle") {
      if (author !== entity.authors && author !== "anonymous") {
        author = `${author} et al`;
      }
      id = id.slice(-5, -1);
      formatedFileName = `${author} - ${title.slice(0, 20)}_${id}`;
    } else if (this.preference.get("renamingFormat") === "custom") {
      formatedFileName = (this.preference.get("customRenamingFormat") as string)
        .replaceAll("{title}", title.slice(0, 150))
        .replaceAll("{firstchartitle}", firstCharTitle)
        .replaceAll("{author}", author)
        .replaceAll("{year}", year)
        .replaceAll("{lastname}", lastName)
        .replaceAll("{firstname}", firstName)
        .replaceAll("{publication}", publication.slice(0, 100))
        .slice(0, 250);
      if (formatedFileName) {
        formatedFileName = `${formatedFileName}_${id}`;
      } else {
        formatedFileName = `${id}`;
      }
    } else {
      formatedFileName = `${title.slice(0, 200)}_${id}`;
    }

    const targetFileName = formatedFileName;

    // 1. Move main file.
    let sourceMainURL;
    if (!isAbsolute(entity.mainURL.replace("file://", ""))) {
      sourceMainURL = constructFileURL(
        entity.mainURL,
        false,
        true,
        "",
        "webdav://"
      );
    } else {
      sourceMainURL = constructFileURL(
        entity.mainURL,
        false,
        true,
        "",
        "file://"
      );
    }
    const targetMainURL = constructFileURL(
      targetFileName + "_main" + path.extname(sourceMainURL),
      false,
      true,
      "",
      "webdav://"
    );
    const targetMainCacheURL = constructFileURL(
      targetFileName + "_main" + path.extname(sourceMainURL),
      true,
      false,
      this.preference.get("appLibFolder") as string
    );

    const mainSuccess = await this._move(
      sourceMainURL,
      targetMainURL,
      targetMainCacheURL,
      forceDelete
    );
    if (mainSuccess) {
      entity.mainURL = path.basename(targetMainURL);
    } else {
      // If main file move fails, return null.
      return null;
    }

    // 2. Move supplementary files.
    const sourceSupURLs = entity.supURLs.map((url) => {
      let sourceSupURL;
      if (!isAbsolute(url.replace("file://", ""))) {
        sourceSupURL = constructFileURL(url, false, true, "", "webdav://");
      } else {
        sourceSupURL = constructFileURL(url, false, true, "file://");
      }
      return sourceSupURL;
    });

    const SupMovePromise = async (
      sourceSupURL: string,
      targetSupURL: string,
      targetSupCacheURL: string
    ) => {
      const supSuccess = await this._move(
        sourceSupURL,
        targetSupURL,
        targetSupCacheURL,
        forceDelete
      );
      if (supSuccess) {
        return path.basename(targetSupURL);
      } else {
        return null;
      }
    };

    const supMovePromiseList = [];
    for (const [i, sourceSupURL] of sourceSupURLs.entries()) {
      const targetSupURL = constructFileURL(
        targetFileName + `_sup${i}` + path.extname(sourceSupURL),
        false,
        true,
        "",
        "webdav://"
      );
      const targetSupCacheURL = constructFileURL(
        targetFileName + `_sup${i}` + path.extname(sourceSupURL),
        true,
        false,
        this.preference.get("appLibFolder") as string
      );

      const supMovePromise = SupMovePromise(
        sourceSupURL,
        targetSupURL,
        targetSupCacheURL
      );
      supMovePromiseList.push(supMovePromise);
    }

    const targetSupURLs = (await Promise.all(supMovePromiseList)).filter(
      (url) => url !== null
    ) as string[];

    entity.supURLs = targetSupURLs;

    return entity;
  }

  async _remove(sourceURL: string) {
    try {
      await this._removeFileCache(sourceURL);
      const _sourceURL = sourceURL.replace("webdav://", "/paperlib/");
      await this.webdavClient?.deleteFile(_sourceURL);
      return true;
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Could not remove file on webdav: ${error as string}`
      );
      return false;
    }
  }

  async _removeFileCache(url: string) {
    const basename = path.basename(url);
    const localURL = constructFileURL(
      basename,
      true,
      false,
      this.preference.get("appLibFolder") as string
    );
    await fsPromise.unlink(localURL);
  }

  async remove(entity: PaperEntityDraft): Promise<boolean> {
    await this.check();
    const sourceUrls = [];
    for (const url of entity.supURLs) {
      sourceUrls.push(constructFileURL(url, false, true, "", "webdav://"));
    }
    sourceUrls.push(
      constructFileURL(entity.mainURL, false, true, "", "webdav://")
    );

    const successes = await Promise.all(
      sourceUrls.map((url) => this._remove(url))
    );
    const success = successes.every((success) => success);
    return success;
  }

  async removeFile(url: string) {
    await this.check();
    try {
      const fileURL = constructFileURL(url, false, true, "", "webdav://");
      return await this._remove(fileURL);
      return true;
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Could not remove file: ${error as string}`
      );
      return false;
    }
  }
}
