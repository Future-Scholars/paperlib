import chokidar from "chokidar";

export interface IFileBackend {
  watcher?: chokidar.FSWatcher;

  check(): Promise<boolean>;
  access(url: string, download: boolean): Promise<string>;
  startWatch(): Promise<void>;
  stopWatch(): Promise<void>;
  moveFile(
    sourceURL: string,
    targetURL: string,
    fourceDelete?: boolean,
    forceNotLink?: boolean
  ): Promise<string>;
  removeFile(sourceURL: string): Promise<void>;
}
