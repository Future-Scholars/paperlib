import { errorcatching } from "@/base/error";
import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  IPreferenceService,
  PreferenceService,
} from "@/common/services/preference-service";
import { loadLocales } from "@/locales/load";
import {
  CategorizerMenuItem,
  CategorizerType,
  Colors,
  PaperFolder,
  PaperTag,
} from "@/models/categorizer";
import { OID } from "@/models/id";
import { PaperSmartFilter } from "@/models/smart-filter";
import { Menu, MenuItemConstructorOptions, nativeImage } from "electron";

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
  dataContextMenuRemoveFromClicked: { type: CategorizerType; id: OID };
  dataContextMenuScrapeFromClicked: string;
  dataContextMenuOpenClicked: number;
  dataContextMenuShowInFinderClicked: number;
  dataContextMenuEditClicked: number;
  dataContextMenuScrapeClicked: number;
  dataContextMenuFuzzyScrapeClicked: number;
  dataContextMenuDeleteClicked: number;
  dataContextMenuFlagClicked: number;
  dataContextMenuExportBibTexClicked: number;
  dataContextMenuExportBibItemClicked: number;
  dataContextMenuExportCSVClicked: number;
  dataContextMenuExportBibTexKeyClicked: number;
  dataContextMenuExportPlainTextClicked: number;
  feedContextMenuAddToLibraryClicked: number;
  feedContextMenuToggleReadClicked: number;
  sidebarContextMenuFeedRefreshClicked: { data: string; type: string };
  sidebarContextMenuEditClicked: { data: string; type: string };
  sidebarContextMenuColorClicked: { data: string; type: string; color: string };
  sidebarContextMenuDeleteClicked: { data: string; type: string };
  supContextMenuDeleteClicked: string;
  supContextMenuRenameClicked: string;
  thumbnailContextMenuReplaceClicked: number;
  thumbnailContextMenuRefreshClicked: number;
  linkToFolderClicked: string;
  dataContextMenuFromExtensionsClicked: { extID: string; itemID: string };
}

export const IContextMenuService = createDecorator("contextMenuService");

export class ContextMenuService extends Eventable<IContextMenuServiceState> {
  private readonly _locales: { t: (key: string) => string };

  private readonly _extensionContextMenuItems: {
    [extID: string]: { id: string; label: string }[];
  };

  private readonly _registedScraperExtensions: {
    [extID: string]: { [id: string]: string };
  };

  constructor(
    @IPreferenceService private readonly _preferenceService: PreferenceService
  ) {
    super("contextMenuService", {
      dataContextMenuRemoveFromClicked: {
        type: CategorizerType.PaperFolder,
        id: "",
      },
      dataContextMenuScrapeFromClicked: "",
      dataContextMenuOpenClicked: 0,
      dataContextMenuShowInFinderClicked: 0,
      dataContextMenuEditClicked: 0,
      dataContextMenuScrapeClicked: 0,
      dataContextMenuFuzzyScrapeClicked: 0,
      dataContextMenuDeleteClicked: 0,
      dataContextMenuFlagClicked: 0,
      dataContextMenuExportBibTexClicked: 0,
      dataContextMenuExportBibItemClicked: 0,
      dataContextMenuExportCSVClicked: 0,
      dataContextMenuExportBibTexKeyClicked: 0,
      dataContextMenuExportPlainTextClicked: 0,
      feedContextMenuAddToLibraryClicked: 0,
      feedContextMenuToggleReadClicked: 0,
      sidebarContextMenuFeedRefreshClicked: { data: "", type: "" },
      sidebarContextMenuEditClicked: { data: "", type: "" },
      sidebarContextMenuColorClicked: { data: "", type: "", color: "" },
      sidebarContextMenuDeleteClicked: { data: "", type: "" },
      supContextMenuDeleteClicked: "",
      supContextMenuRenameClicked: "",
      thumbnailContextMenuReplaceClicked: 0,
      thumbnailContextMenuRefreshClicked: 0,
      linkToFolderClicked: "",
      dataContextMenuFromExtensionsClicked: { extID: "", itemID: "" },
    });

    this._locales = loadLocales(
      this._preferenceService.get("language") as string
    );

    this._registedScraperExtensions = {};
    this._extensionContextMenuItems = {};
  }

  /**
   * Registers a scraper extension. It will be shown in the context menu.
   */
  @errorcatching("Failed to register scraper extension.", false, "ContextMenu")
  registerScraperExtension(extID: string, scrapers: { [id: string]: string }) {
    this._registedScraperExtensions[extID] = scrapers;
  }

  /**
   * Unregisters a scraper extension.
   * @param {string} extID - The ID of the extension.
   */
  @errorcatching(
    "Failed to unregister scraper extension.",
    false,
    "ContextMenu"
  )
  unregisterScraperExtension(extID: string) {
    delete this._registedScraperExtensions[extID];
  }

  /**
   * Shows the context menu for paper data.
   * @param {boolean} allowEdit - Whether editing is allowed.
   * @param {CategorizerMenuItem[]} categorizeList - The list of categorizers.
   */
  @errorcatching(
    "Failed to show the contextmenu for papers.",
    false,
    "ContextMenu"
  )
  showPaperDataMenu(allowEdit: boolean, categorizeList: CategorizerMenuItem[]) {
    let removeFolderMenuTemplate: MenuItemConstructorOptions[] = [];
    let removeTagMenuTemplate: MenuItemConstructorOptions[] = [];
    categorizeList.forEach(({ type, name, id }) => {
      if (type === CategorizerType.PaperFolder) {
        removeFolderMenuTemplate.push({
          label: name,
          click: () => {
            this.fire({
              dataContextMenuRemoveFromClicked: { type, id },
            });
          },
        });
      }
      if (type === CategorizerType.PaperTag) {
        removeTagMenuTemplate.push({
          label: name,
          click: () => {
            this.fire({
              dataContextMenuRemoveFromClicked: { type, id },
            });
          },
        });
      }
    });

    let scraperMenuTemplate: MenuItemConstructorOptions[] = [];

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

    const template: MenuItemConstructorOptions[] = [
      {
        label: this._locales.t("menu.open"),
        accelerator: preferenceService.get("shortcutOpen") as string,
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
        label: this._locales.t("menu.rescrape"),
        accelerator: preferenceService.get("shortcutScrape") as string,
        click: () => {
          this.fire("dataContextMenuScrapeClicked");
        },
      },
      {
        label: this._locales.t("menu.rescrapefrom"),
        submenu: scraperMenuTemplate,
      },
      {
        label: this._locales.t("menu.fuzzyscrape"),
        click: () => {
          this.fire("dataContextMenuFuzzyScrapeClicked");
        },
      },
      { type: "separator" },
      {
        label: this._locales.t("menu.edit"),
        enabled: allowEdit,
        accelerator: preferenceService.get("shortcutEdit") as string,
        click: () => {
          this.fire("dataContextMenuEditClicked");
        },
      },
      {
        label: this._locales.t("menu.delete"),
        accelerator: preferenceService.get("shortcutDelete") as string,
        click: () => {
          this.fire("dataContextMenuDeleteClicked");
        },
      },
      {
        label: this._locales.t("menu.toggleflag"),
        accelerator: preferenceService.get("shortcutFlag") as string,
        click: () => {
          this.fire("dataContextMenuFlagClicked");
        },
      },
      {
        label: this._locales.t("menu.removefrom"),
        submenu: [
          {
            label: this._locales.t("mainview.folders"),
            submenu: removeFolderMenuTemplate,
          },
          {
            label: this._locales.t("mainview.tags"),
            submenu: removeTagMenuTemplate,
          },
        ],
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
            label: "CSV",
            accelerator: isMac ? "cmd+shift+v" : "ctrl+shift+v",
            click: () => {
              this.fire("dataContextMenuExportCSVClicked");
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
          {
            label: "BibItem",
            click: () => {
              this.fire("dataContextMenuExportBibItemClicked");
            },
          },
        ],
      },
    ];
    const contextMenuTemplate: MenuItemConstructorOptions[] = [];

    for (const [extID, items] of Object.entries(
      this._extensionContextMenuItems
    )) {
      items.forEach((item) => {
        contextMenuTemplate.push({
          label: item.label,
          click: () => {
            this.fire({
              dataContextMenuFromExtensionsClicked: { extID, itemID: item.id },
            });
          },
        });
      });
    }

    if (contextMenuTemplate.length > 0) {
      template.push({ type: "separator" });
    }

    template.push(...contextMenuTemplate);

    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  /**
   * Shows the context menu for feed data.
   */
  @errorcatching(
    "Failed to show the contextmenu for feeds.",
    false,
    "ContextMenu"
  )
  showFeedDataMenu() {
    const template: MenuItemConstructorOptions[] = [
      {
        label: this._locales.t("menu.open"),
        accelerator: preferenceService.get("shortcutOpen") as string,
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
          this.fire("feedContextMenuToggleReadClicked");
        },
      },
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  /**
   * Shows the context menu for sidebar.
   * @param {string} data - The data of the clicked item.
   * @param {string} type - The type of the clicked item.
   */
  @errorcatching(
    "Failed to show the contextmenu for sidebar.",
    false,
    "ContextMenu"
  )
  showSidebarMenu(data: string, type: string) {
    const template: MenuItemConstructorOptions[] = [
      {
        label: "Blue",
        click: () => {
          this.fire({
            sidebarContextMenuColorClicked: {
              data: data,
              type: type,
              color: Colors.blue,
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
              color: Colors.red,
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
              color: Colors.yellow,
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
              color: Colors.green,
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
              color: Colors.orange,
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
              color: Colors.cyan,
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
              color: Colors.purple,
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
              color: Colors.pink,
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
    } else if (
      [
        PaperSmartFilter.schema.name,
        PaperTag.schema.name,
        PaperFolder.schema.name,
      ].includes(type)
    ) {
      template.push({
        label: this._locales.t("menu.edit"),
        click: () => {
          this.fire({ sidebarContextMenuEditClicked: { data, type } });
        },
      });
    }
    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  /**
   * Shows the context menu for the supplementary files.
   * @param {string} fileURL - The URL of the file.
   */
  @errorcatching(
    "Failed to show the contextmenu for supplementary files.",
    false,
    "ContextMenu"
  )
  showSupMenu(fileURL: string) {
    const template = [
      {
        label: this._locales.t("menu.delete"),
        click: () => {
          this.fire({ supContextMenuDeleteClicked: fileURL });
        },
      },
      {
        label: this._locales.t("menu.edit"),
        click: () => {
          this.fire({ supContextMenuRenameClicked: fileURL });
        },
      },
    ];
    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  /**
   * Shows the context menu for the thumbnail.
   * @param {string} fileURL - The URL of the file.
   */
  @errorcatching(
    "Failed to show the contextmenu for thumbnails.",
    false,
    "ContextMenu"
  )
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
    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  /**
   * Shows the context menu for the quickpaste folder linking.
   * @param {string[]} folderNames - The names of the folders.
   */
  @errorcatching(
    "Failed to show the contextmenu for quickpaste linking.",
    false,
    "ContextMenu"
  )
  showQuickpasteLinkMenu(folderNames: { id: string; name: string }[]) {
    const template: MenuItemConstructorOptions[] = [
      {
        label: `Create New`,
        click: () => {
          const newFolderName = `Folder_${Date.now()}`;
          this.fire({ linkToFolderClicked: newFolderName });
        },
      },
      { type: "separator" },
    ];

    for (const folder of folderNames) {
      template.push({
        label: `${folder.name}`,
        click: () => {
          this.fire({ linkToFolderClicked: folder.name });
        },
      });
    }

    const menu = Menu.buildFromTemplate(template);
    menu.popup();
  }

  /**
   * Registers context menus form extensions.
   * @param extID - The id of the extension to register menus
   * @param items - The menu items to be registered
   */
  @errorcatching(
    "Failed to register context menu from extensions.",
    false,
    "ContextMenu"
  )
  registerContextMenu(extID: string, items: { id: string; label: string }[]) {
    this._extensionContextMenuItems[extID] = items;
  }

  /**
   * Registers context menus form extensions.
   * @param extID - The id of the extension to unregister menu items
   */
  @errorcatching(
    "Failed to unregister context menu from extensions.",
    false,
    "ContextMenu"
  )
  unregisterContextMenu(extID: string) {
    delete this._extensionContextMenuItems[extID];
  }
}
