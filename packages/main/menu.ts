import { ipcMain, Menu, BrowserWindow } from "electron";

const isMac = process.platform === "darwin";

// main
ipcMain.on("show-data-context-menu", (event, args) => {
  const template = [
    {
      label: "Open",
      accelerator: "Enter",
      click: () => {
        event.sender.send("data-context-menu-command", "open");
      },
    },
    {
      label: "Edit",
      enabled: args[0],
      accelerator: isMac ? "cmd+e" : "ctrl+e",
      click: () => {
        event.sender.send("data-context-menu-command", "edit");
      },
    },
    {
      label: "Scrape",
      accelerator: isMac ? "cmd+r" : "ctrl+r",
      click: () => {
        event.sender.send("data-context-menu-command", "scrape");
      },
    },
    {
      label: "Delete",
      click: () => {
        event.sender.send("data-context-menu-command", "delete");
      },
    },
    {
      label: "Toggle Flag",
      accelerator: isMac ? "cmd+f" : "ctrl+f",
      click: () => {
        event.sender.send("data-context-menu-command", "flag");
      },
    },
    { type: "separator" },
    {
      label: "Export",
      submenu: [
        {
          label: "BibTex",
          accelerator: isMac ? "cmd+shift+c" : "ctrl+shift+f",
          click: () => {
            event.sender.send("data-context-menu-command", "export-bibtex");
          },
        },
        {
          label: "Plain Text",
          click: () => {
            event.sender.send("data-context-menu-command", "export-plain");
          },
        },
      ],
    },
  ];
  // @ts-ignore
  const menu = Menu.buildFromTemplate(template);
  // @ts-ignore
  menu.popup(BrowserWindow.fromWebContents(event.sender));
});

export default {};
