import { SpawnOptions, spawn } from "child_process";
import { shell } from "electron";
import { existsSync } from "fs";
import os from "os";

import {
  FileRepository,
  IFileRepository,
} from "@/repositories/file-repository/file-repository";
import { ILogService, LogService } from "@/services/log-service";
import {
  IPreferenceService,
  PreferenceService,
} from "@/services/preference-service";

export class URLService {
  constructor(
    @IFileRepository private readonly fileRepository: FileRepository,
    @IPreferenceService private readonly preferenceService: PreferenceService,
    @ILogService private readonly logService: LogService
  ) {}

  /**
   * Get the protocol of the URL.
   * @param url
   * @returns
   */
  getProtocol(url: string): string {
    const components = url.split("://");
    if (components.length === 1) {
      return "";
    } else {
      return components[0];
    }
  }

  /**
   * Check if the URL has a protocol.
   * @param url
   * @returns
   */
  hasProtocol(url: string): boolean {
    return url.includes("://");
  }

  /**
   * Erase the protocol of the URL.
   * @param url
   * @returns
   */
  eraseProtocol(url: string): string {
    const components = url.split("://");
    if (components.length === 1) {
      return url;
    } else {
      return components[1];
    }
  }

  /**
   * Get the file type of the URL.
   * @param url
   * @returns
   * @description
   */
  getFileType(url: string): string {
    const components = url.split(".");
    if (components.length === 1) {
      return "";
    } else {
      return components[components.length - 1];
    }
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
    return await this.fileRepository.access(url, download);
  }

  /**
   * Open the URL.
   * @param url
   */
  async open(url: string) {
    if (!this.hasProtocol(url)) {
      this.logService.error(
        "URL should have a protocol",
        "",
        true,
        "FileService"
      );
      return;
    }

    if (this.getProtocol(url) === "http" || this.getProtocol(url) === "https") {
      shell.openExternal(url);
    } else {
      const accessableURL = this.eraseProtocol(await this.access(url, true));
      if (
        this.preferenceService.get("selectedPDFViewer") === "default" ||
        this.getFileType(accessableURL) !== "pdf"
      ) {
        shell.openPath(accessableURL);
      } else {
        const viewerPath = this.preferenceService.get(
          "selectedPDFViewerPath"
        ) as string;
        const exists = existsSync(viewerPath);
        if (!exists) {
          this.logService.error(
            "Cannot find the custom PDF viewer",
            this.preferenceService.get("selectedPDFViewer") as string,
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
}
