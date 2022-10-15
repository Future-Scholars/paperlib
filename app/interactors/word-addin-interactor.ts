import { WebSocket, WebSocketServer } from "ws";
import { createServer } from 'https'
import got from "got";
import path from "path";
import os from "os"
import { writeFileSync, promises as fsPromise } from "fs";

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
    }

    this.ws?.send(JSON.stringify({ response: "no-avaliable-importer" }));
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

  async installWordAddin() {
    const url = "https://paperlib.app/distribution/word_addin/manifest.xml";
    const response = await got(url)

    const manifest = response.body
    const manifestPath = path.join(os.tmpdir(), "manifest.xml");
    writeFileSync(manifestPath, manifest);

    if (os.platform() === 'darwin') {
      fsPromise.copyFile(manifestPath, path.join(os.homedir(), "Library/Containers/com.microsoft.Word/Data/Documents/wef/paperlib.manifest.xml"));
    } else if (os.platform() === 'win32') {
      console.log("Not support platform")
    } else {
      console.log("Not support platform")
    }
  }
}
