import { a as getProtocol, h as hasProtocol, e as eraseProtocol, g as getFileType, c as constructFileURL, l as listAllFiles, i as isLocalPath } from './url-PcxgGzYe.mjs';

const chunkRun = async (argsList, process, errorProcess, chunkSize = 10) => {
  let results = [];
  const errors = [];
  let argsArray;
  if (!argsList.hasOwnProperty("length") || !argsList.hasOwnProperty("slice")) {
    argsArray = Array.from(argsList);
  } else {
    argsArray = argsList;
  }
  for (let i = 0; i < argsArray.length; i += chunkSize) {
    const chunkArgs = argsArray.slice(i, i + chunkSize);
    const chunkResult = await Promise.allSettled(
      chunkArgs.map(async (arg) => {
        if (process.prototype === void 0) {
          return await process(arg);
        } else {
          return await process.apply(void 0, arg);
        }
      })
    );
    for (const [j, result] of chunkResult.entries()) {
      if (result.status === "rejected") {
        errors.push(result.reason);
        if (errorProcess) {
          if (errorProcess.prototype === void 0) {
            results.push(await errorProcess(chunkArgs[j]));
          } else {
            results.push(
              await errorProcess.apply(void 0, chunkArgs[j])
            );
          }
        } else {
          results.push(null);
        }
      } else {
        results.push(result.value);
      }
    }
  }
  return {
    results,
    errors
  };
};

function isMetadataCompleted(paperEntityDraft) {
  const completed = paperEntityDraft.title != "" && paperEntityDraft.title.toLowerCase() != "undefined" && paperEntityDraft.title.toLowerCase() != "untitled" && paperEntityDraft.authors != "" && paperEntityDraft.publication != "" && paperEntityDraft.pubTime != "" && !isPreprint(paperEntityDraft);
  return completed;
}
function isPreprint(paperEntityDraft) {
  const lowercasedPublication = paperEntityDraft.publication.toLowerCase();
  return lowercasedPublication.includes("arxiv") || lowercasedPublication.includes("biorxiv") || lowercasedPublication.includes("medrxiv") || lowercasedPublication.includes("chemrxiv") || lowercasedPublication.includes("openreview") || lowercasedPublication.includes("corr") || lowercasedPublication === "" || lowercasedPublication === "undefined";
}
function mergeMetadata(originPaperEntityDraft, paperEntityDraft, scrapedpaperEntity, mergePriorityLevel, scraperIndex) {
  if (isPreprint(paperEntityDraft) || !isPreprint(scrapedpaperEntity) && !isPreprint(paperEntityDraft)) {
    for (const key of Object.keys(scrapedpaperEntity)) {
      if (scrapedpaperEntity[key] && scrapedpaperEntity[key] !== "" && mergePriorityLevel[key] > scraperIndex && originPaperEntityDraft[key] !== scrapedpaperEntity[key]) {
        paperEntityDraft[key] = scrapedpaperEntity[key];
        mergePriorityLevel[key] = scraperIndex;
      }
    }
  }
  return { paperEntityDraft, mergePriorityLevel };
}

var Process = /* @__PURE__ */ ((Process2) => {
  Process2["main"] = "mainProcess";
  Process2["extension"] = "extensionProcess";
  Process2["renderer"] = "rendererProcess";
  Process2["quickpaste"] = "quickpasteProcess";
  Process2["service"] = "serviceProcess";
  return Process2;
})(Process || {});

const formatString = ({
  str,
  removeNewline = false,
  removeWhite = false,
  removeSymbol = false,
  removeStr = null,
  lowercased = false,
  trimWhite = false,
  whiteSymbol = false
}) => {
  if (!str) {
    return "";
  }
  let formatted = str;
  if (formatted) {
    if (removeStr) {
      formatted = formatted.replaceAll(removeStr, "");
    }
    if (removeNewline) {
      formatted = formatted.replace(/(\r\n|\n|\r)/gm, "");
    }
    if (trimWhite) {
      formatted = formatted.trim();
    }
    if (removeWhite) {
      formatted = formatted.replace(/\s/g, "");
    }
    if (removeSymbol) {
      formatted = formatted.replace(/[^\p{L}|\s]/gu, "");
    }
    if (lowercased) {
      formatted = formatted.toLowerCase();
    }
    if (whiteSymbol) {
      formatted = formatted.replace(/[^\p{L}]/gu, " ");
    }
    return formatted;
  } else {
    return "";
  }
};

const isMac = (() => {
  if (globalThis["process"] && process.platform) {
    return process.platform === "darwin";
  } else if (globalThis["window"] && window && window["electron"]) {
    return window["electron"].process.platform === "darwin";
  } else {
    return false;
  }
})();
const formatShortcut = (event) => {
  let shortcutKeys = [];
  if (event.ctrlKey) {
    shortcutKeys.push("Control");
  }
  if (event.metaKey) {
    if (isMac) {
      shortcutKeys.push("Command");
    } else {
      shortcutKeys.push("Meta");
    }
  }
  if (event.altKey) {
    shortcutKeys.push("Alt");
  }
  if (event.shiftKey) {
    shortcutKeys.push("Shift");
  }
  let key = event.key.trim();
  if (key !== "Meta") {
    if (event.code === "Space") {
      key = event.code.trim();
    }
    if (key.length === 1) {
      key = key.toUpperCase();
    }
    if (!shortcutKeys.includes(key)) {
      shortcutKeys.push(key);
    }
  }
  return shortcutKeys;
};
const convertKeyboardEvent = (e) => {
  const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
  return {
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    altKey: e.altKey,
    shiftKey: e.shiftKey,
    key: e.key,
    code: e.code,
    preventDefault: () => {
      e.preventDefault();
    },
    stopPropagation: () => {
      e.stopPropagation();
    },
    isInput,
    target: e.target
  };
};

const stringUtils = {
  formatString
};
const urlUtils = {
  getProtocol,
  hasProtocol,
  eraseProtocol,
  getFileType,
  constructFileURL,
  listAllFiles,
  isLocalPath
};
const metadataUtils = {
  isMetadataCompleted,
  isPreprint,
  mergeMetadata
};

export { chunkRun, convertKeyboardEvent, formatShortcut, metadataUtils, Process as processId, stringUtils, urlUtils };
