import { chunkRun } from "@/base/chunk";
import {
  isMetadataCompleted,
  isPreprint,
  mergeMetadata,
} from "@/base/metadata";
import { Process as processId } from "@/base/process-id";
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
import { convertKeyboardEvent, formatShortcut } from "@/base/shortcut.ts";

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

export {
  chunkRun,
  convertKeyboardEvent,
  formatShortcut,
  metadataUtils,
  processId,
  stringUtils,
  urlUtils,
};
