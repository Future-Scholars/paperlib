import { BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";
import os from "os";

import { createSideworkWindow } from "./index";

export function registerSideworkWindowEvents(
  winSidework: BrowserWindow | null
) {
  // =====================
  // Google Robot Check
  ipcMain.handle("sidework-window-robot-check", async (event, url) => {
    if (winSidework === null || winSidework?.isDestroyed()) {
      winSidework = await createSideworkWindow(winSidework);
    }
    winSidework.loadURL(url);

    let dom: string | null = null;

    winSidework.webContents.on("dom-ready", async () => {
      dom = await winSidework?.webContents.executeJavaScript(
        "document.body.innerHTML"
      );
      if (
        dom?.includes("Please show you're not a robot") ||
        dom?.includes("captcha-form")
      ) {
        winSidework?.show();
      } else {
        winSidework?.close();
      }
    });

    return await new Promise((resolve, reject) => {
      winSidework?.on("close", async () => {
        resolve(dom);
      });
    });
  });

  // =====================
  // x-hub Request
  ipcMain.handle("sidework-window-xhub-request", async (event, url) => {
    if (winSidework === null || winSidework?.isDestroyed()) {
      winSidework = await createSideworkWindow(winSidework);
    }
    winSidework.loadURL(url);
    winSidework.on("closed", () => {
      winSidework = null;
    });

    let dom: string | null = null;

    return await new Promise((resolve, reject) => {
      winSidework?.webContents.session.on(
        "will-download",
        (event, item, webContents) => {
          let filename = url.split("/").pop() as string;
          filename = filename.slice(0, 100);
          if (!filename.endsWith(".pdf")) {
            filename += ".pdf";
          }
          const targetUrl = join(os.homedir(), "Downloads", filename);
          item.setSavePath(targetUrl);

          item.on("updated", (event, state) => {
            if (state === "interrupted") {
              winSidework?.close();
              resolve("");
            }
          });
          item.once("done", (event, state) => {
            if (state === "completed") {
              winSidework?.close();
              resolve(targetUrl);
            } else {
              winSidework?.close();
              resolve("");
            }
          });
        }
      );

      winSidework?.webContents.on("dom-ready", async () => {
        dom = await winSidework?.webContents.executeJavaScript(
          "document.body.innerHTML"
        );

        if (dom?.includes("This process is automatic.")) {
          // Close after 20 sec.
          setTimeout(() => {
            winSidework?.close();
            resolve("");
          }, 20000);
        } else {
          resolve(dom);
        }
      });
    });
  });

  // =====================
  // x-hub Request by Title
  ipcMain.handle(
    "sidework-window-xhub-request-by-title",
    async (event, url, headers) => {
      if (winSidework === null || winSidework?.isDestroyed()) {
        winSidework = await createSideworkWindow(winSidework);
      }
      winSidework.loadURL(url);
      winSidework.on("closed", () => {
        winSidework = null;
      });

      let dom: string | null = null;

      return await new Promise((resolve, reject) => {
        winSidework?.webContents.on("dom-ready", async () => {
          dom = await winSidework?.webContents.executeJavaScript(
            "document.body.innerHTML"
          );

          if (dom?.includes("This process is automatic.")) {
            setTimeout(async () => {
              winSidework?.close();
              resolve("");
            }, 20000);
          } else {
            const postResponseUrl =
              await winSidework?.webContents.executeJavaScript(
                `
              var promise = new Promise((resolve, reject) => {
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = () => {
                  if (xhr.readyState === 4 && xhr.status === 200) {
                    resolve(xhr.responseURL);
                  } else if (xhr.readyState === 4 && xhr.status !== 200) {
                    resolve("");
                  }
                }
                xhr.open('POST', '${url}', true);
                xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded; charset=UTF-8');
                xhr.send('request=${headers.requestIdentifier}');
              });
  
              promise;
            `
              );
            resolve(postResponseUrl);
          }
        });
      });
    }
  );
}
