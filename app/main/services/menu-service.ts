import { Menu, app } from "electron";

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
    });

    this._locales = loadLocales(
      this._preferenceService.get("language") as string
    );

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
                  accelerator: "Cmd+,",
                  click: () => {
                    if (!this._isDisabled) {
                      this.fire("preference");
                    }
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
            accelerator: this._preferenceService.get("shortcutOpen") || "Enter",
            click: () => {
              if (!this._isDisabled) {
                this.fire("File-enter");
              }
            },
          },
          { type: "separator" },
          {
            label: this._locales.t("menu.copybibtext"),
            accelerator:
              this._preferenceService.get("shortcutCopy") ||
              "CommandOrControl+Shift+C",
            click: () => {
              if (!this._isDisabled) {
                this.fire("File-copyBibTex");
              }
            },
          },
          {
            label: this._locales.t("menu.copybibtextkey"),
            accelerator:
              this._preferenceService.get("shortcutCopyKey") ||
              "CommandOrControl+Shift+K",
            click: () => {
              if (!this._isDisabled) {
                this.fire("File-copyBibTexKey");
              }
            },
          },
          {
            label: this._locales.t("menu.close"),
            accelerator: "CommandOrControl+W",
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
            accelerator:
              this._preferenceService.get("shortcutScrape") ||
              "CommandOrControl+R",
            click: () => {
              if (!this._isDisabled) {
                this.fire("Edit-rescrape");
              }
            },
          },
          {
            label: this._locales.t("menu.edit"),
            accelerator:
              this._preferenceService.get("shortcutEdit") ||
              "CommandOrControl+E",
            click: () => {
              if (!this._isDisabled) {
                this.fire("Edit-edit");
              }
            },
          },
          {
            label: this._locales.t("menu.flag"),
            accelerator:
              this._preferenceService.get("shortcutFlag") ||
              "CommandOrControl+F",
            click: () => {
              if (!this._isDisabled) {
                this.fire("Edit-flag");
              }
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
            : [
                { role: "delete" },
                { type: "separator" },
                { role: "selectAll" },
              ]),
        ],
      },
      // { role: 'viewMenu' }
      {
        label: this._locales.t("menu.view"),
        submenu: [
          {
            label: this._locales.t("menu.preview"),
            accelerator:
              this._preferenceService.get("shortcutPreview") || "Space",
            click: () => {
              if (!this._isDisabled) {
                this.fire("View-preview");
              }
            },
          },
          {
            label: "Next",
            accelerator: "Down",
            click: () => {
              if (!this._isDisabled) {
                this.fire("View-next");
              }
            },
          },
          {
            label: "Previous",
            accelerator: "Up",
            click: () => {
              if (!this._isDisabled) {
                this.fire("View-previous");
              }
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
   * Enable all menu items.
   */
  enableAll() {
    this._isDisabled = false;
  }

  /**
   * Disable all menu items.
   */
  disableAll() {
    this._isDisabled = true;
  }

  /**
   * Click menu item in a programmatic way.
   * @param key
   */
  click(key: keyof IMenuServiceState) {
    this.fire(key);
  }
}
