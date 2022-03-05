import { app, BrowserWindow, nativeTheme, dialog } from "electron";
import { initialize, enable } from "@electron/remote/main";
import path from "path";
import os from "os";
const { autoUpdater } = require("electron-updater");

initialize();

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
    if (platform === "win32" && nativeTheme.shouldUseDarkColors === true) {
        require("fs").unlinkSync(
            path.join(app.getPath("userData"), "DevTools Extensions")
        );
    }
} catch (_) {}

let mainWindow;

function createWindow() {
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
        icon: path.resolve(__dirname, "icons/icon.png"), // tray icon
        width: 1440,
        height: 860,
        minWidth: 1440,
        minHeight: 860,
        useContentSize: true,
        webPreferences: {
            contextIsolation: true,
            webSecurity: false,
            // More info: /quasar-cli/developing-electron-apps/electron-preload-script
            preload: path.resolve(
                __dirname,
                process.env.QUASAR_ELECTRON_PRELOAD
            ),
        },
        frame: false,
    });

    enable(mainWindow.webContents);

    mainWindow.loadURL(process.env.APP_URL);
    if (process.env.DEBUGGING) {
        // if on DEV or Production with debug enabled
        mainWindow.webContents.openDevTools();
    } else {
        // we're on production; no access to devtools pls
        // mainWindow.webContents.on("devtools-opened", () => {
        //   mainWindow.webContents.closeDevTools();
        // });
    }

    mainWindow.on("closed", () => {
        mainWindow = null;
    });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on("second-instance", async (event, argv) => {
        let deeplinkingUrl = argv.find((arg) =>
            arg.startsWith("paperlib-electron://")
        );
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            BrowserWindow.getFocusedWindow().webContents.send(
                "pluginURL",
                deeplinkingUrl
            );
        }
    });

    app.whenReady().then(() => {
        createWindow();
    });

    app.on("open-url", (event, url) => {
        if (url.startsWith("paperlib-electron://")) {
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();

                BrowserWindow.getFocusedWindow().webContents.send(
                    "pluginURL",
                    url
                );
            }
        }
    });
}

app.on("window-all-closed", () => {
    if (platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient("paperlib", process.execPath, [
            path.resolve(process.argv[1]),
        ]);
    }
} else {
    app.setAsDefaultProtocolClient("paperlib");
}

autoUpdater.checkForUpdates();

autoUpdater.on("update-downloaded", async (info) => {
    const dialogOpts = {
        type: "info",
        buttons: ["Update Now", "Cancel"],
        title: "A new version of PaperLib is available.",
        message: "A new version of PaperLib is available.",
        detail: "It will be downloaded and installed automatically.",
    };

    let response = await dialog.showMessageBox(dialogOpts);
    if (response.response === 0) {
        autoUpdater.quitAndInstall();
    }
});
