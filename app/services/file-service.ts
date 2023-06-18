import { SpawnOptions, spawn } from "child_process";
import { ipcRenderer, shell } from "electron";
import { existsSync } from "fs";
import os from "os";
import path from "path";

import { createDecorator } from "@/base/injection/injection";
import {
  eraseProtocol,
  getFileType,
  getProtocol,
  hasProtocol,
  listAllFiles,
} from "@/base/url";
import { PaperEntity } from "@/models/paper-entity";
import { IFileBackend } from "@/repositories/file-repository/backend";
import { LocalFileBackend } from "@/repositories/file-repository/local-backend";
import { WebDavFileBackend } from "@/repositories/file-repository/webdav-backend";
import { ILogService, LogService } from "@/services/log-service";
import {
  IPreferenceService,
  PreferenceService,
} from "@/services/preference-service";

export const IFileService = createDecorator("fileService");

export class FileService {
  private _backend: IFileBackend;

  constructor(
    @ILogService private readonly _logService: LogService,
    @IPreferenceService private readonly _preferenceService: PreferenceService
  ) {
    this._backend = this.initBackend();

    // TODO: triger reinit directly in preference view
  }

  initBackend(): IFileBackend {
    if (this._preferenceService.get("syncFileStorage") === "local") {
      return new LocalFileBackend(
        this._preferenceService.get("appLibFolder") as string,
        this._preferenceService.get("sourceFileOperation") as string
      );
    } else if (this._preferenceService.get("syncFileStorage") === "webdav") {
      try {
        const webdavBackend = new WebDavFileBackend(
          this._preferenceService.get("appLibFolder") as string,
          this._preferenceService.get("sourceFileOperation") as string,
          this._preferenceService.get("webdavURL") as string,
          this._preferenceService.get("webdavUsername") as string,
          this._preferenceService.get("webdavPassword") as string
        );
        return webdavBackend;
      } catch (e) {
        this._logService.error(
          "Failed to init webdav backend",
          e as Error,
          true,
          "FileService"
        );

        return new LocalFileBackend(
          this._preferenceService.get("appLibFolder") as string,
          this._preferenceService.get("sourceFileOperation") as string
        );
      }
    } else {
      throw new Error("Unknown file storage backend");
    }
  }

  async startWatch() {
    try {
      await this._backend.startWatch();
    } catch (e) {
      this._logService.error(
        "Failed to watch file changes",
        e as Error,
        true,
        "FileService"
      );
    }
  }

  async stopWatch() {
    try {
      await this._backend.stopWatch();
    } catch (e) {
      this._logService.error(
        "Failed to stop watching file changes",
        e as Error,
        true,
        "FileService"
      );
    }
  }

  async check() {
    try {
      return await this._backend.check();
    } catch (e) {
      this._logService.error(
        "File backend check failed",
        e as Error,
        true,
        "FileService"
      );
      return false;
    }
  }

  /**
   * Move files of a paper entity to the library folder
   * @param paperEntity - paper entity to move
   * @param fourceDelete - force delete the source file
   * @param forceNotLink - force not to link the source file
   * @returns
   */
  async move(
    paperEntity: PaperEntity,
    fourceDelete = false,
    forceNotLink = false
  ): Promise<PaperEntity> {
    console.log(paperEntity);
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

    let formatedFilename = "";
    if (this._preferenceService.get("renamingFormat") === "short") {
      formatedFilename = `${firstCharTitle}_${id}`;
    } else if (
      this._preferenceService.get("renamingFormat") === "authortitle"
    ) {
      if (author !== paperEntity.authors && author !== "anonymous") {
        author = `${author} et al`;
      }
      id = id.slice(-5, -1);
      formatedFilename = `${author} - ${title.slice(0, 20)}_${id}`;
    } else if (this._preferenceService.get("renamingFormat") === "custom") {
      formatedFilename = (
        this._preferenceService.get("customRenamingFormat") as string
      )
        .replaceAll("{title}", title.slice(0, 150))
        .replaceAll("{firstchartitle}", firstCharTitle)
        .replaceAll("{author}", author)
        .replaceAll("{year}", year)
        .replaceAll("{lastname}", lastName)
        .replaceAll("{firstname}", firstName)
        .replaceAll("{publication}", publication.slice(0, 100))
        .slice(0, 250);
      if (formatedFilename) {
        formatedFilename = `${formatedFilename}_${id}`;
      } else {
        formatedFilename = `${id}`;
      }
    } else {
      formatedFilename = `${title.slice(0, 200)}_${id}`;
    }

    const movedMainFilename = await this._backend.moveFile(
      paperEntity.mainURL,
      `${formatedFilename}_main${path.extname(paperEntity.mainURL)}`,
      fourceDelete,
      forceNotLink
    );
    paperEntity.mainURL = movedMainFilename;

    const movedSupURLs: string[] = [];
    for (let i = 0; i < paperEntity.supURLs.length; i++) {
      const movedSupFileName = await this._backend.moveFile(
        paperEntity.supURLs[i],
        `${formatedFilename}_sup${i}${path.extname(paperEntity.supURLs[i])}`,
        fourceDelete,
        forceNotLink
      );
      movedSupURLs.push(movedSupFileName);
    }
    paperEntity.supURLs = movedSupURLs;

    return paperEntity;
  }

  /**
   * Move a file
   * @param sourceURL - source file URL
   * @param targetURL - target file URL
   * @param fourceDelete - force delete the source file
   * @param forceNotLink - force not to link the source file
   * @returns
   */
  async moveFile(
    sourceURL: string,
    targetURL: string,
    fourceDelete = false,
    forceNotLink = false
  ): Promise<string> {
    return await this._backend.moveFile(
      sourceURL,
      targetURL,
      fourceDelete,
      forceNotLink
    );
  }

  /**
   * Remove files of a paper entity
   * @param paperEntity - paper entity to remove
   * @returns
   */
  async remove(paperEntity: PaperEntity): Promise<void> {
    const files = [paperEntity.mainURL, ...paperEntity.supURLs];

    const results = await Promise.allSettled(
      files.map((file) => this._backend.removeFile(file))
    );

    for (const result of results) {
      if (result.status === "rejected") {
        this._logService.error(
          "Failed to remove file",
          result.reason as Error,
          true,
          "FileService"
        );
      }
    }
  }

  /**
   * Remove files
   * @param url - url of the file to remove
   * @returns
   */
  async removeFile(url: string): Promise<void> {
    return await this._backend.removeFile(url);
  }

  /**
   * List all files in a folder
   * @param folderURL - url of the folder
   * @returns
   */
  async listAllFiles(folderURL: string): Promise<string[]> {
    return listAllFiles(folderURL);
  }

  /**
   * Locate the main file of a paper entity.
   * @param paperEntities - The paper entities.
   * @returns
   */
  async locateFileOnWeb(paperEntities: PaperEntity[]) {
    // TODO: implement
    // this._logService.info(
    //   `Locating files for ${paperEntities.length} paper(s)...`,
    //   "",
    //   true,
    //   "FileService"
    // );
    // let paperEntityDrafts = paperEntities.map((paperEntity) => {
    //   return new PaperEntity(false).initialize(paperEntity);
    // });
    // let updatedPaperEntities: PaperEntity[] = [];
    // try {
    //   const downloadPromise = async (paperEntityDraft: PaperEntity) => {
    //     return await this.downloaderRepository.download(paperEntityDraft);
    //   };
    //   paperEntityDrafts = await Promise.all(
    //     paperEntityDrafts.map((paperEntityDraft) =>
    //       downloadPromise(paperEntityDraft)
    //     )
    //   );
    //   updatedPaperEntities = await this.update(paperEntityDrafts, false, true);
    // } catch (error) {
    //   this._logService.error(
    //     "Download paper failed",
    //     error as Error,
    //     true,
    //     "FileService"
    //   );
    // }
    // return updatedPaperEntities;
  }

  /**
   * Return the real and accessable path of the URL.
   * @param url
   * @param download
   * @returns
   * @description
   * If the URL is a local file, return the path of the file.
   * If the URL is a remote file and `download` is `true`, download the file and return the path of the downloaded file.
   * If the URL is a web URL, return the URL.
   */
  async access(url: string, download: boolean): Promise<string> {
    return await this._backend.access(url, download);
  }

  /**
   * Open the URL.
   * @param url
   */
  async open(url: string) {
    if (!hasProtocol(url)) {
      this._logService.error(
        "URL should have a protocol",
        "",
        true,
        "FileService"
      );
      return;
    }

    if (getProtocol(url) === "http" || getProtocol(url) === "https") {
      shell.openExternal(url);
    } else {
      const accessableURL = eraseProtocol(await this.access(url, true));
      if (
        this._preferenceService.get("selectedPDFViewer") === "default" ||
        getFileType(accessableURL) !== "pdf"
      ) {
        shell.openPath(accessableURL);
      } else {
        const viewerPath = this._preferenceService.get(
          "selectedPDFViewerPath"
        ) as string;
        const exists = existsSync(viewerPath);
        if (!exists) {
          this._logService.error(
            "Cannot find the custom PDF viewer",
            this._preferenceService.get("selectedPDFViewer") as string,
            true,
            "FileService"
          );
        }
        const opts: SpawnOptions = {
          detached: true,
        };
        if (os.platform() === "win32") {
          spawn(viewerPath, [accessableURL], opts);
        } else {
          spawn("open", ["-a", viewerPath, accessableURL], opts);
        }
      }
    }
  }

  /**
   * Show the URL in Finder.
   * @param url - URL to show
   */
  async showInFinder(url: string) {
    const accessedURL = eraseProtocol(await this.access(url, true));
    shell.showItemInFolder(accessedURL);
  }

  /**
   * Preview the URL.
   * @param url - URL to preview
   */
  async preview(url: string) {
    const fileURL = await this.access(url, true);
    ipcRenderer.send("preview", fileURL);
  }
}
