import { existsSync, promises as fsPromise } from "fs";
import path from "path";

import { PaperEntity } from "@/models/paper-entity";
import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";
import { constructFileURL } from "@/utils/path";

import { FileBackend } from "./backend";

export class LocalFileBackend implements FileBackend {
  stateStore: MainRendererStateStore;
  preference: Preference;

  constructor(stateStore: MainRendererStateStore, preference: Preference) {
    this.stateStore = stateStore;
    this.preference = preference;

    void this.check();
  }

  async check() {
    this.stateStore.viewState.syncFileStorageAvaliable = false;
    return Promise.resolve(true);
  }

  async access(url: string, download = false): Promise<string> {
    const fileURL = constructFileURL(
      url,
      true,
      true,
      this.preference.get("appLibFolder") as string,
      "file://"
    );
    if (existsSync(fileURL.replace("file://", ""))) {
      const pathStat = await fsPromise.lstat(fileURL.replace("file://", ""));
      if (pathStat.isFile()) {
        return Promise.resolve(fileURL);
      } else {
        return Promise.resolve("");
      }
    } else {
      return Promise.resolve("");
    }
  }

  async _move(
    sourceURL: string,
    targetURL: string,
    forceDelete: boolean = false
  ): Promise<boolean> {
    const _sourceURL = sourceURL.replace("file://", "");
    const _targetURL = targetURL.replace("file://", "");
    if (existsSync(_sourceURL)) {
      const stat = await fsPromise.lstat(_sourceURL);
      if (stat.isDirectory()) {
        return false;
      }
    } else {
      return false;
    }
    try {
      await fsPromise.copyFile(_sourceURL, _targetURL);
      if (
        ((this.preference.get("deleteSourceFile") as boolean) || forceDelete) &&
        _sourceURL.toLowerCase() !== _targetURL.toLowerCase()
      ) {
        await fsPromise.unlink(sourceURL);
      }
      return true;
    } catch (error) {
      this.stateStore.logState.alertLog = `Could not copy file: ${
        error as string
      }`;
      return false;
    }
  }

  async move(
    paperEntity: PaperEntity,
    forceDelete: boolean = false
  ): Promise<PaperEntity | null> {
    let title =
      paperEntity.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s/g, "_") ||
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
    const sourceMainURL = constructFileURL(
      paperEntity.mainURL,
      true,
      false,
      this.preference.get("appLibFolder") as string
    );
    const targetMainURL = constructFileURL(
      targetFileName + "_main" + path.extname(sourceMainURL),
      true,
      false,
      this.preference.get("appLibFolder") as string
    );

    const mainSuccess = await this._move(
      sourceMainURL,
      targetMainURL,
      forceDelete
    );
    if (mainSuccess) {
      paperEntity.mainURL = path.basename(targetMainURL);
    } else {
      // If main file move fails, return null.
      return null;
    }

    // 2. Move supplementary files.
    const sourceSupURLs = paperEntity.supURLs.map((url) =>
      constructFileURL(
        url,
        true,
        false,
        this.preference.get("appLibFolder") as string
      )
    );

    const SupMovePromise = async (
      sourceSupURL: string,
      targetSupURL: string
    ) => {
      const supSuccess = await this._move(
        sourceSupURL,
        targetSupURL,
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
        true,
        false,
        this.preference.get("appLibFolder") as string
      );
      const supMovePromise = SupMovePromise(sourceSupURL, targetSupURL);
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
      const _sourceURL = sourceURL.replace("file://", "");
      const stat = await fsPromise.lstat(_sourceURL);
      if (stat.isDirectory()) {
        return false;
      }
      await fsPromise.unlink(_sourceURL);
      return true;
    } catch (error) {
      this.stateStore.logState.alertLog = `Could not remove file: ${
        error as string
      }`;
      return false;
    }
  }

  async remove(paperEntity: PaperEntity): Promise<boolean> {
    const sourceUrls = [];
    for (const url of paperEntity.supURLs) {
      sourceUrls.push(
        constructFileURL(
          url,
          true,
          false,
          this.preference.get("appLibFolder") as string
        )
      );
    }
    sourceUrls.push(
      constructFileURL(
        paperEntity.mainURL,
        true,
        false,
        this.preference.get("appLibFolder") as string
      )
    );

    const successes = await Promise.all(
      sourceUrls.map((url) => this._remove(url))
    );
    const success = successes.every((success) => success);
    return success;
  }

  async removeFile(url: string): Promise<boolean> {
    try {
      const fileURL = constructFileURL(
        url,
        true,
        false,
        this.preference.get("appLibFolder") as string
      );
      if (existsSync(fileURL)) {
        return await this._remove(fileURL);
      }
      return true;
    } catch (error) {
      this.stateStore.logState.alertLog = `Could not remove file: ${
        error as string
      }`;
      return false;
    }
  }
}
