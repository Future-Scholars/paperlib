import Store from "electron-store";
import path from "path";
import os from "os";
import moment from "moment";

const defaultPreferences = {
    appLibFolder: path.join(os.homedir(), "Documents", "paperlib"),
    deleteSourceFile: false,
    enableExportReplacement: true,
    exportReplacement: [],
    useSync: false,
    syncAPIKey: "",
    allowRoutineMatch: true,
    lastRematchTime: moment().unix(),
    rematchInterval: 7,

    pdfBuiltinScraper: true,
    arXivScraper: true,
    doiScraper: true,
    teScraper: true,
    dblpScraper: true,
    cvfScraper: true,
    ieeeScraper: true,
    ieeeAPIKey: ""
}


export class Preference {
    constructor() {
        this.store = new Store();

        // Initialize default preferences
        for (let key in defaultPreferences) {
            if (!this.store.has(key)) {
                this.store.set(key, defaultPreferences[key]);
            }
        }
    }

    get(key) {
        if (this.store.has(key)) {
            return this.store.get(key);
        } else {
            this.set(key, defaultPreferences[key]);
            return defaultPreferences[key];
        }
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
            lastRematchTime: this.get("lastRematchTime"),
            rematchInterval: this.get("rematchInterval"),
            allowRoutineMatch: this.get("allowRoutineMatch"),
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
        this.set("lastRematchTime", obj.lastRematchTime);
        this.set("rematchInterval", obj.rematchInterval);
        this.set("allowRoutineMatch", obj.allowRoutineMatch);
    }
}
