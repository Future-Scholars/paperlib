import { chunkRun } from "@/base/chunk";
import {
  isMetadataCompleted,
  isPreprint,
  mergeMetadata,
} from "@/base/metadata";
import { formatString } from "@/base/string";
import {
  constructFileURL,
  eraseProtocol,
  getFileType,
  getProtocol,
  hasProtocol,
  isLocalPath,
  listAllFiles,
} from "@/base/url";

const stringUtils = {
  formatString,
};

const urlUtils = {
  getProtocol,
  hasProtocol,
  eraseProtocol,
  getFileType,
  constructFileURL,
  listAllFiles,
  isLocalPath,
};

const metadataUtils = {
  isMetadataCompleted,
  isPreprint,
  mergeMetadata,
};

export { chunkRun, metadataUtils, stringUtils, urlUtils };
