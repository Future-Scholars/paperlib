import { app, BrowserWindow } from "@electron/remote";

export class SharedState {
    constructor() {
        // View State
        this.viewState = {
            processingQueueCount: 0,
            entitiesCount: 0,

            sortBy: "addTime",
            sortOrder: "desc",
            searchText: "",

            isEditViewShown: false,
            isTagViewShown: false,
            isFolderViewShown: false,
            isNoteViewShown: false,
            isPreferenceViewShown: false,

            preferenceUpdated: new Date().getTime(),
            realmReinited: new Date().getTime(),
        }

        // Selection State
        this.selectionState = {
            selectedIndex: "",
            selectedCategorizer: "",
        }

        // Shared Data
        this.sharedData = {
            editEntityDraft: "",
        }
        // DB State
        this.dbState = {
            entitiesUpdated: new Date().getTime(),
            tagsUpdated: new Date().getTime(),
            foldersUpdated: new Date().getTime(),
            defaultPath: app.getPath("userData"),
        }
    }

    set(path, value, obj) {
        var sendRequired = false;
        var sendPath = "";
        if (typeof obj === "undefined") {
            obj = this;
            sendRequired = true;
            sendPath = path;
        }

        if (typeof path === "string") {
            var path = path.split(".");
        }

        if (path.length > 1) {
            var p = path.shift();
            if (obj[p] == null || typeof obj[p] !== "object") {
                obj[p] = {};
            }
            this.set(path, value, this[p]);
        } else {
            obj[path[0]] = value;
        }

        if (sendRequired) {
            this.sendSignal(sendPath, this.get(sendPath));
        }
    }

    get(path, obj) {
        if (typeof obj === "undefined") {
            obj = this;
        }

        if (typeof path === "string") {
            var path = path.split(".");
        }

        if (path.length > 1) {
            var p = path.shift();
            if (obj[p] == null || typeof obj[p] !== "object") {
                return null;
            }
            return this.get(path, obj[p]);
        } else {
            return obj[path[0]];
        }
    }

    sendSignal(signal, data) {
        console.log("Sending", signal, data);
        BrowserWindow.getAllWindows()[0].webContents.send(signal, data);
    }
}