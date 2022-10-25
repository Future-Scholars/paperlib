/// <reference lib="dom"/>
import { ElectronApplication, _electron as electron } from "playwright";
import { afterAll, beforeAll, expect, test } from 'vitest';


let electronApp: ElectronApplication;

beforeAll(async () => {
  process.env.NODE_ENV = 'vitest';
  electronApp = await electron.launch({ args: ['.'] });
});

afterAll(async () => {
  await electronApp.close();
});

test('Main Window State', async () => {
  const windowState: { isVisible: boolean; isDevToolsOpened: boolean; isCrashed: boolean } =
    await electronApp.evaluate(({ BrowserWindow }) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];

      const getState = () => ({
        isVisible: mainWindow.isVisible(),
        isDevToolsOpened: mainWindow.webContents.isDevToolsOpened(),
        isCrashed: mainWindow.webContents.isCrashed(),
      });

      return new Promise(resolve => {
        if (mainWindow.isVisible()) {
          resolve(getState());
        } else mainWindow.once('ready-to-show', () => setTimeout(() => resolve(getState()), 0));
      });
    });

  expect(windowState.isCrashed, 'The app has crashed').toBeFalsy();
  expect(windowState.isVisible, 'The main window was not visible').toBeTruthy();

});

test('Try to Close Whats New', async () => {
  const page = await electronApp.firstWindow()

  if (await page.isVisible("#whats-new-view")) {
    await page.locator('#whats-new-close-btn').click();
    await page.waitForSelector('#whats-new-view', { state: 'hidden' })
  }
})

test('Loading Removed in 10s', async () => {
  const page = await electronApp.firstWindow()

  await page.waitForSelector('#app-loading-wrap', { state: 'hidden' })
}, 11000)

test('Drag PDF to Import', async () => {
  const page = await electronApp.firstWindow()

  const e = await (page.locator("#dev-btn-bar")).elementHandle()
  await e?.evaluate((e) => {
    e.style.display = "flex"
  })

  await page.locator('#dev-add-test-data-btn').click();
  await page.waitForTimeout(10000)

  const dataview = page.locator('#list-data-view').first()
  const dataTextList = await dataview.allInnerTexts()

  expect(dataTextList.length).toBe(1)
  const targetText =
    'Balanced Meta-Softmax for Long-Tailed Visual Recognition.\n' +
    'Jiawei Ren, Cunjun Yu, Shunan Sheng, Xiao Ma, Haiyu Zhao, Shuai Yi, Hongsheng Li\n' +
    '2020\n' +
    '|\n' +
    'Conference on Neural Information Processing Systems (NeurIPS)'
  expect(dataTextList[0]).toBe(targetText)

}, 11000)

