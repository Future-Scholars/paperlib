import Store from "electron-store";
import path from "path";
import os from "os";
import fs from "fs";

export class AppStore {
  constructor() {
    this.store = new Store();

    if (!this.store.has("appLibFolder")) {
      this.set(
        "appLibFolder",
        path.join(os.homedir(), "Documents", "paperlib")
      );
      let dir = path.join(os.homedir(), "Documents", "paperlib");
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      this.set("ieeeAPIKey", "");
      this.set("deleteSourceFile", false);
      this.set("allowFetchPDFMeta", true);
      this.set("enableExportReplacement", false);
      this.set("exportReplacement", []);
      this.set("useSync", false);
      this.set("syncAPIKey", "");
    }
  }

  get(key) {
    return this.store.get(key);
  }

  set(key, value) {
    this.store.set(key, value);
  }

  getAll() {
    return {
      appLibFolder: this.get("appLibFolder"),
      ieeeAPIKey: this.get("ieeeAPIKey"),
      deleteSourceFile: this.get("deleteSourceFile"),
      allowFetchPDFMeta: this.get("allowFetchPDFMeta"),
      enableExportReplacement: this.get("enableExportReplacement"),
      exportReplacement: this.get("exportReplacement"),
      useSync: this.get("useSync"),
      syncAPIKey: this.get("syncAPIKey"),
    };
  }

  setAll(obj) {
    this.set("appLibFolder", obj.appLibFolder);
    this.set("ieeeAPIKey", obj.ieeeAPIKey);
    this.set("deleteSourceFile", obj.deleteSourceFile);
    this.set("allowFetchPDFMeta", obj.allowFetchPDFMeta);
    this.set("enableExportReplacement", obj.enableExportReplacement);
    this.set("exportReplacement", obj.exportReplacement);
    this.set("useSync", obj.useSync);
    this.set("syncAPIKey", obj.syncAPIKey);
  }
}
