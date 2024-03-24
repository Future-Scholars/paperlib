import Watcher from "watcher";

export interface IFileBackend {
  watcher?: Watcher;

  check(): Promise<boolean>;
  access(url: string, download: boolean): Promise<string>;
  startWatch(): Promise<void>;
  stopWatch(): Promise<void>;
  moveFile(sourceURL: string, targetURL: string): Promise<string>;
  removeFile(sourceURL: string): Promise<void>;
}
