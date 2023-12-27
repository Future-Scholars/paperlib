import { OID } from "./id";

export interface ThumbnailCache {
  blob: ArrayBuffer;
  width: number;
  height: number;
}

export class PaperEntityCache {
  static schema = {
    name: "PaperEntityCache",
    primaryKey: "_id",
    properties: {
      _id: "objectId",
      _partition: "string?",
      fulltext: "string",
      thumbnail: "data?",
      thumbnailWidth: "int?",
      thumbnailHeight: "int?",
      md5: "string",
    },
  };

  _id: OID = "";
  _partition?: string;
  fulltext: string = "";
  thumbnail?: ArrayBuffer;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  md5: string = "";

  [Key: string]: unknown;
}
