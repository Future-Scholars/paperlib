import Watcher from "watcher";

import { existsSync, promises as fsPromise, readFileSync } from "fs";
import path from "path";
import { WebDAVClient, createClient } from "webdav";
import { Agent, ProxyAgent } from "undici";

import { constructFileURL, eraseProtocol, getRelativePath } from "@/base/url";

import { LocalFileBackend } from "./local-backend";
import { Process } from "@/base/process-id";

export class WebDavFileBackend extends LocalFileBackend {
  private _webdavClient: WebDAVClient | null;
  private _watcher?: Watcher;

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

    const opt = {
      username: this._webdavUsername,
      password: this._webdavPassword,
    }

    // try {
    //   await rendererRPCService.waitForAPI(Process.extension, "PLExtAPI", 5000);
    //   const proxyConfig = await PLExtAPI.networkTool.getProxyConfig();
    //   if (proxyConfig.httpproxy) {
    //     const httpproxyOpt = {
    //       uri: proxyConfig.httpproxy,
    //     }
    //     if (proxyConfig.caCert || proxyConfig.caClientKey || proxyConfig.caClinetCert) {
    //       httpproxyOpt["ca"] = proxyConfig.caCert;
    //       httpproxyOpt["connect"] = {
    //           ca: proxyConfig.caCert,
    //           key: proxyConfig.caClientKey,
    //           cert: proxyConfig.caClinetCert,
    //       };
    //       httpproxyOpt["proxyTls"] = {
    //         ca: proxyConfig.caCert,
    //         key: proxyConfig.caClientKey,
    //         cert: proxyConfig.caClinetCert,
    //       }
    //       httpproxyOpt["requestTls"] = {
    //         ca: proxyConfig.caCert,
    //         key: proxyConfig.caClientKey,
    //         cert: proxyConfig.caClinetCert
    //       }
    //     }
    //     opt["httpAgent"] = new ProxyAgent(httpproxyOpt);
    //   }
      
    //   if (proxyConfig.httpsproxy) {
    //     const httpsproxyOpt = {
    //       uri: proxyConfig.httpsproxy,
    //     }
    //     if (proxyConfig.caCert || proxyConfig.caClientKey || proxyConfig.caClinetCert) {
    //       httpsproxyOpt["ca"] = proxyConfig.caCert;
    //       httpsproxyOpt["connect"] = {
    //           ca: proxyConfig.caCert,
    //           key: proxyConfig.caClientKey,
    //           cert: proxyConfig.caClinetCert,
    //       };
    //       httpsproxyOpt["proxyTls"] = {
    //         ca: proxyConfig.caCert,
    //         key: proxyConfig.caClientKey,
    //         cert: proxyConfig.caClinetCert,
    //       }
    //       httpsproxyOpt["requestTls"] = {
    //         ca: proxyConfig.caCert,
    //         key: proxyConfig.caClientKey,
    //         cert: proxyConfig.caClinetCert
    //       }
    //     }
    //     opt["httpsAgent"] = new ProxyAgent(httpsproxyOpt);
    //   }
    // } catch (error) {
    //   PLAPI.logService.error("Cannot get the proxy configuration.", error as Error, false, "WebDAVBackend");
    // }

    this._webdavClient = createClient(this._webdavURL, opt);

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
      !filePath.includes(".realm.management")
    );
  }

  async startWatch(): Promise<void> {
    this._watcher = new Watcher(this._appLibFolder, {
      renameDetection: true,
      recursive: true,
      ignoreInitial: true,
    });

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
      })
      .on("rename", async (filePath, filePathNext) => {
        if (this._isValidFilePath(filePath)) {
          try {
            // Check if webdav folder exists.
            const dir = constructFileURL(
              path.dirname(getRelativePath(filePathNext, this._appLibFolder)),
              false,
              true,
              "",
              "webdav://"
            );
            if (!(await this._serverExists(dir))) {
              await this._serverCreateDir(dir);
            }

            await this._server2serverMove(
              constructFileURL(
                getRelativePath(filePath, this._appLibFolder),
                false,
                true,
                "",
                "webdav://"
              ),
              constructFileURL(
                getRelativePath(filePathNext, this._appLibFolder),
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
    const localURL = constructFileURL(url, true, false, this._appLibFolder);
    // Check if file exists on local temp disk.
    const isExist = existsSync(localURL);
    if (!isExist) {
      if (download) {
        try {
          await this._server2localMove(
            constructFileURL(url, false, true, "", "webdav://"),
            localURL
          );
        } catch (error) {
          throw new Error(`Download file ${url} failed.`);
        }
      } else {
        if (
          await this._serverExists(
            constructFileURL(url, false, true, "", "webdav://")
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
    const _URL = url.replace("webdav://", "/paperlib/").replace(/\\/g, "/");
    try {
      return (await this._webdavClient?.exists(_URL)) === true;
    } catch (error) {
      return false;
    }
  }

  async _serverRemove(url: string): Promise<void> {
    const _URL = url.replace("webdav://", "/paperlib/").replace(/\\/g, "/");

    await this._webdavClient?.deleteFile(_URL);
  }

  async _server2serverMove(
    sourceURL: string,
    targetURL: string
  ): Promise<void> {
    const _sourceURL = sourceURL
      .replace("webdav://", "/paperlib/")
      .replace(/\\/g, "/");
    const _targetURL = targetURL
      .replace("webdav://", "/paperlib/")
      .replace(/\\/g, "/");

    if (_sourceURL.toLowerCase() !== _targetURL.toLowerCase()) {
      await this._webdavClient?.moveFile(_sourceURL, _targetURL);
    }
  }

  async _local2serverMove(sourceURL: string, targetURL: string): Promise<void> {
    const _sourceURL = eraseProtocol(sourceURL);
    const _targetURL = targetURL
      .replace("webdav://", "/paperlib/")
      .replace(/\\/g, "/");

    const buffer = readFileSync(_sourceURL);
    await this._webdavClient?.putFileContents(_targetURL, buffer, {
      overwrite: true,
    });
  }

  async _server2localMove(sourceURL: string, targetURL: string): Promise<void> {
    const _sourceURL = sourceURL
      .replace("webdav://", "/paperlib/")
      .replace(/\\/g, "/");
    const _targetURL = targetURL.replace("file://", "/");

    const buffer: Buffer = (await this._webdavClient?.getFileContents(
      _sourceURL
    )) as Buffer;

    // Create directory if not exists.
    const dir = path.dirname(_targetURL);
    if (!existsSync(dir)) {
      await fsPromise.mkdir(dir, { recursive: true });
    }

    await fsPromise.appendFile(_targetURL, Buffer.from(buffer));
  }

  async _serverCreateDir(url: string): Promise<void> {
    const _URL = url.replace("webdav://", "/paperlib/").replace(/\\/g, "/");

    await this._webdavClient?.createDirectory(_URL, { recursive: true });
  }

  async _serverRemoveDir(url: string): Promise<void> {
    const _URL = url.replace("webdav://", "/paperlib/").replace(/\\/g, "/");

    await this._webdavClient?.deleteFile(_URL);
  }

  async _move(sourceURL: string, targetURL: string, outerFileOperation?: boolean): Promise<void> {
    try {
      return await super._move(sourceURL, targetURL, outerFileOperation)
    } catch (error) {
      if (!outerFileOperation) {
        try {
          const sourceRelativeURL = getRelativePath(sourceURL, this._appLibFolder);
          const targetRelativeURL = getRelativePath(targetURL, this._appLibFolder);
          await this._server2serverMove(
            constructFileURL(sourceRelativeURL, false, true, "", "webdav://"),
            constructFileURL(targetRelativeURL, false, true, "", "webdav://")
          );
        } catch (error) {
          throw new Error("Cannot move file on webdav.");
        }
      } else {
        throw error
      }
    }
  }
}
