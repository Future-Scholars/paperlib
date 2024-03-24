import Debug from "debug";
import os from "os";
import * as path from "path";
import * as semVer from "semver";
import * as tar from "tar";
import urlJoin from "url-join";

import { NetworkTool } from "@/base/network";

import * as fs from "./fs-ops";
import { PackageInfo } from "./package-info";

const debug = Debug("live-plugin-manager.NpmRegistryClient");

export class NpmRegistryClient {
  defaultHeaders: {
    [name: string]: string;
  };
  constructor(
    private readonly npmUrl: string,
    config: NpmRegistryConfig,
    private readonly networkTool: NetworkTool
  ) {
    const staticHeaders = {
      // https://github.com/npm/registry/blob/master/docs/responses/package-metadata.md
      "accept-encoding": "gzip",
      accept:
        "application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*",
      "user-agent": config.userAgent || "live-plugin-manager",
    };

    this.defaultHeaders = { ...staticHeaders };
  }

  async get(
    name: string,
    versionOrTag: string | null = "latest"
  ): Promise<PackageInfo> {
    debug(`Getting npm info for ${name}:${versionOrTag}...`);

    if (typeof versionOrTag !== "string") {
      versionOrTag = "";
    }
    if (typeof name !== "string") {
      throw new Error("Invalid package name");
    }

    const data = await this.getNpmData(name);
    versionOrTag = versionOrTag.trim();

    // check if there is a tag (es. latest)
    const distTags = data["dist-tags"];
    let version = distTags && distTags[versionOrTag];

    if (!version) {
      version = semVer.clean(versionOrTag) || versionOrTag;
    }

    // find correct version
    let pInfo = data.versions[version];
    if (!pInfo) {
      // find compatible version
      for (const pVersion in data.versions) {
        if (!data.versions.hasOwnProperty(pVersion)) {
          continue;
        }
        const pVersionInfo = data.versions[pVersion];

        if (!semVer.satisfies(pVersionInfo.version, version)) {
          continue;
        }

        if (!pInfo || semVer.gt(pVersionInfo.version, pInfo.version)) {
          pInfo = pVersionInfo;
        }
      }
    }

    if (!pInfo) {
      throw new Error(`Version '${versionOrTag} not found`);
    }

    return {
      dist: pInfo.dist,
      name: pInfo.name,
      version: pInfo.version,
    };
  }

  async download(
    destinationDirectory: string,
    packageInfo: PackageInfo
  ): Promise<string> {
    if (!packageInfo.dist || !packageInfo.dist.tarball) {
      throw new Error("Invalid dist.tarball property");
    }

    const destinationFile = path.join(
      os.tmpdir(),
      Date.now().toString() + ".tgz"
    );

    // delete file if exists
    if (await fs.fileExists(destinationFile)) {
      await fs.remove(destinationFile);
    }

    await this.networkTool.download(packageInfo.dist.tarball, destinationFile);

    const tgzFile = destinationFile;

    const pluginDirectory = path.join(destinationDirectory, packageInfo.name);
    try {
      await fs.ensureDir(pluginDirectory);
      await tar.extract({
        file: tgzFile,
        cwd: pluginDirectory,
        strip: 1,
      });
    } finally {
      await fs.remove(tgzFile);
    }

    return pluginDirectory;
  }

  private async getNpmData(name: string): Promise<NpmData> {
    const regUrl = urlJoin(this.npmUrl, encodeNpmName(name));
    const headers = this.defaultHeaders;
    try {
      const result = JSON.parse(
        (await this.networkTool.get(regUrl, headers, 1, 5000, false, false))
          .body
      );

      if (!result) {
        throw new Error("Response is empty");
      }
      if (!result.versions || !result.name) {
        throw new Error("Invalid json format");
      }

      return result;
    } catch (err: any) {
      if (err.message) {
        err.message = `Failed to get package '${name}' ${err.message}`;
      }
      throw err;
    }
  }
}

// example: https://registry.npmjs.org/lodash/
// or https://registry.npmjs.org/@types%2Fnode (for scoped)
interface NpmData {
  name: string;
  "dist-tags"?: {
    // "latest": "1.0.0";
    [tag: string]: string;
  };
  versions: {
    [version: string]: {
      dist: {
        tarball: string;
      };
      name: string;
      version: string;
    };
  };
}

function encodeNpmName(name: string) {
  return name.replace("/", "%2F");
}

export interface NpmRegistryConfig {
  userAgent?: string;
}
