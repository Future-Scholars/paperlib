import fs from 'fs';
import path from 'path';

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
  if (getProtocol(url) === "http" || getProtocol(url) === "https") {
    return "WEB";
  }
  const components = url.split(".");
  if (components.length === 1) {
    return "N/A";
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

export { getProtocol as a, constructFileURL as c, eraseProtocol as e, getFileType as g, hasProtocol as h, isLocalPath as i, listAllFiles as l };
