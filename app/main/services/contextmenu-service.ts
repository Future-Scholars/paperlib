import { Menu, nativeImage } from "electron";

import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { loadLocales } from "@/locales/load";

const isMac = process.platform === "darwin";

const blueBuf = Buffer.from([246, 130, 59, 0]);
let blueIcon = nativeImage.createFromBuffer(blueBuf, { width: 1, height: 1 });
blueIcon = blueIcon.resize({ width: 3, height: 10 });

const redBuf = Buffer.from([68, 68, 239, 0]);
let redIcon = nativeImage.createFromBuffer(redBuf, { width: 1, height: 1 });
redIcon = redIcon.resize({ width: 3, height: 10 });

const yellowBuf = Buffer.from([8, 179, 234, 0]);
let yellowIcon = nativeImage.createFromBuffer(yellowBuf, {
  width: 1,
  height: 1,
});
yellowIcon = yellowIcon.resize({ width: 3, height: 10 });

const greenBuf = Buffer.from([94, 197, 34, 0]);
let greenIcon = nativeImage.createFromBuffer(greenBuf, { width: 1, height: 1 });
greenIcon = greenIcon.resize({ width: 3, height: 10 });

const orangeBuf = Buffer.from([0, 165, 255, 0]);
let orangeIcon = nativeImage.createFromBuffer(orangeBuf, {
  width: 1,
  height: 1,
});
orangeIcon = orangeIcon.resize({ width: 3, height: 10 });

const cyanBuf = Buffer.from([255, 255, 0, 0]);
let cyanIcon = nativeImage.createFromBuffer(cyanBuf, { width: 1, height: 1 });
cyanIcon = cyanIcon.resize({ width: 3, height: 10 });

const purpleBuf = Buffer.from([128, 0, 128, 0]);
let purpleIcon = nativeImage.createFromBuffer(purpleBuf, {
  width: 1,
  height: 1,
});
purpleIcon = purpleIcon.resize({ width: 3, height: 10 });

const pinkBuf = Buffer.from([203, 192, 255, 0]);
let pinkIcon = nativeImage.createFromBuffer(pinkBuf, { width: 1, height: 1 });
pinkIcon = pinkIcon.resize({ width: 3, height: 10 });

export interface IContextMenuServiceState {
  dataContextMenuScrapeFromClicked: string;
  dataContextMenuOpenClicked: number;
  dataContextMenuShowInFinderClicked: number;
  dataContextMenuEditClicked: number;
  dataContextMenuScrapeClicked: number;
  dataContextMenuDeleteClicked: number;
  dataContextMenuFlagClicked: number;
  dataContextMenuExportBibTexClicked: number;
  dataContextMenuExportBibTexKeyClicked: number;
  dataContextMenuExportPlainTextClicked: number;
  feedContextMenuAddToLibraryClicked: number;
  feedContextMenuToogleReadClicked: number;
  sidebarContextMenuFeedRefreshClicked: { data: string; type: string };
  sidebarContextMenuEditClicked: { data: string; type: string };
  sidebarContextMenuColorClicked: { data: string; type: string; color: string };
  sidebarContextMenuDeleteClicked: { data: string; type: string };
  supContextMenuDeleteClicked: string;
  thumbnailContextMenuReplaceClicked: number;
  thumbnailContextMenuRefreshClicked: number;
}

export const IContextMenuService = createDecorator("contextMenuService");

export class ContextMenuService extends Eventable<IContextMenuServiceState> {
  private readonly _locales: { t: (key: string) => string };

  private readonly _registedScraperExtensions: {
    [extID: string]: { [id: string]: string };
  };

  constructor(
    @IPreferenceService private readonly _preferenceService: PreferenceService
  ) {
    super("contextMenuService", {
      dataContextMenuScrapeFromClicked: "",
      dataContextMenuOpenClicked: 0,
      dataContextMenuShowInFinderClicked: 0,
      dataContextMenuEditClicked: 0,
      dataContextMenuScrapeClicked: 0,
      dataContextMenuDeleteClicked: 0,
      dataContextMenuFlagClicked: 0,
      dataContextMenuExportBibTexClicked: 0,
      dataContextMenuExportBibTexKeyClicked: 0,
      dataContextMenuExportPlainTextClicked: 0,
      feedContextMenuAddToLibraryClicked: 0,
      feedContextMenuToogleReadClicked: 0,
      sidebarContextMenuFeedRefreshClicked: { data: "", type: "" },
      sidebarContextMenuEditClicked: { data: "", type: "" },
      sidebarContextMenuColorClicked: { data: "", type: "", color: "" },
      sidebarContextMenuDeleteClicked: { data: "", type: "" },
      supContextMenuDeleteClicked: "",
      thumbnailContextMenuReplaceClicked: 0,
      thumbnailContextMenuRefreshClicked: 0,
    });

    this._locales = loadLocales(
      this._preferenceService.get("language") as string
    );

    this._registedScraperExtensions = {};
  }

  registerScraperExtension(extID: string, scrapers: { [id: string]: string }) {
    this._registedScraperExtensions[extID] = scrapers;
  }

  unregisterScraperExtension(extID: string) {
    delete this._registedScraperExtensions[extID];
  }

  /**
   * Shows the context menu for paper data.
   * @param {boolean} allowEdit - Whether editing is allowed.
   */
  showPaperDataMenu(allowEdit: boolean) {
    let scraperMenuTemplate: Record<string, any> = [];

    for (const [extID, scrapers] of Object.entries(
      this._registedScraperExtensions
    )) {
      for (const [id, name] of Object.entries(scrapers)) {
        scraperMenuTemplate.push({
          label: name,
          click: () => {
            this.fire({
              dataContextMenuScrapeFromClicked: { extID: extID, scraperID: id },
            });
          },
        });
      }
    }

    const template = [
      {
        label: this._locales.t("menu.open"),
        accelerator: "Enter",
        click: () => {
          this.fire("dataContextMenuOpenClicked");
        },
      },
      {
        label: isMac
          ? this._locales.t("menu.showinfinder")
          : this._locales.t("menu.showinexplore"),
        click: () => {
          this.fire("dataContextMenuShowInFinderClicked");
        },
      },
      { type: "separator" },
      {
        label: this._locales.t("menu.edit"),
        enabled: allowEdit,
        accelerator: isMac ? "cmd+e" : "ctrl+e",
        click: () => {
          this.fire("dataContextMenuEditClicked");
        },
      },
      {
        label: this._locales.t("menu.rescrape"),
        accelerator: isMac ? "cmd+r" : "ctrl+r",
        click: () => {
          this.fire("dataContextMenuScrapeClicked");
        },
      },

      {
        label: this._locales.t("menu.rescrapefrom"),
        submenu: scraperMenuTemplate,
      },

      {
        label: this._locales.t("menu.delete"),
        click: () => {
          this.fire("dataContextMenuDeleteClicked");
        },
      },
      {
        label: this._locales.t("menu.toggleflag"),
        accelerator: isMac ? "cmd+f" : "ctrl+f",
        click: () => {
          this.fire("dataContextMenuFlagClicked");
        },
      },
      { type: "separator" },
      {
        label: this._locales.t("menu.export"),
        submenu: [
          {
            label: "BibTex",
            accelerator: isMac ? "cmd+shift+c" : "ctrl+shift+c",
            click: () => {
              this.fire("dataContextMenuExportBibTexClicked");
            },
          },
          {
            label: this._locales.t("menu.bibtexkey"),
            accelerator: isMac ? "cmd+shift+k" : "ctrl+shift+k",
            click: () => {
              this.fire("dataContextMenuExportBibTexKeyClicked");
            },
          },
          {
            label: this._locales.t("menu.plaintext"),
            click: () => {
              this.fire("dataContextMenuExportPlainTextClicked");
            },
          },
        ],
      },
    ];
    // @ts-ignore
    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  /**
   * Shows the context menu for feed data.
   */
  showFeedDataMenu() {
    const template = [
      {
        label: this._locales.t("menu.open"),
        accelerator: "Enter",
        click: () => {
          this.fire("dataContextMenuOpenClicked");
        },
      },
      { type: "separator" },
      {
        label: this._locales.t("menu.addtolibrary"),
        click: () => {
          this.fire("feedContextMenuAddToLibraryClicked");
        },
      },
      {
        label: this._locales.t("menu.toggleread"),
        click: () => {
          this.fire("feedContextMenuToogleReadClicked");
        },
      },
    ];
    // @ts-ignore
    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  /**
   * Shows the context menu for sidebar.
   * @param {string} data - The data of the clicked item.
   * @param {string} type - The type of the clicked item.
   */
  showSidebarMenu(data: string, type: string) {
    const template = [
      {
        label: "Blue",
        click: () => {
          this.fire({
            sidebarContextMenuColorClicked: {
              data: data,
              type: type,
              color: "blue",
            },
          });
        },
        icon: blueIcon,
      },
      {
        label: "Red",
        click: () => {
          this.fire({
            sidebarContextMenuColorClicked: {
              data: data,
              type: type,
              color: "red",
            },
          });
        },
        icon: redIcon,
      },
      {
        label: "Yellow",
        click: () => {
          this.fire({
            sidebarContextMenuColorClicked: {
              data: data,
              type: type,
              color: "yellow",
            },
          });
        },
        icon: yellowIcon,
      },
      {
        label: "Green",
        click: () => {
          this.fire({
            sidebarContextMenuColorClicked: {
              data: data,
              type: type,
              color: "green",
            },
          });
        },
        icon: greenIcon,
      },
      {
        label: "Orange",
        click: () => {
          this.fire({
            sidebarContextMenuColorClicked: {
              data: data,
              type: type,
              color: "orange",
            },
          });
        },
        icon: orangeIcon,
      },
      {
        label: "Cyan",
        click: () => {
          this.fire({
            sidebarContextMenuColorClicked: {
              data: data,
              type: type,
              color: "cyan",
            },
          });
        },
        icon: cyanIcon,
      },
      {
        label: "Purple",
        click: () => {
          this.fire({
            sidebarContextMenuColorClicked: {
              data: data,
              type: type,
              color: "purple",
            },
          });
        },
        icon: purpleIcon,
      },
      {
        label: "Pink",
        click: () => {
          this.fire({
            sidebarContextMenuColorClicked: {
              data: data,
              type: type,
              color: "pink",
            },
          });
        },
        icon: pinkIcon,
      },
      { type: "separator" },
      {
        label: this._locales.t("menu.delete"),
        click: () => {
          this.fire({ sidebarContextMenuDeleteClicked: { data, type } });
        },
      },
    ];
    if (type === "feed") {
      template.push({
        label: this._locales.t("menu.refresh"),
        click: () => {
          this.fire({ sidebarContextMenuFeedRefreshClicked: { data, type } });
        },
      });
    } else if (type === "PaperPaperSmartFilter") {
    } else {
      template.push({
        label: this._locales.t("menu.edit"),
        click: () => {
          this.fire({ sidebarContextMenuEditClicked: { data, type } });
        },
      });
    }
    // @ts-ignore
    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  /**
   * Shows the context menu for the supplementary files.
   * @param {string} fileURL - The URL of the file.
   */
  showSupMenu(fileURL: string) {
    const template = [
      {
        label: this._locales.t("menu.delete"),
        click: () => {
          this.fire({ supContextMenuDeleteClicked: fileURL });
        },
      },
    ];
    // @ts-ignore
    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  /**
   * Shows the context menu for the thumbnail.
   * @param {string} fileURL - The URL of the file.
   */
  showThumbnailMenu(fileURL: string) {
    const template = [
      {
        label: this._locales.t("menu.replace"),
        click: () => {
          this.fire({ thumbnailContextMenuReplaceClicked: fileURL });
        },
      },
      {
        label: this._locales.t("menu.refresh"),
        click: () => {
          this.fire("thumbnailContextMenuRefreshClicked");
        },
      },
    ];
    // @ts-ignore
    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }
}
