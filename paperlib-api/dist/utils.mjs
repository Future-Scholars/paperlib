import fs from 'fs';
import path from 'path';

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

function getProtocol(url) {
  const components = url.split("://");
  if (components.length === 1) {
    return "";
  } else {
    return components[0];
  }
}
function hasProtocol(url) {
  return url.includes("://");
}
function eraseProtocol(url) {
  const components = url.split("://");
  if (components.length === 1) {
    return url;
  } else {
    return components[1];
  }
}
function getFileType(url) {
  const components = url.split(".");
  if (components.length === 1) {
    return "";
  } else {
    return components[components.length - 1];
  }
}
function constructFileURL(url, joined, withProtocol = true, root = "", protocol = "file://") {
  let outURL;
  url = url.replace(protocol, "");
  if (path.isAbsolute(url)) {
    outURL = url;
  } else {
    if (joined) {
      if (root) {
        outURL = path.join(root, url);
      } else {
        throw new Error("Root is required when 'joined' is true");
      }
    } else {
      outURL = url;
    }
  }
  if (withProtocol) {
    if (outURL.startsWith(protocol)) {
      return outURL.replace(/\\/g, "/");
    } else {
      return (protocol + outURL).replace(/\\/g, "/");
    }
  } else {
    return outURL.replace(protocol, "").replace(/\\/g, "/");
  }
}
function listAllFiles(folderURL, arrayOfFiles = null) {
  if (!fs.existsSync(folderURL)) {
    return [];
  }
  let files = fs.readdirSync(folderURL);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(folderURL + "/" + file).isDirectory()) {
      arrayOfFiles = listAllFiles(folderURL + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles = arrayOfFiles;
      arrayOfFiles.push(path.join(folderURL, "/", file));
    }
  });
  return arrayOfFiles;
}
function isLocalPath(string) {
  const normalizedPath = path.normalize(string);
  const isAbsolutePath = path.isAbsolute(normalizedPath);
  if (isAbsolutePath) {
    return true;
  }
  return /^\.{0,2}\//.test(string);
}

const isMac = process.platform === "darwin";
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
