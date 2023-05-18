import { BrowserWindow, Menu, app } from "electron";
import { autoUpdater } from "electron-updater";

import { loadLocales } from "../../locales/load";
import { Preference } from "../../preference/preference";

export function setMainMenu(mainWindow: BrowserWindow, preference: Preference) {
  const isMac = process.platform === "darwin";

  const locales = loadLocales(preference.get("language") as string);

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              {
                label: locales.t("menu.preference"),
                accelerator: "Cmd+,",
                click: () => {
                  mainWindow.webContents.send("shortcut-Preference");
                },
              },
              {
                label: locales.t("menu.checkforupdate"),
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
    {
      label: locales.t("menu.file"),
      submenu: [
        {
          label: locales.t("menu.open"),
          accelerator: preference.get("shortcutOpen") || "Enter",
          click: () => {
            mainWindow.webContents.send("shortcut-Enter");
          },
        },
        { type: "separator" },
        {
          label: locales.t("menu.copybibtext"),
          accelerator:
            preference.get("shortcutCopy") || "CommandOrControl+Shift+C",
          click: () => {
            mainWindow.webContents.send("shortcut-cmd-shift-c");
          },
        },
        {
          label: locales.t("menu.copybibtextkey"),
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
      label: locales.t("menu.edit"),
      submenu: [
        {
          label: locales.t("menu.rescrape"),
          accelerator: preference.get("shortcutScrape") || "CommandOrControl+R",
          click: () => {
            mainWindow.webContents.send("shortcut-cmd-r");
          },
        },
        {
          label: locales.t("menu.edit"),
          accelerator: preference.get("shortcutEdit") || "CommandOrControl+E",
          click: () => {
            mainWindow.webContents.send("shortcut-cmd-e");
          },
        },
        {
          label: locales.t("menu.flag"),
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
          ? [{ role: "delete" }, { role: "selectAll" }]
          : [{ role: "delete" }, { type: "separator" }, { role: "selectAll" }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: locales.t("menu.view"),
      submenu: [
        {
          label: locales.t("menu.preview"),
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
