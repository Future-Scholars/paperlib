import { PaperEntity } from "@/models/paper-entity";

import { FileSource, FileSourceRequestType } from "./source";

export class ArXivFileSource extends FileSource {
  static checkEnable(paperEntityDraft: PaperEntity) {
    return (
      paperEntityDraft.arxiv !== "" &&
      paperEntityDraft.arxiv !== null &&
      paperEntityDraft.arxiv !== undefined
    );
  }

  static preProcess(paperEntityDraft: PaperEntity): FileSourceRequestType {
    const queryUrl = `https://arxiv.org/pdf/${paperEntityDraft.arxiv}.pdf`;

    const headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36",
    };
    return { queryUrl, headers };
  }

  static async queryProcess(
    queryUrl: string,
    headers: Record<string, string>,
    paperEntityDraft: PaperEntity | null
  ): Promise<string> {
    return queryUrl;
  }
}
