import { SpawnOptions, spawn } from "child_process";
import { shell } from "electron";
import { existsSync } from "fs";
import os from "os";
import path from "path";

import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  eraseProtocol,
  getFileType,
  getProtocol,
  hasProtocol,
  listAllFiles,
} from "@/base/url";
import { ILogService, LogService } from "@/common/services/log-service";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { PaperEntity } from "@/models/paper-entity";
import { HookService, IHookService } from "@/renderer/services/hook-service";
import { IFileBackend } from "@/repositories/file-repository/backend";
import { LocalFileBackend } from "@/repositories/file-repository/local-backend";
import { WebDavFileBackend } from "@/repositories/file-repository/webdav-backend";

export interface IFileServiceState {
  backend: string;
  available: boolean;
}

export const IFileService = createDecorator("fileService");

export class FileService extends Eventable<IFileServiceState> {
  private _backend?: IFileBackend;

  constructor(
    @IHookService private readonly _hookService: HookService,
    @ILogService private readonly _logService: LogService,
    @IPreferenceService private readonly _preferenceService: PreferenceService
  ) {
    super("fileService", {
      backend: "",
      available: false,
    });
  }

  /**
   * Initialize the file backend.
   */
  @errorcatching("Failed to initialize the file backend.", true, "FileService")
  async initialize() {
    this._backend = await this._initBackend();
  }

  private async _initBackend(): Promise<IFileBackend> {
    if (this._preferenceService.get("syncFileStorage") === "local") {
      this.fire({ backend: "local", available: true });
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
          (await this._preferenceService.getPassword("webdav")) as string
        );

        const available = webdavBackend.check();
        this.fire({ backend: "webdav", available });
        return webdavBackend;
      } catch (e) {
        this._logService.error(
          "Failed to init webdav backend",
          e as Error,
          true,
          "FileService"
        );

        this.fire({ backend: "local", available: true });

        return new LocalFileBackend(
          this._preferenceService.get("appLibFolder") as string,
          this._preferenceService.get("sourceFileOperation") as string
        );
      }
    } else {
      throw new Error("Unknown file storage backend");
    }
  }

  /**
   * Start watching file changes. (Only for WebDAV file backend)
   */
  @errorcatching("Failed to watch file changes.", true, "FileService")
  async startWatch() {
    await this._backend?.startWatch();
  }

  /**
   * Stop watching file changes. (Only for WebDAV file backend)
   */
  @errorcatching("Failed to stop watching file changes.", true, "FileService")
  async stopWatch() {
    await this._backend?.stopWatch();
  }

  /**
   * Check if the file backend is available.
   */
  @errorcatching("Failed to check the file backend.", true, "FileService")
  async check() {
    return await this._backend?.check();
  }

  /**
   * Move files of a paper entity to the library folder
   * @param paperEntity - Paper entity to move
   * @param fourceDelete - Force to delete the source file
   * @param forceNotLink - Force to do not use link
   * @returns
   */
  async move(
    paperEntity: PaperEntity,
    fourceDelete = false,
    forceNotLink = false
  ): Promise<PaperEntity> {
    if (!this._backend) {
      this._backend = await this._initBackend();
    }

    try {
      if (!paperEntity.mainURL) {
        return paperEntity;
      }

      let title =
        paperEntity.title.replace(/[^\p{L}\s\d]/gu, "").replace(/\s/g, "_") ||
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
    } catch (e) {
      this._logService.error(
        "Failed to move files of a paper entity",
        e as Error,
        true,
        "FileService"
      );
      return paperEntity;
    }
  }

  /**
   * Move a file
   * @param sourceURL - Source file URL
   * @param targetURL - Target file URL
   * @param fourceDelete - Force to delete the source file
   * @param forceNotLink - Force to do not use link
   * @returns
   */
  @errorcatching("Failed to move a file.", true, "FileService", "")
  async moveFile(
    sourceURL: string,
    targetURL: string,
    fourceDelete = false,
    forceNotLink = false
  ): Promise<string> {
    if (!this._backend) {
      this._backend = await this._initBackend();
    }

    return await this._backend.moveFile(
      sourceURL,
      targetURL,
      fourceDelete,
      forceNotLink
    );
  }

  /**
   * Remove files of a paper entity
   * @param paperEntity - Paper entity to remove
   */
  @errorcatching(
    "Failed to remove files of a paper entity.",
    true,
    "FileService"
  )
  async remove(paperEntity: PaperEntity): Promise<void> {
    if (!this._backend) {
      this._backend = await this._initBackend();
    }

    const files = [paperEntity.mainURL, ...paperEntity.supURLs];

    const results = await Promise.allSettled(
      files.map((file) => this._backend?.removeFile(file))
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
   * Remove a file
   * @param url - Url of the file to remove
   */
  @errorcatching("Failed to remove a file.", true, "FileService")
  async removeFile(url: string): Promise<void> {
    if (!this._backend) {
      this._backend = await this._initBackend();
    }

    return await this._backend.removeFile(url);
  }

  /**
   * List all files in a folder
   * @param folderURL - Url of the folder
   * @returns List of file names
   */
  @errorcatching("Failed to list all files.", true, "FileService", [])
  async listAllFiles(folderURL: string): Promise<string[]> {
    if (!this._backend) {
      this._backend = await this._initBackend();
    }

    return listAllFiles(folderURL);
  }

  /**
   * Locate the paper files, such as the PDF, of paper entities.
   * @param paperEntities - The paper entities.
   * @returns The paper entities with the located file URLs.
   */
  async locateFileOnWeb(paperEntities: PaperEntity[]) {
    if (!this._backend) {
      this._backend = await this._initBackend();
    }

    try {
      this._logService.info(
        `Locating files for ${paperEntities.length} paper(s)...`,
        "",
        true,
        "FileService"
      );

      let updatedPaperEntityDrafts = paperEntities.map((paperEntity) => {
        paperEntity.mainURL = "";
        return paperEntity;
      });
      if (this._hookService.hasHook("locateFile")) {
        [updatedPaperEntityDrafts] = await this._hookService.modifyHookPoint(
          "locateFile",
          60000,
          updatedPaperEntityDrafts
        );
      }

      return updatedPaperEntityDrafts;
    } catch (e) {
      this._logService.error(
        "Failed to locate files",
        e as Error,
        true,
        "FileService"
      );
      return paperEntities;
    }
  }

  /**
   * Return the real and accessable path of the URL.
   * If the URL is a local file, return the path of the file.
   * If the URL is a remote file and `download` is `true`, download the file and return the path of the downloaded file.
   * If the URL is a web URL, return the URL.
   * @param url
   * @param download
   * @returns The real and accessable path of the URL.
   */
  @errorcatching("Failed to access the URL.", true, "FileService", "")
  async access(url: string, download: boolean): Promise<string> {
    if (!this._backend) {
      this._backend = await this._initBackend();
    }

    return await this._backend.access(url, download);
  }

  /**
   * Open the URL.
   * @param url - URL to open
   */
  @errorcatching("Failed to open the URL.", true, "FileService")
  async open(url: string) {
    if (!this._backend) {
      this._backend = await this._initBackend();
    }

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
   * Show the URL in Finder / Explorer.
   * @param url - URL to show
   */
  @errorcatching("Failed to show the URL in Finder.", true, "FileService")
  async showInFinder(url: string) {
    const accessedURL = eraseProtocol(await this.access(url, true));
    PLMainAPI.fileSystemService.showInFinder(accessedURL);
  }

  /**
   * Preview the URL only for MacOS.
   * Other platforms should install an extension.
   * @param url - URL to preview
   */
  @errorcatching("Failed to preview the URL.", true, "FileService")
  async preview(url: string) {
    const fileURL = await this.access(url, true);
    PLMainAPI.fileSystemService.preview(fileURL);
  }
}
