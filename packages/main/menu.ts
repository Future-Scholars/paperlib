import { app, BrowserWindow, Menu } from "electron";
import { autoUpdater } from "electron-updater";

export function setMainMenu(mainWindow: BrowserWindow) {
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
          accelerator: "Enter",
          click: () => {
            mainWindow.webContents.send("shortcut-Enter");
          },
        },
        { type: "separator" },
        {
          label: "Copy Bibtex",
          accelerator: isMac ? "cmd+shift+c" : "ctrl+shift+c",
          click: () => {
            mainWindow.webContents.send("shortcut-cmd-shift-c");
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
          accelerator: isMac ? "cmd+r" : "ctrl+r",
          click: () => {
            mainWindow.webContents.send("shortcut-cmd-r");
          },
        },
        {
          label: "Edit Metadata",
          accelerator: isMac ? "cmd+e" : "ctrl+e",
          click: () => {
            mainWindow.webContents.send("shortcut-cmd-e");
          },
        },
        {
          label: "Flag",
          accelerator: isMac ? "cmd+f" : "ctrl+f",
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
          accelerator: "Space",
          click: () => {
            mainWindow.webContents.send("shortcut-Space");
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
