import { ipcMain, session } from "electron";

ipcMain.on("get-system-proxy", async (event) => {
  const proxyUrl = await session.defaultSession.resolveProxy(
    "https://www.google.com"
  );
  event.returnValue = proxyUrl;
});
