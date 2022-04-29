import path from 'path';
import { createClient, WebDAVClient } from 'webdav';
import keytar from 'keytar';

import { FileRepository } from './file-repository';

import { PaperEntityDraft } from '../../models/PaperEntityDraft';
import { promises as fsPromise, readFileSync, existsSync, mkdirSync } from 'fs';

import { Preference } from '../../utils/preference';
import { SharedState } from '../../interactors/app-state';
import { constructFileURL } from '../../utils/path';

export class WebDavFileRepository extends FileRepository {
  webdavClient: WebDAVClient | null;

  constructor(preference: Preference, sharedState: SharedState) {
    super(preference, sharedState);
    this.webdavClient = null;

    if (
      !existsSync(
        path.join(
          this.sharedState.dbState.defaultPath.value as string,
          'file_cache'
        )
      )
    ) {
      mkdirSync(
        path.join(
          this.sharedState.dbState.defaultPath.value as string,
          'file_cache'
        )
      );
    }

    void this.check();
  }

  async check() {
    if (this.webdavClient) {
      return true;
    }
    this.webdavClient = createClient(
      this.preference.get('webdavURL') as string,
      {
        username: this.preference.get('webdavUsername') as string,
        password: (await keytar.getPassword('paperlib', 'webdav')) as string,
      }
    );

    try {
      const content = await this.webdavClient.getDirectoryContents('/');
      this.sharedState.set('viewState.syncFileStorageAvaliable', true);
      return true;
    } catch (error) {
      console.log(error);
      this.sharedState.set(
        'viewState.alertInformation',
        'Could not connect to webdav, check your username, password and url.'
      );
      return false;
    }
  }

  async access({
    url,
    joined = false,
    withProtocol = true,
    root = '',
    protocol = 'file://',
    download = true,
  }: {
    url: string;
    joined?: boolean;
    withProtocol?: boolean;
    root?: string;
    protocol?: string;
    download?: boolean;
  }): Promise<string> {
    await this.check();
    const basename = path.basename(url);
    const localURL = path.join(
      this.sharedState.dbState.defaultPath.value as string,
      'file_cache',
      basename
    );
    // Check if file exists on local temp disk.
    const isExist = existsSync(localURL);

    if (!isExist) {
      if (download) {
        try {
          await this._server2localMove(
            constructFileURL(basename, false, true, '', 'webdav://'),
            localURL
          );
        } catch (error) {
          console.log(error);
          this.sharedState.set(
            'viewState.alertInformation',
            `Could not download file from webdav: ${error as string}`
          );
          return '';
        }
      } else {
        return '';
      }
    }

    return Promise.resolve(
      constructFileURL(localURL, joined, withProtocol, root, protocol)
    );
  }

  async _server2serverMove(
    sourceURL: string,
    targetURL: string
  ): Promise<boolean> {
    const _sourceURL = sourceURL.replace('webdav://', '/paperlib/');
    const _targetURL = targetURL.replace('webdav://', '/paperlib/');
    await this.webdavClient?.moveFile(_sourceURL, _targetURL);
    return true;
  }

  async _local2serverMove(
    sourceURL: string,
    targetURL: string
  ): Promise<boolean> {
    const _sourceURL = sourceURL.replace('file://', '');
    const _targetURL = targetURL.replace('webdav://', '/paperlib/');

    const buffer = readFileSync(_sourceURL);
    await this.webdavClient?.putFileContents(_targetURL, buffer, {
      overwrite: true,
    });

    return true;
  }

  async _server2localMove(
    sourceURL: string,
    targetURL: string
  ): Promise<boolean> {
    const _sourceURL = sourceURL.replace('webdav://', '/paperlib/');
    const _targetURL = targetURL.replace('file://', '/');

    const buffer: Buffer = (await this.webdavClient?.getFileContents(
      _sourceURL
    )) as Buffer;

    await fsPromise.appendFile(_targetURL, Buffer.from(buffer));

    return true;
  }

  async _move(sourceURL: string, targetURL: string): Promise<boolean> {
    try {
      let success;
      if (sourceURL.startsWith('file://')) {
        success = await this._local2serverMove(sourceURL, targetURL);
        if (this.preference.get('deleteSourceFile') as boolean) {
          await fsPromise.unlink(sourceURL);
        }
      } else if (sourceURL.startsWith('webdav://')) {
        success = await this._server2serverMove(sourceURL, targetURL);
        if (this.preference.get('deleteSourceFile') as boolean) {
          await this.webdavClient?.deleteFile(
            sourceURL.replace('webdav://', '/paperlib/')
          );
        }
      } else {
        throw new Error('Invalid source URL:' + sourceURL);
      }
      return success;
    } catch (error) {
      this.sharedState.set(
        'viewState.alertInformation',
        `Could not upload to webdav: ${error as string}`
      );
      return false;
    }
  }

  async move(entity: PaperEntityDraft): Promise<PaperEntityDraft | null> {
    await this.check();
    const targetFileName =
      entity.title.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s/g, '_') +
      '_' +
      entity._id.toString();

    // 1. Move main file.
    let sourceMainURL;
    if (!entity.mainURL.startsWith('file://')) {
      sourceMainURL = constructFileURL(
        entity.mainURL,
        false,
        true,
        '',
        'webdav://'
      );
    } else {
      sourceMainURL = entity.mainURL;
    }
    const targetMainURL = constructFileURL(
      targetFileName + '_main' + path.extname(sourceMainURL),
      false,
      true,
      '',
      'webdav://'
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
      constructFileURL(url, false, true, '', 'webdav://')
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
        false,
        true,
        '',
        'webdav://'
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
      await this._removeFileCache(sourceURL);
      const _sourceURL = sourceURL.replace('webdav://', '/paperlib/');
      await this.webdavClient?.deleteFile(_sourceURL);
      return true;
    } catch (error) {
      this.sharedState.set(
        'viewState.alertInformation',
        `Could not remove file on webdav: ${error as string}`
      );
      return false;
    }
  }

  async _removeFileCache(url: string) {
    const basename = path.basename(url);
    const localURL = path.join(
      this.sharedState.dbState.defaultPath.value as string,
      'file_cache',
      basename
    );
    await fsPromise.unlink(localURL);
  }

  async remove(entity: PaperEntityDraft): Promise<boolean> {
    await this.check();
    const sourceUrls = [];
    for (const url of entity.supURLs) {
      sourceUrls.push(constructFileURL(url, false, true, '', 'webdav://'));
    }
    sourceUrls.push(
      constructFileURL(entity.mainURL, false, true, '', 'webdav://')
    );

    const successes = await Promise.all(
      sourceUrls.map((url) => this._remove(url))
    );
    const success = successes.every((success) => success);
    return success;
  }

  async removeFile(url: string) {
    await this.check();
    try {
      const fileURL = constructFileURL(url, false, true, '', 'webdav://');
      return await this._remove(fileURL);
      return true;
    } catch (error) {
      this.sharedState.set(
        'viewState.alertInformation',
        `Could not remove file: ${error as string}`
      );
      return false;
    }
  }
}
