import { Menu, app, globalShortcut } from "electron";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { loadLocales } from "@/locales/load";

import { Process } from "@/base/process-id";
import { IUpgradeService, UpgradeService } from "./upgrade-service";

const isMac = process.platform === "darwin";

export interface IMenuServiceState {
  preference: number;
  "File-enter": number;
  "File-copyBibTex": number;
  "File-copyBibTexKey": number;
  "Edit-rescrape": number;
  "Edit-edit": number;
  "Edit-flag": number;
  "View-preview": number;
  "View-next": number;
  "View-previous": number;
  "File-delete": number;
  "File-importFrom": number;
}

export const IMenuService = createDecorator("menuService");

export class MenuService extends Eventable<IMenuServiceState> {
  private readonly _locales: { t: (key: string) => string };
  private _isDisabled: boolean = false;

  constructor(
    @IPreferenceService private readonly _preferenceService: PreferenceService,
    @IUpgradeService private readonly _upgradeService: UpgradeService
  ) {
    super("menuService", {
      preference: 0,
      "File-enter": 0,
      "File-copyBibTex": 0,
      "File-copyBibTexKey": 0,
      "Edit-rescrape": 0,
      "Edit-edit": 0,
      "Edit-flag": 0,
      "View-preview": 0,
      "View-next": 0,
      "View-previous": 0,
      "File-delete": 0,
      "File-importFrom": 0,
    });

    this._locales = loadLocales(
      this._preferenceService.get("language") as string
    );

    const deleteItem = {
      label: this._locales.t("menu.delete"),
      click: () => {
        this.fire("File-delete");
      },
    };

    // ============================================================
    // 1. Create the app menu.
    const template = [
      ...(isMac
        ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              {
                label: this._locales.t("menu.preference"),
                click: () => {
                  this.fire("preference");
                },
              },
              {
                label: this._locales.t("menu.checkforupdate"),
                click: () => {
                  this._upgradeService.checkForUpdates();
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
        label: this._locales.t("menu.file"),
        submenu: [
          {
            label: this._locales.t("menu.open"),
            click: () => {
              this.fire("File-enter");
            },
          },
          { type: "separator" },
          {
            label: this._locales.t("menu.importfrom"),
            // accelerator: isMac ? "Cmd+O" : "Ctrl+O",
            click: () => {
              this.fire("File-importFrom");
            },
          },
          { type: "separator" },
          {
            label: this._locales.t("menu.copybibtext"),
            click: () => {
              this.fire("File-copyBibTex");
            },
          },
          {
            label: this._locales.t("menu.copybibtextkey"),
            click: () => {
              this.fire("File-copyBibTexKey");
            },
          },
          {
            label: this._locales.t("menu.close"),
            click: () => {
              windowProcessManagementService.hide(Process.renderer, true);
            },
          },
        ],
      },
      // { role: 'editMenu' }
      {
        label: this._locales.t("menu.edit"),
        submenu: [
          {
            label: this._locales.t("menu.rescrape"),
            click: () => {
              this.fire("Edit-rescrape");
            },
          },
          {
            label: this._locales.t("menu.edit"),
            click: () => {
              this.fire("Edit-edit");
            },
          },
          {
            label: this._locales.t("menu.flag"),
            click: () => {
              this.fire("Edit-flag");
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
            ? [deleteItem, { role: "selectAll" }]
            : [deleteItem, { type: "separator" }, { role: "selectAll" }]),
        ],
      },
      // { role: 'viewMenu' }
      {
        label: this._locales.t("menu.view"),
        submenu: [
          {
            label: this._locales.t("menu.preview"),
            click: () => {
              this.fire("View-preview");
            },
          },
          {
            label: "Next",
            click: () => {
              this.fire("View-next");
            },
          },
          {
            label: "Previous",
            click: () => {
              this.fire("View-previous");
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
              await shell.openExternal("https://paperlib.app/en/");
            },
          },
        ],
      },
    ];

    // @ts-ignore
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  onClick = this.onChanged;

  /**
   * Click menu item in a programmatic way.
   * @param key
   */
  click(key: keyof IMenuServiceState) {
    this.fire(key);
  }

  /**
   * Disable all global shortcuts.
   */
  disableGlobalShortcuts() {
    globalShortcut.unregisterAll();
  }

  /**
   * Enable all global shortcuts.
   */
  enableGlobalShortcuts() {
    const pluginKey = this._preferenceService.get("shortcutPlugin");
    if (!pluginKey) {
      return;
    }
    if (!globalShortcut.isRegistered(pluginKey as string)) {
      globalShortcut.register(pluginKey as string, async () => {
        if (
          !windowProcessManagementService.browserWindows.has(
            "quickpasteProcess"
          )
        ) {
          windowProcessManagementService.createQuickpasteRenderer();
        }

        windowProcessManagementService.browserWindows
          .get("quickpasteProcess")
          .show();
      });
    }
  }
}
