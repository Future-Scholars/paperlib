import { WebSocket, WebSocketServer } from "ws";
import { createServer } from 'https'
import path from "path";
import os from "os"
import { promises as fsPromise, existsSync } from "fs";
import sudo from "sudo-prompt";

import { Preference } from "@/preference/preference";
import { MainRendererStateStore } from "@/state/renderer/appstate";

import { EntityInteractor } from "./entity-interactor";
import { certs } from "@/utils/crypto/word-comm-cert";

interface SearchParams {
  query: string;
}


export class WordAddinInteractor {
  stateStore: MainRendererStateStore;
  preference: Preference;

  entityInteractor: EntityInteractor;

  socketServer: WebSocketServer;
  ws?: WebSocket;

  constructor(
    stateStore: MainRendererStateStore,
    preference: Preference,
    entityInteractor: EntityInteractor
  ) {
    this.stateStore = stateStore;
    this.preference = preference;

    this.entityInteractor = entityInteractor;

    const server = createServer(certs);
    this.socketServer = new WebSocketServer({ server });
    this.socketServer.on("connection", (ws) => {
      this.ws = ws;
      ws.on("message", this.handler.bind(this));
    });
    server.listen(21993);
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
        await this.loadCSLNames()
        break;
      case "load-csl":
        await this.loadCSL(message.params)
        break;
    }
  }

  async search(params: SearchParams) {
    const result = await this.entityInteractor.loadPaperEntities(
      params.query,
      false,
      "",
      "",
      "addTime",
      "desc",
    )

    const responseResult = result.slice(0, 10)
    this.ws?.send(JSON.stringify({ type: "search", response: responseResult }));
  }

  async loadCSLNames() {
    const cslDir = this.preference.get("importedCSLStylesPath") as string
    const cslFiles = await fsPromise.readdir(cslDir)
    const csls = (await Promise.all(cslFiles.map(async (cslFile) => {
      if (cslFile.endsWith(".csl")) {
        return cslFile.replace('.csl', '')
      } else {
        return ""
      }
    }))).filter((csl) => csl !== "")

    this.ws?.send(JSON.stringify({ type: "csl-names", response: csls }));
  }

  async loadCSL(name: string) {
    const cslDir = this.preference.get("importedCSLStylesPath") as string
    const cslPath = path.join(cslDir, `${name}.csl`)
    if (existsSync(cslPath)) {
      const csl = await fsPromise.readFile(cslPath, "utf8")
      this.ws?.send(JSON.stringify({ type: "load-csl", response: csl }));
    } else {
      this.ws?.send(JSON.stringify({ type: "load-csl", response: "" }));
    }
  }

  async installWordAddin() {
    const manifestUrl = "https://paperlib.app/distribution/word_addin/manifest.xml";
    const manifestPath = path.join(os.tmpdir(), "manifest.xml");
    await window.networkTool.download(manifestUrl, manifestPath);

    if (os.platform() === 'darwin') {
      await fsPromise.mkdir(path.join(os.homedir(), "Library/Containers/com.microsoft.Word/Data/Documents/wef/"), { recursive: true })
      await fsPromise.copyFile(manifestPath, path.join(os.homedir(), "Library/Containers/com.microsoft.Word/Data/Documents/wef/paperlib.manifest.xml"));
    } else if (os.platform() === 'win32') {
      const helperUrl = "https://paperlib.app/distribution/word_addin/oaloader.exe";
      const helperPath = path.join(os.tmpdir(), "oaloader.exe");
      await window.networkTool.download(helperUrl, helperPath);

      sudo.exec(`${helperPath} add ${manifestPath}`, { name: "PaperLib" }, (error, stdout, stderr) => {
        if (error) {
          console.log(error);
        }
      });
    } else {
      console.log("Not support platform")
    }
  }
}
