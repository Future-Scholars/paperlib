import { BrowserWindow } from "electron";

export async function createSideworkWindow(
  winSidework: BrowserWindow | null
): Promise<BrowserWindow> {
  if (winSidework) {
    winSidework.destroy();
    winSidework = null;
  }

  winSidework = new BrowserWindow({
    title: "Sidework window",
    width: 600,
    height: 600,
    useContentSize: true,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: true,
    },
    frame: true,
    show: false,
  });

  winSidework.on("closed", () => {
    winSidework = null;
  });

  return winSidework;
}
