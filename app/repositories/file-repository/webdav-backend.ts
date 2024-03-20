import chokidar from "chokidar";
import { existsSync, promises as fsPromise, readFileSync } from "fs";
import path from "path";
import { WebDAVClient, createClient } from "webdav";

import { constructFileURL, eraseProtocol, getRelativePath } from "@/base/url";

import { LocalFileBackend } from "./local-backend";

export class WebDavFileBackend extends LocalFileBackend {
  private _webdavClient: WebDAVClient | null;
  private _watcher?: chokidar.FSWatcher;

  private readonly _webdavURL: string;
  private readonly _webdavUsername: string;
  private readonly _webdavPassword: string;

  private _tempDisableWatch: boolean = false;

  constructor(
    appLibFolder: string,
    fileMoveOperation: string,
    webdavURL: string,
    webdavUsername: string,
    webdavPassword: string
  ) {
    if (fileMoveOperation === "link") {
      fileMoveOperation = "copy";
    }

    super(appLibFolder, fileMoveOperation);

    this._webdavClient = null;

    this._webdavURL = webdavURL;
    this._webdavUsername = webdavUsername;
    this._webdavPassword = webdavPassword;

    this.check();
    this.startWatch();
  }

  async check() {
    if (this._webdavClient) {
      return true;
    }

    if (!this._webdavURL || !this._webdavUsername || !this._webdavPassword) {
      return false;
    }
    this._webdavClient = createClient(this._webdavURL, {
      username: this._webdavUsername,
      password: this._webdavPassword,
    });

    try {
      await this._webdavClient.getDirectoryContents("/");
    } catch (error) {
      console.log("WebDAV connection failed.", error);
    }

    if (!(await this._webdavClient.exists("/paperlib"))) {
      await this._webdavClient.createDirectory("/paperlib");
    }

    return true;
  }

  private _isValidFilePath(filePath: string): boolean {
    return (
      filePath !== "" &&
      !filePath.endsWith(".realm") &&
      !filePath.endsWith(".realm.lock") &&
      !filePath.endsWith(".mx") &&
      !filePath.endsWith(".realm.note") &&
      !filePath.endsWith(".DS_Store") &&
      !filePath.includes(".realm.management") &&
      !this._tempDisableWatch
    );
  }

  async startWatch(): Promise<void> {
    this._watcher = chokidar.watch(this._appLibFolder);

    this._watcher
      .on("add", async (filePath) => {
        if (this._isValidFilePath(filePath)) {
          try {
            await this._local2serverMove(
              filePath,
              constructFileURL(
                getRelativePath(filePath, this._appLibFolder),
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
      })
      .on("change", async (filePath) => {
        if (this._isValidFilePath(filePath)) {
          try {
            await this._local2serverMove(
              filePath,
              constructFileURL(
                getRelativePath(filePath, this._appLibFolder),
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
      })
      .on("unlink", async (filePath) => {
        if (this._isValidFilePath(filePath)) {
          try {
            await this._serverRemove(
              constructFileURL(
                getRelativePath(filePath, this._appLibFolder),
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
      })
      .on("addDir", async (dirPath) => {
        if (this._isValidFilePath(dirPath)) {
          try {
            await this._serverCreateDir(
              constructFileURL(
                getRelativePath(dirPath, this._appLibFolder),
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
      })
      .on("unlinkDir", async (dirPath) => {
        if (this._isValidFilePath(dirPath)) {
          try {
            await this._serverRemoveDir(
              constructFileURL(
                getRelativePath(dirPath, this._appLibFolder),
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

  async _serverExists(url: string): Promise<boolean> {
    const _URL = url.replace("webdav://", "/paperlib/");

    return (await this._webdavClient?.exists(_URL)) === true;
  }

  async _serverRemove(url: string): Promise<void> {
    const _URL = url.replace("webdav://", "/paperlib/");

    await this._webdavClient?.deleteFile(_URL);
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

  async _local2serverMove(sourceURL: string, targetURL: string): Promise<void> {
    const _sourceURL = eraseProtocol(sourceURL);
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

  async _serverCreateDir(url: string): Promise<void> {
    const _URL = url.replace("webdav://", "/paperlib/");

    await this._webdavClient?.createDirectory(_URL);
  }

  async _serverRemoveDir(url: string): Promise<void> {
    const _URL = url.replace("webdav://", "/paperlib/");

    await this._webdavClient?.deleteFile(_URL);
  }
}
