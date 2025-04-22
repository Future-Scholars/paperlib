import { existsSync, promises as fsPromise } from "fs";
import path from "path";

import { constructFileURL, eraseProtocol, getProtocol, getRelativePath } from "@/base/url";

import { IFileBackend } from "./backend";
import { get } from "lodash";

export class LocalFileBackend implements IFileBackend {
  protected readonly _appLibFolder: string;
  protected readonly _fileMoveOperation: string;

  constructor(appLibFolder: string, fileMoveOperation: string) {
    this._appLibFolder = appLibFolder;
    this._fileMoveOperation = fileMoveOperation;

    void this.check();
  }

  async check() {
    return Promise.resolve(true);
  }

  async access(url: string, download = false): Promise<string> {
    if (["http", "https"].includes(getProtocol(url))) {
      return Promise.resolve(url);
    }

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
    outerFileOperation: boolean = true
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

    let fileOperation = this._fileMoveOperation;
    if (!outerFileOperation) {
      fileOperation = "cut";
    }

    if (_sourceURL !== _targetURL) {
      if (fileOperation === "link") {
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
      } else if (fileOperation === "copy") {
        await fsPromise.copyFile(_sourceURL, _targetURL);
      } else if (fileOperation === "cut") {
        await fsPromise.rename(_sourceURL, _targetURL);
      }
    }
  }

  /**
   * Check base folder, if not exist, create it.
   * @param folderPath - Folder path
   */
  async checkBaseFolder(folderPath: string): Promise<void> {
    const _folderPath = eraseProtocol(folderPath);
    if (!existsSync(_folderPath)) {
      await fsPromise.mkdir(_folderPath, { recursive: true });
    }
  }

  /**
   * Move file from sourceURL to targetURL
   * @param sourceURL - Source URL, also can be a file name in the app library folder
   * @param targetURL - Target URL, also can be a file name in the app library folder
   * @returns Target file name in the app library folder
   */
  async moveFile(sourceURL: string, targetURL: string): Promise<string> {
    const outerFileOperation = path.isAbsolute(eraseProtocol(sourceURL));

    sourceURL = constructFileURL(sourceURL, true, false, this._appLibFolder);
    targetURL = constructFileURL(targetURL, true, false, this._appLibFolder);

    await this.checkBaseFolder(path.dirname(targetURL));
    await this.checkBaseFolder(path.dirname(sourceURL));

    await this._move(sourceURL, targetURL, outerFileOperation);

    return getRelativePath(targetURL, this._appLibFolder);
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

  /**
   * Remove file from sourceURL
   * @param sourceURL - Source URL, also can be a file name in the app library folder
   * @returns void
   */
  async removeFile(sourceURL: string): Promise<void> {
    sourceURL = constructFileURL(sourceURL, true, false, this._appLibFolder);
    if (existsSync(sourceURL)) {
      await this._remove(sourceURL);
    }

    // Remove empty directories until the app library folder
    const _sourceURL = eraseProtocol(sourceURL);
    let targetPath = path.dirname(_sourceURL);

    const tobeDeletedDirs: string[] = [];
    while (path.normalize(targetPath) !== path.normalize(this._appLibFolder)) {
      tobeDeletedDirs.push(targetPath);
      targetPath = path.dirname(targetPath);
    }

    const fileDepth =
      getRelativePath(_sourceURL, this._appLibFolder).split("/").length - 1;
    if (fileDepth !== tobeDeletedDirs.length) {
      console.log(
        "Error: fileDepth !== tobeDeletedDirs.length",
        fileDepth,
        tobeDeletedDirs.length
      );
      return;
    } else {
      for (const dir of tobeDeletedDirs) {
        try {
          await fsPromise.rmdir(dir);
        } catch (error) {}
      }
    }
  }
}
