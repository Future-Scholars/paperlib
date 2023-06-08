/// <reference lib="dom"/>
import { ElectronApplication, Page, _electron as electron } from "playwright";
import { afterAll, beforeAll, expect, test } from "vitest";

let electronApp: ElectronApplication;
let page: Page;

function testAndScreenshot(
  name: string,
  screenshotName: string,
  callback: () => Promise<void>
) {
  test(
    name,
    async () => {
      const screenshot = require("screenshot-desktop");
      await screenshot({
        filename: `./screenshots/${screenshotName}-before.jpg`,
      });

      try {
        await callback();
      } finally {
        await screenshot({
          filename: `./screenshots/${screenshotName}-after.jpg`,
        });
      }
    },
    100000
  );
}

beforeAll(async () => {
  process.env.NODE_ENV = "vitest";
  const fs = require("fs");
  if (!fs.existsSync("./screenshots")) {
    fs.mkdirSync("./screenshots");
  }
  const screenshot = require("screenshot-desktop");

  await screenshot({ filename: "./screenshots/launch-before.jpg" });

  electronApp = await electron.launch({ args: ["."] });
  page = await electronApp.firstWindow();

  await screenshot({ filename: "./screenshots/launch-after.jpg" });
}, 30000);

afterAll(async () => {
  await electronApp.close();
}, 30000);

test("Main Window State", async () => {
  const windowState: {
    isVisible: boolean;
    isDevToolsOpened: boolean;
    isCrashed: boolean;
  } = await electronApp.evaluate(({ BrowserWindow }) => {
    const mainWindow = BrowserWindow.getAllWindows()[0];

    const getState = () => ({
      isVisible: mainWindow.isVisible(),
      isDevToolsOpened: mainWindow.webContents.isDevToolsOpened(),
      isCrashed: mainWindow.webContents.isCrashed(),
    });

    return new Promise((resolve) => {
      if (mainWindow.isVisible()) {
        resolve(getState());
      } else
        mainWindow.once("ready-to-show", () =>
          setTimeout(() => resolve(getState()), 0)
        );
    });
  });

  expect(windowState.isCrashed, "The app has crashed").toBeFalsy();
  expect(windowState.isVisible, "The main window was not visible").toBeTruthy();
}, 10000);

testAndScreenshot("Loading Removed", "loading", async () => {
  await page.waitForSelector("#app-loading-wrap", { state: "hidden" });
});

testAndScreenshot("Try to Close Whats New", "whatsnew", async () => {
  if (await page.isVisible("#whats-new-view", { timeout: 2000 })) {
    await page.locator("#whats-new-close-btn").click();
    await page.waitForSelector("#whats-new-view", { state: "hidden" });
  }
});

testAndScreenshot("Presetting", "presetting", async () => {
  await page.waitForSelector("#presetting-lang-view", { state: "visible" });
  await page.locator("#presetting-lang-continue-btn").click();
  await page.waitForSelector("#presetting-lang-view", { state: "hidden" });

  await page.waitForSelector("#presetting-db-view", { state: "visible" });
  await page.locator("#presetting-db-continue-btn").click();
  await page.waitForSelector("#presetting-db-view", { state: "hidden" });

  await page.waitForSelector("#presetting-scraper-view", { state: "visible" });
  await page
    .locator("#presetting-scrapers-preset-select")
    .selectOption({ label: "Computer Science" });
  await page.locator("#presetting-scraper-continue-btn").click();
  await page.waitForSelector("#presetting-scraper-view", { state: "hidden" });
});

testAndScreenshot("Drag PDF to Import", "drag", async () => {
  await page.locator("#dev-add-test-data-btn").click();
  await page.waitForTimeout(5000);

  const dataview = page.locator("#list-data-view").first();
  const dataTextList = await dataview.allInnerTexts();

  expect(dataTextList.length).toBe(1);
  const targetText =
    "Balanced Meta-Softmax for Long-Tailed Visual Recognition.\n" +
    "Jiawei Ren, Cunjun Yu, Shunan Sheng, Xiao Ma, Haiyu Zhao, Shuai Yi, Hongsheng Li\n" +
    "2020\n" +
    "|\n" +
    "Conference on Neural Information Processing Systems (NeurIPS)";
  expect(dataTextList[0]).toBe(targetText);
});

testAndScreenshot("Rating Paper", "rating", async () => {
  const dataview = page.locator("#list-data-view").first();
  const paperItem = dataview.locator("div").first();
  await paperItem.click();

  await page.locator("#rating-3-btn").click();

  const dataTextList = await dataview.allInnerTexts();
  const targetText =
    "Balanced Meta-Softmax for Long-Tailed Visual Recognition.\n" +
    "Jiawei Ren, Cunjun Yu, Shunan Sheng, Xiao Ma, Haiyu Zhao, Shuai Yi, Hongsheng Li\n" +
    "2020\n" +
    "|\n" +
    "Conference on Neural Information Processing Systems (NeurIPS)\n" +
    "|";
  expect(dataTextList[0]).toBe(targetText);
});

testAndScreenshot("Edit Paper", "edit", async () => {
  const dataview = page.locator("#list-data-view").first();
  const paperItem = dataview.locator("div").first();
  await paperItem.click();

  await page.locator("#edit-selected-btn").click();
  await page.waitForSelector("#paper-edit-view", { state: "visible" });

  await page.locator("#paper-edit-view-author-input > input").fill("abc");
  await page
    .locator("#paper-edit-view-publication-input > input")
    .fill("arxiv");
  await page.locator("#paper-edit-view-save-btn").click();

  await page.waitForSelector("#paper-edit-view", { state: "hidden" });
  await page.waitForTimeout(1000);

  const dataTextList = await dataview.allInnerTexts();
  const targetText =
    "Balanced Meta-Softmax for Long-Tailed Visual Recognition.\n" +
    "abc\n" +
    "2020\n" +
    "|\n" +
    "arxiv\n" +
    "|";
  expect(dataTextList[0]).toBe(targetText);
});

testAndScreenshot("Scrape Paper", "scrape", async () => {
  const dataview = page.locator("#list-data-view").first();
  const paperItem = dataview.locator("div").first();
  await paperItem.click();

  await page.locator("#scrape-selected-btn").click();
  await page.waitForTimeout(5000);

  const dataTextList = await dataview.allInnerTexts();
  const targetText =
    "Balanced Meta-Softmax for Long-Tailed Visual Recognition.\n" +
    "Jiawei Ren, Cunjun Yu, Shunan Sheng, Xiao Ma, Haiyu Zhao, Shuai Yi, Hongsheng Li\n" +
    "2020\n" +
    "|\n" +
    "Conference on Neural Information Processing Systems (NeurIPS)\n" +
    "|";
  expect(dataTextList[0]).toBe(targetText);
});

testAndScreenshot("Delete Paper", "delete", async () => {
  const dataview = page.locator("#list-data-view").first();
  const paperItem = dataview.locator("div").first();
  await paperItem.click();
  await page.waitForTimeout(1000);

  await page.locator("#delete-selected-btn").click();
  await page.waitForTimeout(1000);
  await page.locator("#delete-confirm-btn").click();
  await page.waitForTimeout(1000);

  const dataviewHeight = (await dataview.boundingBox())?.height;
  expect(dataviewHeight).toBe(0);
});

testAndScreenshot("Import Multiple PDFs", "drag-multi", async () => {
  await page.locator("#dev-add-two-test-data-btn").click();
  await page.waitForTimeout(5000);

  const dataview = page.locator("#list-data-view").first();
  const dataviewHeight = (await dataview.boundingBox())?.height;
  expect(dataviewHeight).toBe(128);
});

testAndScreenshot("Sort", "sort", async () => {
  if (await page.locator("#win-more-menu-btn").isVisible()) {
    await page.locator("#win-more-menu-btn").click();
  }
  await page.locator("#list-view-btn").click();

  await page.locator("#sort-menu-btn").click();
  await page.locator("#sort-asce-btn").click();
  await page.waitForTimeout(1000);

  const dataview = page.locator("#list-data-view").first();
  const asceTranslate = await dataview
    .locator("div")
    .first()
    .locator("div")
    .first()
    .evaluate((e) => e.style.transform);

  await page.locator("#sort-menu-btn").click();
  await page.locator("#sort-desc-btn").click();
  await page.waitForTimeout(1000);

  const descTranslate = await dataview
    .locator("div")
    .first()
    .locator("div")
    .first()
    .evaluate((e) => e.style.transform);

  expect(asceTranslate !== descTranslate).toBeTruthy();
});

testAndScreenshot("Flag Paper and Filter by Flag", "flag", async () => {
  const dataview = page.locator("#list-data-view").first();

  const dataviewHeightBeforeFilter = (await dataview.boundingBox())?.height;
  expect(dataviewHeightBeforeFilter).toBe(128);

  const paperItem = dataview.locator("div").first();
  await paperItem.click();

  await page.locator("#flag-selected-btn").click();
  await page.locator("#sidebar-flag-section").click();
  await page.waitForTimeout(1000);

  const dataviewHeightAfterFilter = (await dataview.boundingBox())?.height;
  expect(dataviewHeightAfterFilter).toBe(64);

  await page.locator("#sidebar-library-section").click();
  await page.waitForTimeout(1000);

  const dataviewHeightRestore = (await dataview.boundingBox())?.height;
  expect(dataviewHeightRestore).toBe(128);
});

testAndScreenshot("Tag Paper and Filter by Tag", "tag", async () => {
  const dataview = page.locator("#list-data-view").first();
  const paperItem = dataview.locator("div").first();
  await paperItem.click();

  await page.locator("#edit-selected-btn").click();
  await page.waitForSelector("#paper-edit-view", { state: "visible" });

  await page.locator("#paper-edit-view-tags-input input").fill("test1");
  await page.keyboard.press("Enter");
  await page.locator("#paper-edit-view-save-btn").click();
  await page.waitForTimeout(1000);

  const tagInDetail = await page.locator("#detail-tag-section > div").count();
  expect(tagInDetail).toBe(2);

  await page.locator(".sidebar-tag-item").first().click();
  await page.waitForTimeout(1000);

  const dataviewHeightAfterFilter = (await dataview.boundingBox())?.height;
  expect(dataviewHeightAfterFilter).toBe(64);

  await page.locator("#sidebar-library-section").click();
  await page.waitForTimeout(1000);

  const dataviewHeightRestore = (await dataview.boundingBox())?.height;
  expect(dataviewHeightRestore).toBe(128);
});

testAndScreenshot("General Search", "general-search", async () => {
  await page.locator("#search-clear-btn").click();
  await page.waitForTimeout(1000);

  const dataview = page.locator("#list-data-view").first();
  await page.locator("#search-input > input").fill("correlation");
  await page.waitForTimeout(1000);
  const dataviewHeightAfterSearch = (await dataview.boundingBox())?.height;
  expect(dataviewHeightAfterSearch).toBe(64);
  await page.locator("#search-input > input").fill("");
});

testAndScreenshot("Fulltext Search", "fulltext-search", async () => {
  await page.locator("#search-clear-btn").click();
  await page.waitForTimeout(1000);

  const dataview = page.locator("#list-data-view").first();
  const dataviewHeightBeforeSearch = (await dataview.boundingBox())?.height;
  expect(dataviewHeightBeforeSearch).toBe(128);

  await page.locator("#search-input > button").click();
  await page.waitForTimeout(1000);
  await page.locator("#search-input > input").fill("CCA");
  await page.waitForTimeout(1000);
  const dataviewHeightAfterSearch = (await dataview.boundingBox())?.height;
  expect(dataviewHeightAfterSearch).toBe(64);
  await page.locator("#search-input > input").fill("");
});

testAndScreenshot("Advanced Search", "advanced-search", async () => {
  await page.locator("#search-clear-btn").click();
  await page.waitForTimeout(1000);

  const dataview = page.locator("#list-data-view").first();
  const dataviewHeightBeforeSearch = (await dataview.boundingBox())?.height;
  expect(dataviewHeightBeforeSearch).toBe(128);

  await page.locator("#search-input > button").click();
  await page.locator("#search-input > input").focus();
  await page.waitForTimeout(1000);
  await page.locator("#search-input > input").fill(`pubTime == '2022'`);
  await page.waitForTimeout(1000);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  const dataviewHeightAfterSearch = (await dataview.boundingBox())?.height;
  expect(dataviewHeightAfterSearch).toBe(64);

  await page.locator("#search-input > input").fill("");
});

testAndScreenshot("List Table View", "list-table-view", async () => {
  if (await page.locator("#win-more-menu-btn").isVisible()) {
    await page.locator("#win-more-menu-btn").click();
  }
  await page.locator("#table-view-btn").click();
  await page.waitForTimeout(1000);
  await page.waitForSelector("#table-data-view", { state: "visible" });

  if (await page.locator("#win-more-menu-btn").isVisible()) {
    await page.locator("#win-more-menu-btn").click();
  }
  await page.locator("#table-reader-view-btn").click();
  await page.waitForTimeout(1000);
  const dataview = page.locator("#table-data-view > .table-body").first();
  const paperItem = dataview.locator("div").nth(1);
  await paperItem.click();

  await page.waitForSelector("#table-reader-data-view", { state: "visible" });
});
