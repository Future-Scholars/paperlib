import path from "path";
import fs from "fs";

export const constructFileURL = (
  url: string,
  joined: boolean,
  withProtocol = true,
  root = "",
  protocol = "file://"
): string => {
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
};

export const getAllFiles = function (
  dirPath: string,
  arrayOfFiles: string[] | null = null
): string[] {
  let files = fs.readdirSync(dirPath);

  arrayOfFiles = (arrayOfFiles || []) as string[];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles = arrayOfFiles as string[];
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
};
