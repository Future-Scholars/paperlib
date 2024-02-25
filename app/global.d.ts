import { APIShape, ExtAPIShape, MainAPIShape } from "./api/api";

declare global {
  interface Realm {
    safeWrite: <T>(callback: () => T) => T;
    paperEntityListened: boolean;
    tagsListened: boolean;
    foldersListened: boolean;
    smartfilterListened: boolean;
    querySentenceListened: { [key: string]: boolean };
    feedEntityListened: boolean;
    feedListened: boolean;
  }

  var PLAPI: APIShape;
  var PLMainAPI: MainAPIShape;
  var PLExtAPI: ExtAPIShape;
}
