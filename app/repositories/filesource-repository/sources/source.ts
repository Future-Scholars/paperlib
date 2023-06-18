import { PaperEntity } from "@/models/paper-entity";

export interface FileSourceRequestType {
  queryUrl: string;
  headers: Record<string, string>;
}

export abstract class FileSource {
  static async download(
    paperEntityDraft: PaperEntity
  ): Promise<PaperEntity | null> {
    if (!this.checkEnable(paperEntityDraft)) {
      return null;
    }

    const { queryUrl, headers } = this.preProcess(paperEntityDraft);

    const downloadUrl = await this.queryProcess(
      queryUrl,
      headers,
      paperEntityDraft
    );
    if (downloadUrl) {
      const downloadedUrl = await window.networkTool.downloadPDFs([
        downloadUrl,
      ]);

      if (downloadedUrl.length > 0) {
        paperEntityDraft.mainURL = downloadedUrl[0];
        return paperEntityDraft;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  static preProcess(paperEntityDraft: PaperEntity): FileSourceRequestType {
    throw new Error("Method not implemented.");
  }

  static queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    paperEntityDraft: PaperEntity | null
  ): Promise<string> {
    throw new Error("Method not implemented.");
  }

  static checkEnable(paperEntityDraft: PaperEntity) {
    return true;
  }
}
