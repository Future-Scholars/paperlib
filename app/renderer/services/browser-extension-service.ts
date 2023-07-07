import * as WebSocket from "ws";

import { createDecorator } from "@/base/injection/injection";
import { IPaperService, PaperService } from "@/renderer/services/paper-service";
import {
  IScrapeService,
  ScrapeService,
} from "@/renderer/services/scrape-service";

export const IBrowserExtensionService = createDecorator(
  "browserExtensionService"
);

export class BrowserExtensionService {
  private _socketServer: WebSocket.WebSocketServer;
  private _ws?: WebSocket.WebSocket;

  constructor(
    @IScrapeService private readonly _scrapeService: ScrapeService,
    @IPaperService private readonly _paperService: PaperService
  ) {
    this._socketServer = new WebSocket.WebSocketServer({ port: 21992 });
    this._socketServer.on("connection", (ws) => {
      this._ws = ws;
      ws.on("message", this._create.bind(this));
    });
  }

  private async _create(webContent: string) {
    const payload = {
      type: "webcontent",
      value: JSON.parse(webContent),
    };

    const scrapedPaperEntities = await this._scrapeService.scrape(
      [JSON.parse(webContent)],
      []
    );
    if (scrapedPaperEntities.length === 0) {
      this._ws?.send(JSON.stringify({ response: "no-avaliable-importer" }));
    } else {
      await this._paperService.update(scrapedPaperEntities);
      this._ws?.send(JSON.stringify({ response: "successful" }));
    }
  }
}
