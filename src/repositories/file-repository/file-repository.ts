import path from 'path';
import os from 'os';
import stream from 'stream';
import { promisify } from 'util';
import got from 'got';

import { PaperEntityDraft } from '../../models/PaperEntityDraft';
import { promises as fsPromise, createWriteStream, existsSync } from 'fs';

import { Preference } from '../../utils/preference';
import { SharedState } from '../../interactors/app-state';
import { constructFileURL } from '../../utils/path';

export class FileRepository {
  preference: Preference;
  sharedState: SharedState;

  constructor(preference: Preference, sharedState: SharedState) {
    this.preference = preference;
    this.sharedState = sharedState;

    void this.check();
  }

  async check() {
    this.sharedState.set('viewState.syncFileStorageAvaliable', false);
    return Promise.resolve(true);
  }

  async access({
    url,
    joined = true,
    withProtocol = true,
    root = this.preference.get('appLibFolder') as string,
    protocol = 'file://',
    download = false,
  }: {
    url: string;
    joined?: boolean;
    withProtocol?: boolean;
    root?: string;
    protocol?: string;
    download?: boolean;
  }): Promise<string> {
    const fileURL = constructFileURL(url, joined, withProtocol, root, protocol);
    return Promise.resolve(fileURL);
  }

  async _move(sourceURL: string, targetURL: string): Promise<boolean> {
    const _sourceURL = sourceURL.replace('file://', '');
    const _targetURL = targetURL.replace('file://', '');

    try {
    await fsPromise.copyFile(_sourceURL, _targetURL);
      if (this.preference.get('deleteSourceFile') as boolean && _sourceURL !== _targetURL) {
        await fsPromise.unlink(sourceURL);
      } 
      return true;
    } catch (error) {
      this.sharedState.set(
        'viewState.alertInformation',
        `Could not copy file: ${error as string}`
      );
      return false;
    }
  }

  async move(entity: PaperEntityDraft): Promise<PaperEntityDraft | null> {
    const targetFileName =
      entity.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s/g, '_') +
      '_' +
      entity._id.toString();

    // 1. Move main file.
    const sourceMainURL = constructFileURL(
      entity.mainURL,
      true,
      false,
      this.preference.get('appLibFolder') as string
    );
    const targetMainURL = constructFileURL(
      targetFileName + '_main' + path.extname(sourceMainURL),
      true,
      false,
      this.preference.get('appLibFolder') as string
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
        this.preference.get('appLibFolder') as string
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
        this.preference.get('appLibFolder') as string
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
      const _sourceURL = sourceURL.replace('file://', '');
      await fsPromise.unlink(_sourceURL);
      return true;
    } catch (error) {
      this.sharedState.set(
        'viewState.alertInformation',
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
          this.preference.get('appLibFolder') as string
        )
      );
    }
    sourceUrls.push(
      constructFileURL(
        entity.mainURL,
        true,
        false,
        this.preference.get('appLibFolder') as string
      )
    );

    const successes = await Promise.all(
      sourceUrls.map((url) => this._remove(url))
    );
    const success = successes.every((success) => success);
    return success;
  }

  async removeFile(url: string) {
    try {
      const fileURL = constructFileURL(
        url,
        true,
        false,
        this.preference.get('appLibFolder') as string
      );
      if (existsSync(fileURL)) {
        return await this._remove(fileURL);
      }
      return true;
    } catch (error) {
      this.sharedState.set(
        'viewState.alertInformation',
        `Could not remove file: ${error as string}`
      );
      return false;
    }
  }

  // ============================================================
  // Download file from web
  async download(urlList: string[]) {
    const _download = async (url: string): Promise<string> => {
      try {
        const filename = url.split('/').pop() as string;
        const targetUrl = path.join(os.homedir(), 'Downloads', filename);
        const pipeline = promisify(stream.pipeline);

        await pipeline(
          got.stream(url),
          createWriteStream(constructFileURL(targetUrl, false, false))
        );
        return targetUrl;
      } catch (error) {
        this.sharedState.set(
          'viewState.alertInformation',
          `Could not download file: ${error as string}`
        );
        return '';
      }
    };

    const downloadedUrls = (await Promise.all(urlList.map(_download))).filter(
      (url) => url !== ''
    );

    return downloadedUrls;
  }
}
