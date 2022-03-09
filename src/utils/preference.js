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
        console.log(key, value)
        this.store.set(key, value);
    }
}
