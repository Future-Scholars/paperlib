import { ipcMain, BrowserWindow, Menu } from "electron";

export function registerPluginWindowEvents(winPlugin: BrowserWindow | null) {
  ipcMain.on("plugin-window-resize", (event, height) => {
    winPlugin?.setSize(600, height);
  });

  ipcMain.on("plugin-window-hide", (event) => {
    winPlugin?.blur();
  });

  ipcMain.on("plugin-window-show-folder-list", (event, args) => {
    const template = [
      {
        label: `New Folder`,
        click: () => {
          event.sender.send("plugin-context-menu-link", [
            "paperlib-link-new-folder",
          ]);
        },
      },
      { type: "separator" },
    ];

    for (const folder of args) {
      template.push({
        label: `${folder.name}`,
        click: () => {
          event.sender.send("plugin-context-menu-link", [folder.name]);
        },
      });
    }

    // @ts-ignore
    const menu = Menu.buildFromTemplate(template);

    // @ts-ignore
    menu.popup(BrowserWindow.fromWebContents(event.sender));
  });
}
