import fs from "fs";
import path from "path";

/**
 * Get the protocol of the URL.
 * @param url
 * @returns
 */
export function getProtocol(url: string): string {
  const components = url.split("://");
  if (components.length === 1) {
    return "";
  } else {
    return components[0];
  }
}

/**
 * Check if the URL has a protocol.
 * @param url
 * @returns
 */
export function hasProtocol(url: string): boolean {
  return url.includes("://");
}

/**
 * Erase the protocol of the URL.
 * @param url
 * @returns
 */
export function eraseProtocol(url: string): string {
  const components = url.split("://");
  if (components.length === 1) {
    return url;
  } else {
    return components[1];
  }
}

/**
 * Get the file type of the URL.
 * @param url
 * @returns
 * @description
 */
export function getFileType(url: string): string {
  const components = url.split(".");
  if (components.length === 1) {
    return "";
  } else {
    return components[components.length - 1];
  }
}

export function constructFileURL(
  url: string,
  joined: boolean,
  withProtocol = true,
  root = "",
  protocol = "file://"
): string {
  let outURL: string;

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
      return outURL;
    } else {
      return protocol + outURL;
    }
  } else {
    return outURL.replace(protocol, "");
  }
}

export function listAllFiles(
  folderURL: string,
  arrayOfFiles: string[] | null = null
): string[] {
  let files = fs.readdirSync(folderURL);

  arrayOfFiles = (arrayOfFiles || []) as string[];

  files.forEach(function (file) {
    if (fs.statSync(folderURL + "/" + file).isDirectory()) {
      arrayOfFiles = listAllFiles(folderURL + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles = arrayOfFiles as string[];
      arrayOfFiles.push(path.join(folderURL, "/", file));
    }
  });

  return arrayOfFiles;
}

export function isLocalPath(string: string) {
  const normalizedPath = path.normalize(string);
  const isAbsolutePath = path.isAbsolute(normalizedPath);

  if (isAbsolutePath) {
    return true;
  }

  return /^\.{0,2}\//.test(string);
}
