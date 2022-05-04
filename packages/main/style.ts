import os from "os";

export function setupWindowsSpecificStyle(win: Electron.BrowserWindow) {
  if (os.platform() !== "darwin") {
    if (win) {
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
}

.sidebar-windows-bg {
  background-color: #efefef;
}

@media (prefers-color-scheme: dark) {
  .sidebar-windows-bg {
    background-color: rgb(50, 50, 50);
  }
}

`);
    }
  }
}

export function setupWindowsSpecificStyleForPlugin(
  win: Electron.BrowserWindow
) {
  if (os.platform() !== "darwin") {
    if (win) {
      win.webContents.insertCSS(`
/* Track */
::-webkit-scrollbar {
  width: 0px;
}
`);
    }
  }
}
