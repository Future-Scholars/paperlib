import Store from "electron-store";
import path from "path";

export class AppStore {
  constructor() {
    this.store = new Store();

    if (!this.store.has("appLibFolder")) {
      this.set(
        "appLibFolder",
        path.join(process.env.HOME, "Documents", "paperlib")
      );
      this.set("ieeeAPIKey", "q6kwjxnfpxb5ewt7gb32gnd4");
      this.set("deleteSourceFile", false);
      this.set("allowFetchPDFMeta", true);
      this.set("enableExportReplacement", false);
      this.set("exportReplacement", []);
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
    };
  }

  setAll(obj) {
    this.set("appLibFolder", obj.appLibFolder);
    this.set("ieeeAPIKey", obj.ieeeAPIKey);
    this.set("deleteSourceFile", obj.deleteSourceFile);
    this.set("allowFetchPDFMeta", obj.allowFetchPDFMeta);
    this.set("enableExportReplacement", obj.enableExportReplacement);
    this.set("exportReplacement", obj.exportReplacement);
  }
}
