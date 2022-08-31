import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { autoUpdater } from "electron-updater";
import Store from "electron-store";

export function setMainMenu(mainWindow: BrowserWindow, preference: Store) {
  const isMac = process.platform === "darwin";

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              {
                label: "Preference",
                accelerator: "Cmd+,",
                click: () => {
                  mainWindow.webContents.send("shortcut-Preference");
                },
              },
              {
                label: "Check for Updates",
                click: () => {
                  autoUpdater
                    .checkForUpdates()
                    .then((results) => {
                      BrowserWindow.getFocusedWindow()?.webContents.send(
                        "log",
                        results
                      );
                    })
                    .catch((err) => {
                      BrowserWindow.getFocusedWindow()?.webContents.send(
                        "log",
                        err
                      );
                    });
                },
              },
              { type: "separator" },
              { role: "services" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: "File",
      submenu: [
        {
          label: "Open",
          accelerator: preference.get("shortcutOpen") || "Enter",
          click: () => {
            mainWindow.webContents.send("shortcut-Enter");
          },
        },
        { type: "separator" },
        {
          label: "Copy Bibtex",
          accelerator:
            preference.get("shortcutCopy") || "CommandOrControl+Shift+C",
          click: () => {
            mainWindow.webContents.send("shortcut-cmd-shift-c");
          },
        },
        {
          label: "Copy Bibtex Key",
          accelerator:
            preference.get("shortcutCopyKey") || "CommandOrControl+Shift+K",
          click: () => {
            mainWindow.webContents.send("shortcut-cmd-shift-k");
          },
        },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    // { role: 'editMenu' }
    {
      label: "Edit",
      submenu: [
        {
          label: "Scrape",
          accelerator: preference.get("shortcutScrape") || "CommandOrControl+R",
          click: () => {
            mainWindow.webContents.send("shortcut-cmd-r");
          },
        },
        {
          label: "Edit Metadata",
          accelerator: preference.get("shortcutEdit") || "CommandOrControl+E",
          click: () => {
            mainWindow.webContents.send("shortcut-cmd-e");
          },
        },
        {
          label: "Flag",
          accelerator: preference.get("shortcutFlag") || "CommandOrControl+F",
          click: () => {
            mainWindow.webContents.send("shortcut-cmd-f");
          },
        },
        { type: "separator" },
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac
          ? [
              { role: "pasteAndMatchStyle" },
              { role: "delete" },
              { role: "selectAll" },
              { type: "separator" },
              {
                label: "Speech",
                submenu: [{ role: "startSpeaking" }, { role: "stopSpeaking" }],
              },
            ]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: "View",
      submenu: [
        {
          label: "Preview",
          accelerator: preference.get("shortcutPreview") || "Space",
          click: () => {
            mainWindow.webContents.send("shortcut-Space");
          },
        },
        {
          label: "Next",
          accelerator: "Down",
          click: () => {
            mainWindow.webContents.send("shortcut-arrow-down");
          },
        },
        {
          label: "Previous",
          accelerator: "Up",
          click: () => {
            mainWindow.webContents.send("shortcut-arrow-up");
          },
        },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { role: "toggleDevTools" },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" },
              { role: "front" },
              { type: "separator" },
              { role: "window" },
            ]
          : [{ role: "close" }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: async () => {
            const { shell } = require("electron");
            await shell.openExternal("https://paperlib.app/en/blog/intro/");
          },
        },
      ],
    },
  ];

  // @ts-ignore
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
