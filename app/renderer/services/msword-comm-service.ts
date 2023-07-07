import { existsSync, promises as fsPromise } from "fs";
import { createServer } from "https";
import os from "os";
import path from "path";
import sudo from "sudo-prompt";
import * as WebSocket from "ws";

import { certs } from "@/base/crypto/word-comm-cert";
import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { IPaperService, PaperService } from "@/renderer/services/paper-service";

interface ISearchParams {
  query: string;
}

export const IMSWordCommService = createDecorator("msWordCommService");

// TODO: make this better
export class MSWordCommService {
  socketServer: WebSocket.WebSocketServer;
  ws?: WebSocket.WebSocket;

  constructor(
    @IPaperService private _paperService: PaperService,
    @IPreferenceService private _preferenceService: PreferenceService
  ) {
    try {
      const server = createServer(certs);
      this.socketServer = new WebSocket.WebSocketServer({ server });
      this.socketServer.on("connection", (ws) => {
        this.ws = ws;
        ws.on("message", this.handler.bind(this));
      });
      server.listen(21993);
    } catch (e) {
      // For developers outside Future Scholar
      this.socketServer = new WebSocket.WebSocketServer({ port: 21993 });
    }
  }

  async handler(data: string) {
    const message = JSON.parse(data) as {
      type: string;
      params: any;
    };

    switch (message.type) {
      case "search":
        await this.search(message.params);
        break;
      case "csl-names":
        await this.loadCSLNames();
        break;
      case "load-csl":
        await this.loadCSL(message.params);
        break;
    }
  }

  async search(params: ISearchParams) {
    const result = await this._paperService.load(
      this._paperService.constructFilter({
        search: params.query,
        searchMode: "general",
      }),
      "addTime",
      "desc"
    );

    const responseResult = result.slice(0, 10);
    this.ws?.send(JSON.stringify({ type: "search", response: responseResult }));
  }

  async loadCSLNames() {
    const cslDir = this._preferenceService.get(
      "importedCSLStylesPath"
    ) as string;
    if (existsSync(cslDir)) {
      const cslFiles = await fsPromise.readdir(cslDir);
      const csls = (
        await Promise.all(
          cslFiles.map(async (cslFile) => {
            if (cslFile.endsWith(".csl")) {
              return cslFile.replace(".csl", "");
            } else {
              return "";
            }
          })
        )
      ).filter((csl) => csl !== "");

      this.ws?.send(JSON.stringify({ type: "csl-names", response: csls }));
    } else {
      this.ws?.send(JSON.stringify({ type: "csl-names", response: [] }));
    }
  }

  async loadCSL(name: string) {
    const cslDir = this._preferenceService.get(
      "importedCSLStylesPath"
    ) as string;
    const cslPath = path.join(cslDir, `${name}.csl`);
    if (existsSync(cslPath)) {
      const csl = await fsPromise.readFile(cslPath, "utf8");
      this.ws?.send(JSON.stringify({ type: "load-csl", response: csl }));
    } else {
      this.ws?.send(JSON.stringify({ type: "load-csl", response: "" }));
    }
  }

  async installWordAddin() {
    const manifestUrl =
      "https://paperlib.app/distribution/word_addin/manifest.xml";
    const manifestPath = path.join(os.tmpdir(), "manifest.xml");
    await networkTool.download(manifestUrl, manifestPath);

    if (os.platform() === "darwin") {
      await fsPromise.mkdir(
        path.join(
          os.homedir(),
          "Library/Containers/com.microsoft.Word/Data/Documents/wef/"
        ),
        { recursive: true }
      );
      await fsPromise.copyFile(
        manifestPath,
        path.join(
          os.homedir(),
          "Library/Containers/com.microsoft.Word/Data/Documents/wef/paperlib.manifest.xml"
        )
      );
    } else if (os.platform() === "win32") {
      const helperUrl =
        "https://paperlib.app/distribution/word_addin/oaloader.exe";
      const helperPath = path.join(os.tmpdir(), "oaloader.exe");
      await networkTool.download(helperUrl, helperPath);

      sudo.exec(
        `${helperPath} add ${manifestPath}`,
        { name: "PaperLib" },
        (error, stdout, stderr) => {
          if (error) {
            console.log(error);
          }
        }
      );
    } else {
      console.log("Not support platform");
    }
  }
}
