import {
  BrowserWindow,
  app,
  nativeTheme,
  shell,
  utilityProcess,
} from "electron";
import { join, posix } from "node:path";
import os from "os";

import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";

interface WindowOptions extends Electron.BrowserWindowConstructorOptions {
  entry: string;
}

export class WindowProcessManagementService {
  private readonly _extensionProcess: Electron.UtilityProcess;

  constructor(
    @IPreferenceService private readonly _preferenceService: PreferenceService
  ) {
    // 1. Create extension utility process
    this._extensionProcess = utilityProcess.fork(
      join(__dirname, "extension-entry.js")
    );
  }

  /**
   * Create BrowserWindow
   * @param id - window id
   * @param options - window options
   * @param eventCallbacks - callbacks for events
   */
  create(
    id: string,
    options: WindowOptions,
    eventCallbacks: Record<string, (win: BrowserWindow) => void>
  ) {
    if (browserWindows.has(id)) {
      browserWindows.destroy(id);
    }

    const { entry, ...windowOptions } = options;

    browserWindows.set(id, new BrowserWindow(windowOptions));

    if (app.isPackaged || process.env.NODE_ENV === "test") {
      browserWindows.get(id).loadFile(this.constructEntryURL(entry));
    } else {
      browserWindows.get(id).loadURL(this.constructEntryURL(entry));
      browserWindows.get(id).webContents.openDevTools();
    }

    // Make all links open with the browser, not with the application
    browserWindows.get(id).webContents.setWindowOpenHandler(({ url }) => {
      if (
        url.includes(process.env.VITE_DEV_SERVER_URL || "") &&
        process.env.NODE_ENV === "development"
      ) {
        return { action: "allow" };
      }
      if (url.startsWith("http")) {
        shell.openExternal(url);
      }
      return { action: "deny" };
    });
    browserWindows.get(id).webContents.on("will-navigate", function (e, url) {
      if (
        url.includes(process.env.VITE_DEV_SERVER_URL || "") &&
        process.env.NODE_ENV === "development"
      ) {
        return;
      }
      e.preventDefault();
      shell.openExternal(url);
    });

    nativeTheme.themeSource = this._preferenceService.get("preferedTheme") as
      | "dark"
      | "light"
      | "system";

    this._createMenu();
    this._setNonMacSpecificStyles(browserWindows.get(id));

    for (const eventName of ["ready-to-show", "blur", "focus", "close"]) {
      browserWindows.get(id).on(eventName as any, () => {
        browserWindows.get(id).webContents.send(eventName);
        if (eventCallbacks[eventName]) {
          eventCallbacks[eventName](browserWindows.get(id));
        }
      });
    }
  }

  createMainRenderer() {
    const windowSize = this._preferenceService.get("windowSize") as {
      height: number;
      width: number;
    };
    return this.create(
      "rendererProcess",
      {
        entry: "app/index.html",
        title: "Paperlib",
        width: windowSize.width,
        height: windowSize.height,
        minWidth: 600,
        minHeight: 400,
        useContentSize: true,
        webPreferences: {
          preload: join(__dirname, "preload.js"),
          webSecurity: false,
          nodeIntegration: true,
          contextIsolation: false,
        },
        frame: false,
        vibrancy: "sidebar",
        visualEffectState: "active",
      },
      {
        close: (win: BrowserWindow) => {
          const winSize = win.getNormalBounds();
          if (winSize) {
            this._preferenceService.set({
              windowSize: {
                width: winSize.width,
                height: winSize.height,
              },
            });
          }

          for (const [windowId, window] of Object.entries(
            browserWindows.all()
          )) {
            if (windowId !== "mainRenderer") {
              window.close();
              browserWindows.get(windowId).destroy();
            }
          }

          win.close();
          browserWindows.get("mainRenderer").destroy();

          if (process.platform !== "darwin") app.quit();
        },
      }
    );
  }

  constructEntryURL(url: string) {
    if (app.isPackaged) {
      return join(__dirname, url);
    } else if (process.env.NODE_ENV === "test") {
      return join(__dirname, url);
    } else {
      return posix.join(process.env.VITE_DEV_SERVER_URL as string, url);
    }
  }

  private _createMenu() {
    // const isMac = process.platform === "darwin";
    // const locales = loadLocales(preference.get("language") as string);
    // const template = [
    //   ...(isMac
    //     ? [
    //         {
    //           label: app.name,
    //           submenu: [
    //             { role: "about" },
    //             {
    //               label: locales.t("menu.preference"),
    //               accelerator: "Cmd+,",
    //               click: () => {
    //                 // mainWindow.webContents.send("shortcut-Preference");
    //               },
    //             },
    //             {
    //               label: locales.t("menu.checkforupdate"),
    //               click: () => {
    //                 autoUpdater
    //                   .checkForUpdates()
    //                   .then((results) => {
    //                     BrowserWindow.getFocusedWindow()?.webContents.send(
    //                       "log",
    //                       results
    //                     );
    //                   })
    //                   .catch((err) => {
    //                     BrowserWindow.getFocusedWindow()?.webContents.send(
    //                       "log",
    //                       err
    //                     );
    //                   });
    //               },
    //             },
    //             { type: "separator" },
    //             { role: "services" },
    //             { type: "separator" },
    //             { role: "hide" },
    //             { role: "hideOthers" },
    //             { role: "unhide" },
    //             { type: "separator" },
    //             { role: "quit" },
    //           ],
    //         },
    //       ]
    //     : []),
    //   {
    //     label: locales.t("menu.file"),
    //     submenu: [
    //       {
    //         label: locales.t("menu.open"),
    //         accelerator: preference.get("shortcutOpen") || "Enter",
    //         click: () => {
    //           mainWindow.webContents.send("shortcut-Enter");
    //         },
    //       },
    //       { type: "separator" },
    //       {
    //         label: locales.t("menu.copybibtext"),
    //         accelerator:
    //           preference.get("shortcutCopy") || "CommandOrControl+Shift+C",
    //         click: () => {
    //           mainWindow.webContents.send("shortcut-cmd-shift-c");
    //         },
    //       },
    //       {
    //         label: locales.t("menu.copybibtextkey"),
    //         accelerator:
    //           preference.get("shortcutCopyKey") || "CommandOrControl+Shift+K",
    //         click: () => {
    //           mainWindow.webContents.send("shortcut-cmd-shift-k");
    //         },
    //       },
    //       isMac ? { role: "close" } : { role: "quit" },
    //     ],
    //   },
    //   // { role: 'editMenu' }
    //   {
    //     label: locales.t("menu.edit"),
    //     submenu: [
    //       {
    //         label: locales.t("menu.rescrape"),
    //         accelerator:
    //           preference.get("shortcutScrape") || "CommandOrControl+R",
    //         click: () => {
    //           mainWindow.webContents.send("shortcut-cmd-r");
    //         },
    //       },
    //       {
    //         label: locales.t("menu.edit"),
    //         accelerator: preference.get("shortcutEdit") || "CommandOrControl+E",
    //         click: () => {
    //           mainWindow.webContents.send("shortcut-cmd-e");
    //         },
    //       },
    //       {
    //         label: locales.t("menu.flag"),
    //         accelerator: preference.get("shortcutFlag") || "CommandOrControl+F",
    //         click: () => {
    //           mainWindow.webContents.send("shortcut-cmd-f");
    //         },
    //       },
    //       { type: "separator" },
    //       { role: "undo" },
    //       { role: "redo" },
    //       { type: "separator" },
    //       { role: "cut" },
    //       { role: "copy" },
    //       { role: "paste" },
    //       ...(isMac
    //         ? [{ role: "delete" }, { role: "selectAll" }]
    //         : [
    //             { role: "delete" },
    //             { type: "separator" },
    //             { role: "selectAll" },
    //           ]),
    //     ],
    //   },
    //   // { role: 'viewMenu' }
    //   {
    //     label: locales.t("menu.view"),
    //     submenu: [
    //       {
    //         label: locales.t("menu.preview"),
    //         accelerator: preference.get("shortcutPreview") || "Space",
    //         click: () => {
    //           mainWindow.webContents.send("shortcut-Space");
    //         },
    //       },
    //       {
    //         label: "Next",
    //         accelerator: "Down",
    //         click: () => {
    //           mainWindow.webContents.send("shortcut-arrow-down");
    //         },
    //       },
    //       {
    //         label: "Previous",
    //         accelerator: "Up",
    //         click: () => {
    //           mainWindow.webContents.send("shortcut-arrow-up");
    //         },
    //       },
    //       { type: "separator" },
    //       { role: "resetZoom" },
    //       { role: "zoomIn" },
    //       { role: "zoomOut" },
    //       { type: "separator" },
    //       { role: "togglefullscreen" },
    //       { role: "toggleDevTools" },
    //     ],
    //   },
    //   {
    //     label: "Window",
    //     submenu: [
    //       { role: "minimize" },
    //       { role: "zoom" },
    //       ...(isMac
    //         ? [
    //             { type: "separator" },
    //             { role: "front" },
    //             { type: "separator" },
    //             { role: "window" },
    //           ]
    //         : [{ role: "close" }]),
    //     ],
    //   },
    //   {
    //     role: "help",
    //     submenu: [
    //       {
    //         label: "Learn More",
    //         click: async () => {
    //           const { shell } = require("electron");
    //           await shell.openExternal("https://paperlib.app/en/blog/intro/");
    //         },
    //       },
    //     ],
    //   },
    // ];
    // // @ts-ignore
    // const menu = Menu.buildFromTemplate(template);
    // Menu.setApplicationMenu(menu);
  }

  _setNonMacSpecificStyles(win: BrowserWindow) {
    if (os.platform() !== "darwin") {
      win.webContents.insertCSS(`
  
  
  /* Track */
  ::-webkit-scrollbar-track {
    background: var(--q-bg-secondary);
    border-radius: 2px;
  }
  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 2px;
  }
  /* Handle on hover */
  ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }
  
  ::-webkit-scrollbar-corner {
    background: transparent;
    width: 0 !important;
    height: 0 !important;
  }
  
  .sidebar-windows-bg {
    background-color: #efefef;
  }
  
  .splitpanes__splitter {
    background-color: #efefef;
  }
  
  @media (prefers-color-scheme: dark) {
    .sidebar-windows-bg {
      background-color: rgb(50, 50, 50);
    }
    .splitpanes__splitter {
      background-color: rgb(50, 50, 50);
    }
    .plugin-windows-bg {
      background-color: rgb(50, 50, 50);
    }
  }
  
  `);
    }
  }
}
