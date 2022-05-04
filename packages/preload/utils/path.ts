import path from "path";
import os from "os";

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

  if (os.platform().startsWith("win")) {
    return outURL;
  } else {
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
};
