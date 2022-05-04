import path from "path";
import { promises as fsPromise, existsSync } from "fs";

import { PaperEntityDraft } from "../../../models/PaperEntityDraft";

import { SharedState } from "../../../utils/appstate";
import { Preference } from "../../../utils/preference";
import { FileBackend } from "./backend";
import { constructFileURL } from "../../../utils/path";

export class LocalFileBackend implements FileBackend {
  sharedState: SharedState;
  preference: Preference;

  constructor(sharedState: SharedState, preference: Preference) {
    this.sharedState = sharedState;
    this.preference = preference;

    void this.check();
  }

  async check() {
    this.sharedState.set("viewState.syncFileStorageAvaliable", false);
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
      return Promise.resolve(fileURL);
    } else {
      return Promise.resolve("");
    }
  }

  async _move(sourceURL: string, targetURL: string): Promise<boolean> {
    const _sourceURL = sourceURL.replace("file://", "");
    const _targetURL = targetURL.replace("file://", "");

    try {
      await fsPromise.copyFile(_sourceURL, _targetURL);
      if (
        (this.preference.get("deleteSourceFile") as boolean) &&
        _sourceURL !== _targetURL
      ) {
        await fsPromise.unlink(sourceURL);
      }
      return true;
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Could not copy file: ${error as string}`
      );
      return false;
    }
  }

  async move(entity: PaperEntityDraft): Promise<PaperEntityDraft | null> {
    const targetFileName =
      entity.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s/g, "_") +
      "_" +
      entity._id.toString();

    // 1. Move main file.
    const sourceMainURL = constructFileURL(
      entity.mainURL,
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
    const mainSuccess = await this._move(sourceMainURL, targetMainURL);
    if (mainSuccess) {
      entity.mainURL = path.basename(targetMainURL);
    } else {
      // If main file move fails, return null.
      return null;
    }

    // 2. Move supplementary files.
    const sourceSupURLs = entity.supURLs.map((url) =>
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
      const supSuccess = await this._move(sourceSupURL, targetSupURL);
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

    entity.supURLs = targetSupURLs;

    return entity;
  }

  async _remove(sourceURL: string) {
    try {
      const _sourceURL = sourceURL.replace("file://", "");
      await fsPromise.unlink(_sourceURL);
      return true;
    } catch (error) {
      this.sharedState.set(
        "viewState.alertInformation",
        `Could not remove file: ${error as string}`
      );
      return false;
    }
  }

  async remove(entity: PaperEntityDraft): Promise<boolean> {
    const sourceUrls = [];
    for (const url of entity.supURLs) {
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
        entity.mainURL,
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
      this.sharedState.set(
        "viewState.alertInformation",
        `Could not remove file: ${error as string}`
      );
      return false;
    }
  }
}
