import chokidar from "chokidar";
import { existsSync, promises as fsPromise, readFileSync } from "fs";
import path, { isAbsolute } from "path";
import { WebDAVClient, createClient } from "webdav";

import { constructFileURL, eraseProtocol, isLocalPath } from "@/base/url";

import { IFileBackend } from "./backend";

export class WebDavFileBackend implements IFileBackend {
  private _webdavClient: WebDAVClient | null;
  private _watcher?: chokidar.FSWatcher;

  private readonly _appLibFolder: string;
  private readonly _fileMoveOperation: string;

  private readonly _webdavURL: string;
  private readonly _webdavUsername: string;
  private readonly _webdavPassword: string;

  constructor(
    appLibFolder: string,
    fileMoveOperation: string,
    webdavURL: string,
    webdavUsername: string,
    webdavPassword: string
  ) {
    this._webdavClient = null;

    this._appLibFolder = appLibFolder;
    this._fileMoveOperation = fileMoveOperation;

    this._webdavURL = webdavURL;
    this._webdavUsername = webdavUsername;
    this._webdavPassword = webdavPassword;

    void this.check();
    this.startWatch();
  }

  async check() {
    if (this._webdavClient) {
      return true;
    }

    this._webdavClient = createClient(this._webdavURL, {
      username: this._webdavUsername,
      password: this._webdavPassword,
    });

    await this._webdavClient.getDirectoryContents("/");

    if (!(await this._webdavClient.exists("/paperlib"))) {
      await this._webdavClient.createDirectory("/paperlib");
    }

    return true;
  }

  async access(url: string, download = true): Promise<string> {
    if (path.isAbsolute(eraseProtocol(url))) {
      return Promise.resolve(existsSync(eraseProtocol(url)) ? url : "");
    }

    await this.check();
    const basename = path.basename(url);
    const localURL = constructFileURL(
      basename,
      true,
      false,
      this._appLibFolder
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
          throw new Error(`Download file ${basename} failed.`);
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
      const pathStat = await fsPromise.lstat(eraseProtocol(localURL));
      if (!pathStat.isFile()) {
        return "";
      }
    }

    return Promise.resolve(
      constructFileURL(localURL, false, true, "", "file://")
    );
  }

  async startWatch(): Promise<void> {
    this._watcher = chokidar.watch(this._appLibFolder);

    this._watcher.on("change", async (filePath) => {
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
          console.error(error);
        }
      }
    });
  }

  async stopWatch(): Promise<void> {
    await this._watcher?.close();
  }

  async _serverExists(url: string): Promise<boolean> {
    const _URL = url.replace("webdav://", "/paperlib/");

    return (await this._webdavClient?.exists(_URL)) === true;
  }

  async _server2serverMove(
    sourceURL: string,
    targetURL: string
  ): Promise<void> {
    const _sourceURL = sourceURL.replace("webdav://", "/paperlib/");
    const _targetURL = targetURL.replace("webdav://", "/paperlib/");
    if (_sourceURL.toLowerCase() !== _targetURL.toLowerCase()) {
      await this._webdavClient?.moveFile(_sourceURL, _targetURL);
    }
  }

  async _local2localMove(sourceURL: string, targetURL: string): Promise<void> {
    const _sourceURL = eraseProtocol(sourceURL);
    const _targetURL = eraseProtocol(targetURL);
    const stat = await fsPromise.lstat(_sourceURL);
    if (stat.isDirectory()) {
      throw new Error("Cannot move a directory");
    }
    if (_sourceURL.toLowerCase() !== _targetURL.toLowerCase()) {
      await fsPromise.copyFile(_sourceURL, _targetURL);
    }
  }

  async _local2serverMove(sourceURL: string, targetURL: string): Promise<void> {
    const _sourceURL = sourceURL.replace("file://", "");
    const _targetURL = targetURL.replace("webdav://", "/paperlib/");

    const buffer = readFileSync(_sourceURL);
    await this._webdavClient?.putFileContents(_targetURL, buffer, {
      overwrite: true,
    });
  }

  async _server2localMove(sourceURL: string, targetURL: string): Promise<void> {
    const _sourceURL = sourceURL.replace("webdav://", "/paperlib/");
    const _targetURL = targetURL.replace("file://", "/");

    const buffer: Buffer = (await this._webdavClient?.getFileContents(
      _sourceURL
    )) as Buffer;

    await fsPromise.appendFile(_targetURL, Buffer.from(buffer));
  }

  async _move(
    sourceURL: string,
    targetURL: string,
    targetCacheURL: string,
    forceDelete: boolean = false
  ): Promise<void> {
    if (sourceURL.startsWith("file://")) {
      await this._local2localMove(sourceURL, targetCacheURL);

      const moveLocalToServer = async () => {
        logService?.info(
          "Uploading file to WebDAV...",
          sourceURL,
          true,
          "WebDAV"
        );

        await this._local2serverMove(sourceURL, targetURL);
        if (this._fileMoveOperation === "cut" || forceDelete) {
          await fsPromise.unlink(sourceURL.replace("file://", ""));
        }
      };

      moveLocalToServer();
    } else if (sourceURL.startsWith("webdav://")) {
      await this._server2serverMove(sourceURL, targetURL);
      if (
        (this._fileMoveOperation === "cut" || forceDelete) &&
        sourceURL.toLowerCase() !== targetURL.toLowerCase()
      ) {
        await this._webdavClient?.deleteFile(
          sourceURL.replace("webdav://", "/paperlib/")
        );
      }
    } else {
      throw new Error("Invalid source URL:" + sourceURL);
    }
  }

  async checkBaseFolder(folderPath: string): Promise<void> {
    console.log("check webdav", folderPath);

    await this.check();
    if (!(await this._serverExists(folderPath))) {
      await this._webdavClient?.createDirectory(
        folderPath.replace("webdav://", "/paperlib/"),
        {
          recursive: true,
        }
      );
    }
  }

  /**
   * Move file from sourceURL to targetURL
   * @param sourceURL - Source URL, also can be a file name in the app library folder
   * @param targetURL - Target URL, also can be a file name in the app library folder
   * @param forceDelete - Force delete source file
   * @param forceNotLink - Force not to use link, not available for webdav
   * @returns Target file name in the app library folder
   */
  async moveFile(
    sourceURL: string,
    targetURL: string,
    outerFileOperation: boolean = true
  ): Promise<string> {
    await this.check();

    // 1. Move main file.
    if (!isAbsolute(eraseProtocol(sourceURL))) {
      sourceURL = constructFileURL(sourceURL, false, true, "", "webdav://");
    } else {
      sourceURL = constructFileURL(sourceURL, false, true, "", "file://");
    }
    const targetCacheURL = constructFileURL(
      targetURL,
      true,
      false,
      this._appLibFolder
    );
    targetURL = constructFileURL(targetURL, false, true, "", "webdav://");

    console.log("sourceURL", sourceURL);
    console.log("targetURL", targetURL);

    // Webdav target url must be a file name.
    if (isLocalPath(eraseProtocol(sourceURL))) {
      const _folderPath = eraseProtocol(sourceURL);
      if (!existsSync(_folderPath)) {
        await fsPromise.mkdir(_folderPath, { recursive: true });
      }
    } else {
      await this.checkBaseFolder(sourceURL);
    }
    await this.checkBaseFolder(targetURL);

    await this._move(sourceURL, targetURL, targetCacheURL, forceDelete);
    return path.basename(targetURL);
  }

  async _remove(sourceURL: string) {
    await this._removeFileCache(sourceURL);
    const _sourceURL = sourceURL.replace("webdav://", "/paperlib/");
    await this._webdavClient?.deleteFile(_sourceURL);
  }

  async _removeFileCache(url: string) {
    try {
      const basename = path.basename(url);
      const localURL = constructFileURL(
        basename,
        true,
        false,
        this._appLibFolder
      );
      await fsPromise.unlink(localURL);
    } catch (error) {
      logService?.warn(
        "Failed to remove file cache",
        `url: ${url}, error: ${(error as Error).message}\n${
          (error as Error).stack
        }`,
        false,
        "WebDAVBackend"
      );
    }
  }

  async removeFile(sourceURL: string): Promise<void> {
    await this.check();
    const fileURL = constructFileURL(sourceURL, false, true, "", "webdav://");
    await this._remove(fileURL);
  }
}
