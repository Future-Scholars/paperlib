import chokidar from "chokidar";
import { existsSync, promises as fsPromise, readFileSync } from "fs";
import keytar from "keytar";
import path, { isAbsolute } from "path";
import { WebDAVClient, createClient } from "webdav";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { constructFileURL } from "@/utils/path";

import { FileBackend } from "./backend";

export class WebDavFileBackend implements FileBackend {
  stateStore: MainRendererStateStore;
  preference: Preference;

  webdavClient: WebDAVClient | null;
  watcher?: chokidar.FSWatcher;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.webdavClient = null;

    void this.check();
    this.startWatch();
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
      this.stateStore.viewState.syncFileStorageAvaliable = true;
      return true;
    } catch (error) {
      this.stateStore.viewState.syncFileStorageAvaliable = false;
      window.logger.error(
        "Could not connect to webdav, check your username, password and url.",
        error as Error,
        true,
        "WebDAV"
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
          window.logger.error(
            "Could not download file from webdav.",
            error as Error,
            true,
            "WebDAV"
          );
          return "";
        }
      } else {
        if (
          await this._serverExists(
            constructFileURL(basename, false, true, "", "webdav://")
          )
        ) {
          return "downloadRequired://";
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

  startWatch() {
    this.watcher = chokidar.watch(
      this.preference.get("appLibFolder") as string
    );

    this.watcher.on("change", async (filePath) => {
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
          window.logger.error(
            "Could not upload file to webdav.",
            error as Error,
            true,
            "WebDAV"
          );
        }
      }
    });
  }

  async stopWatch(): Promise<void> {
    await this.watcher?.close();
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
    if (_sourceURL.toLowerCase() !== _targetURL.toLowerCase()) {
      await this.webdavClient?.moveFile(_sourceURL, _targetURL);
    }
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
      if (_sourceURL.toLowerCase() !== _targetURL.toLowerCase()) {
        await fsPromise.copyFile(_sourceURL, _targetURL);
      }
      return true;
    } catch (error) {
      window.logger.error(
        "Could not copy file",
        error as Error,
        true,
        "WebDAV"
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
        if ((this.preference.get("sourceFileOperation") as string) === "cut") {
          await fsPromise.unlink(sourceURL.replace("file://", ""));
        }
      } else if (sourceURL.startsWith("webdav://")) {
        success = await this._server2serverMove(sourceURL, targetURL);
        if (
          ((this.preference.get("sourceFileOperation") as string) === "cut" ||
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
      window.logger.error(
        "Could not upload file",
        error as Error,
        true,
        "WebDAV"
      );
      return false;
    }
  }

  async move(
    paperEntity: PaperEntity,
    forceDelete: boolean = false,
    forceNotLink: boolean = false
  ): Promise<PaperEntity | null> {
    await this.check();

    let title =
      paperEntity.title.replace(/[^\p{L}|\s]/gu, "").replace(/\s/g, "_") ||
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
      paperEntity.authors.split(",").map((author) => author.trim())[0] ||
      "anonymous";
    const firstName = author.split(" ")[0] || "anonymous";
    const lastName =
      author.split(" ")[author.split(" ").length - 1] || "anonymous";
    const year = paperEntity.pubTime || "0000";
    const publication = paperEntity.publication || "unknown";
    let id = paperEntity._id.toString();

    let formatedFileName = "";
    if (this.preference.get("renamingFormat") === "short") {
      formatedFileName = `${firstCharTitle}_${id}`;
    } else if (this.preference.get("renamingFormat") === "authortitle") {
      if (author !== paperEntity.authors && author !== "anonymous") {
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
    if (!isAbsolute(paperEntity.mainURL.replace("file://", ""))) {
      sourceMainURL = constructFileURL(
        paperEntity.mainURL,
        false,
        true,
        "",
        "webdav://"
      );
    } else {
      sourceMainURL = constructFileURL(
        paperEntity.mainURL,
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
      paperEntity.mainURL = path.basename(targetMainURL);
    } else {
      // If main file move fails, return null.
      return null;
    }

    // 2. Move supplementary files.
    const sourceSupURLs = paperEntity.supURLs.map((url) => {
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

    paperEntity.supURLs = targetSupURLs;

    return paperEntity;
  }

  async _remove(sourceURL: string) {
    try {
      await this._removeFileCache(sourceURL);
      const _sourceURL = sourceURL.replace("webdav://", "/paperlib/");
      await this.webdavClient?.deleteFile(_sourceURL);
      return true;
    } catch (error) {
      window.logger.error(
        "Could not remove file",
        error as Error,
        true,
        "WebDAV"
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

  async remove(paperEntity: PaperEntity): Promise<boolean> {
    await this.check();
    const sourceUrls = [];
    for (const url of paperEntity.supURLs) {
      sourceUrls.push(constructFileURL(url, false, true, "", "webdav://"));
    }
    sourceUrls.push(
      constructFileURL(paperEntity.mainURL, false, true, "", "webdav://")
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
    } catch (error) {
      window.logger.error(
        "Could not remove file",
        error as Error,
        true,
        "WebDAV"
      );
      return false;
    }
  }
}
