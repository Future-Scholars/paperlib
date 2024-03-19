import { existsSync, promises as fsPromise } from "fs";
import path from "path";

import { constructFileURL, eraseProtocol } from "@/base/url";

import { IFileBackend } from "./backend";

export class LocalFileBackend implements IFileBackend {
  private readonly _appLibFolder: string;
  private readonly _fileMoveOperation: string;

  constructor(appLibFolder: string, fileMoveOperation: string) {
    this._appLibFolder = appLibFolder;
    this._fileMoveOperation = fileMoveOperation;

    void this.check();
  }

  async check() {
    return Promise.resolve(true);
  }

  async access(url: string, download = false): Promise<string> {
    if (path.isAbsolute(eraseProtocol(url))) {
      return Promise.resolve(existsSync(eraseProtocol(url)) ? url : "");
    }

    url = constructFileURL(url, true, true, this._appLibFolder, "file://");

    if (existsSync(eraseProtocol(url))) {
      const pathStat = await fsPromise.lstat(eraseProtocol(url));
      if (pathStat.isFile()) {
        return Promise.resolve(url);
      } else if (pathStat.isSymbolicLink()) {
        const realPath = await fsPromise.realpath(eraseProtocol(url));
        return Promise.resolve(`file://${realPath}`);
      } else {
        return Promise.resolve("");
      }
    } else {
      return Promise.resolve("");
    }
  }

  async startWatch(): Promise<void> {
    return Promise.resolve();
  }

  async stopWatch(): Promise<void> {
    return Promise.resolve();
  }

  async _move(
    sourceURL: string,
    targetURL: string,
    forceDelete: boolean = false,
    forceNotLink: boolean = false
  ): Promise<void> {
    const _sourceURL = eraseProtocol(sourceURL);
    const _targetURL = eraseProtocol(targetURL);
    if (existsSync(_sourceURL)) {
      const stat = await fsPromise.lstat(_sourceURL);
      if (stat.isDirectory()) {
        throw new Error("Cannot move a directory");
      }
    } else {
      throw new Error("Cannot find the source file");
    }
    if (_sourceURL.toLowerCase() !== _targetURL.toLowerCase()) {
      if (this._fileMoveOperation === "link" && !forceNotLink) {
        try {
          const stat = await fsPromise.lstat(_targetURL);
          if (!existsSync(_targetURL) && stat.isSymbolicLink()) {
            await fsPromise.unlink(_targetURL);
          }
        } catch (error) {}

        const sourcePathStat = await fsPromise.lstat(_sourceURL);
        if (sourcePathStat.isFile()) {
          await fsPromise.symlink(_sourceURL, _targetURL);
        } else if (sourcePathStat.isSymbolicLink()) {
          const realPath = await fsPromise.realpath(_sourceURL);
          await fsPromise.symlink(realPath, _targetURL);
        }
      } else {
        await fsPromise.copyFile(_sourceURL, _targetURL);
      }
    }
    if (
      (this._fileMoveOperation === "cut" || forceDelete) &&
      _sourceURL.toLowerCase() !== _targetURL.toLowerCase()
    ) {
      await fsPromise.unlink(sourceURL);
    }
  }

  /**
   * Move file from sourceURL to targetURL
   * @param sourceURL - Source URL, also can be a file name in the app library folder
   * @param targetURL - Target URL, also can be a file name in the app library folder
   * @param forceDelete - Force delete source file
   * @param forceNotLink - Force not to use link
   * @returns Target file name in the app library folder
   */
  async moveFile(
    sourceURL: string,
    targetURL: string,
    forceDelete: boolean = false,
    forceNotLink: boolean = false
  ): Promise<string> {
    // 1. Move main file.
    sourceURL = constructFileURL(sourceURL, true, false, this._appLibFolder);
    targetURL = constructFileURL(targetURL, true, false, this._appLibFolder);

    const success = await this._move(
      sourceURL,
      targetURL,
      forceDelete,
      forceNotLink
    );

    return path.basename(targetURL);
  }

  async _remove(sourceURL: string) {
    try {
      const _sourceURL = eraseProtocol(sourceURL);
      const stat = await fsPromise.lstat(_sourceURL);
      if (stat.isDirectory()) {
        throw new Error("Cannot remove a directory");
      }
      await fsPromise.rm(_sourceURL);
      return true;
    } catch (error) {
      throw new Error("Cannot remove file");
    }
  }

  async removeFile(sourceURL: string): Promise<void> {
    sourceURL = constructFileURL(sourceURL, true, false, this._appLibFolder);
    if (existsSync(sourceURL)) {
      await this._remove(sourceURL);
    }
  }
}
