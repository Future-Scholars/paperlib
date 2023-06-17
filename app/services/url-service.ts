import { SpawnOptions, spawn } from "child_process";
import { shell } from "electron";
import { existsSync } from "fs";
import os from "os";

import {
  eraseProtocol,
  getFileType,
  getProtocol,
  hasProtocol,
} from "@/base/url";
import {
  FileRepository,
  IFileRepository,
} from "@/repositories/file-repository/file-repository";
import { ILogService, LogService } from "@/services/log-service";
import {
  IPreferenceService,
  PreferenceService,
} from "@/services/preference-service";

// TODO: no need of this
export class URLService {
  constructor(
    @IFileRepository private readonly fileRepository: FileRepository,
    @IPreferenceService private readonly preferenceService: PreferenceService,
    @ILogService private readonly logService: LogService
  ) {}

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
    if (!hasProtocol(url)) {
      this.logService.error(
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
        this.preferenceService.get("selectedPDFViewer") === "default" ||
        getFileType(accessableURL) !== "pdf"
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
