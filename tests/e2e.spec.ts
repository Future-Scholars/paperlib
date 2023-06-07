/// <reference lib="dom"/>
import { ElectronApplication, Page, _electron as electron } from "playwright";
import { afterAll, beforeAll, expect, test } from "vitest";

let electronApp: ElectronApplication;
let page: Page;

beforeAll(async () => {
  process.env.NODE_ENV = "vitest";
  electronApp = await electron.launch({ args: ["."] });
  page = await electronApp.firstWindow();
}, 200000);

afterAll(async () => {
  await electronApp.close();
}, 200000);

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
}, 100000);

test("Loading Removed in 10s", async () => {
  await page.waitForSelector("#app-loading-wrap", { state: "hidden" });
}, 100000);

test("Try to Close Whats New", async () => {
  if (await page.isVisible("#whats-new-view")) {
    await page.locator("#whats-new-close-btn").click({ force: true });
    await page.waitForSelector("#whats-new-view", { state: "detached" });
  }
}, 100000);

test("Presetting", async () => {
  await page.waitForSelector("#presetting-lang-view", { state: "visible" });
  await page.waitForSelector("#presetting-lang-continue-btn", {
    state: "visible",
  });
  await page.locator("#presetting-lang-continue-btn").click({ force: true });
  await page.waitForSelector("#presetting-lang-view", { state: "detached" });

  await page.waitForSelector("#presetting-db-view", { state: "visible" });
  await page.waitForSelector("#presetting-db-continue-btn", {
    state: "visible",
  });
  await page.locator("#presetting-db-continue-btn").click({ force: true });
  await page.waitForSelector("#presetting-db-view", { state: "detached" });

  await page.waitForSelector("#presetting-scraper-view", { state: "visible" });
  await page.waitForSelector("#presetting-scrapers-preset-select", {
    state: "visible",
  });
  const scrapersSelect = page.locator("#presetting-scrapers-preset-select");
  await scrapersSelect.selectOption({ label: "Computer Science" });
  await page.locator("#presetting-scraper-continue-btn").click({ force: true });
  await page.waitForSelector("#presetting-scraper-view", { state: "detached" });
}, 300000);

test("Drag PDF to Import", async () => {
  const e = await page.locator("#dev-btn-bar").elementHandle();
  await e?.evaluate((e) => {
    e.style.display = "flex";
  });

  await page.locator("#dev-add-test-data-btn").click({ force: true });
  await page.waitForTimeout(4000);

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
}, 100000);

test("Rating Paper", async () => {
  const dataview = page.locator("#list-data-view").first();
  const paperItem = dataview.locator("div").first();
  await paperItem.click({ force: true });

  await page.locator("#rating-3-btn").click({ force: true });

  const dataTextList = await dataview.allInnerTexts();
  const targetText =
    "Balanced Meta-Softmax for Long-Tailed Visual Recognition.\n" +
    "Jiawei Ren, Cunjun Yu, Shunan Sheng, Xiao Ma, Haiyu Zhao, Shuai Yi, Hongsheng Li\n" +
    "2020\n" +
    "|\n" +
    "Conference on Neural Information Processing Systems (NeurIPS)\n" +
    "|";
  expect(dataTextList[0]).toBe(targetText);
}, 100000);

test("Edit Paper", async () => {
  const dataview = page.locator("#list-data-view").first();
  const paperItem = dataview.locator("div").first();
  await paperItem.click({ force: true });

  await page.locator("#edit-selected-btn").click({ force: true });
  await page.waitForSelector("#paper-edit-view", { state: "visible" });

  await page.locator("#paper-edit-view-author-input > input").fill("abc");
  await page
    .locator("#paper-edit-view-publication-input > input")
    .fill("arxiv");
  await page.locator("#paper-edit-view-save-btn").click({ force: true });

  const dataTextList = await dataview.allInnerTexts();
  const targetText =
    "Balanced Meta-Softmax for Long-Tailed Visual Recognition.\n" +
    "abc\n" +
    "2020\n" +
    "|\n" +
    "arxiv\n" +
    "|";
  expect(dataTextList[0]).toBe(targetText);
}, 100000);

test("Scrape Paper", async () => {
  const dataview = page.locator("#list-data-view").first();
  const paperItem = dataview.locator("div").first();
  await paperItem.click({ force: true });

  await page.locator("#scrape-selected-btn").click({ force: true });
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
}, 100000);

test("Delete Paper", async () => {
  const dataview = page.locator("#list-data-view").first();
  const paperItem = dataview.locator("div").first();
  await paperItem.click({ force: true });
  await page.waitForTimeout(1000);

  await page.locator("#delete-selected-btn").click({ force: true });
  await page.waitForTimeout(1000);
  await page.locator("#delete-confirm-btn").click({ force: true });
  await page.waitForTimeout(1000);

  const dataviewHeight = (await dataview.boundingBox())?.height;
  expect(dataviewHeight).toBe(0);
}, 100000);

test("Import Multiple PDFs", async () => {
  const e = await page.locator("#dev-btn-bar").elementHandle();
  await e?.evaluate((e) => {
    e.style.display = "flex";
  });

  await page.locator("#dev-add-two-test-data-btn").click({ force: true });
  await page.waitForTimeout(4000);

  const dataview = page.locator("#list-data-view").first();
  const dataviewHeightBeforeSearch = (await dataview.boundingBox())?.height;
  expect(dataviewHeightBeforeSearch).toBe(128);
}, 100000);

test("Sort", async () => {
  if (await page.locator("#win-more-menu-btn").isVisible()) {
    await page.locator("#win-more-menu-btn").click({ force: true });
  }
  await page.locator("#list-view-btn").click({ force: true });
  await page.locator("#sort-menu-btn").click({ force: true });
  await page.locator("#sort-asce-btn").click({ force: true });
  await page.waitForTimeout(1000);

  const dataview = page.locator("#list-data-view").first();
  const asceTranslate = await dataview
    .locator("div")
    .first()
    .locator("div")
    .first()
    .evaluate((e) => e.style.transform);

  await page.locator("#sort-menu-btn").click({ force: true });
  await page.locator("#sort-desc-btn").click({ force: true });
  await page.waitForTimeout(1000);

  const descTranslate = await dataview
    .locator("div")
    .first()
    .locator("div")
    .first()
    .evaluate((e) => e.style.transform);

  expect(asceTranslate !== descTranslate).toBeTruthy();
}, 100000);

test("Flag Paper and Filter by Flag", async () => {
  const dataview = page.locator("#list-data-view").first();

  const dataviewHeightBeforeFilter = (await dataview.boundingBox())?.height;
  expect(dataviewHeightBeforeFilter).toBe(128);

  const paperItem = dataview.locator("div").first();
  await paperItem.click({ force: true });

  await page.locator("#flag-selected-btn").click({ force: true });
  await page.locator("#sidebar-flag-section").click({ force: true });
  await page.waitForTimeout(1000);

  const dataviewHeightAfterFilter = (await dataview.boundingBox())?.height;
  expect(dataviewHeightAfterFilter).toBe(64);

  await page.locator("#sidebar-library-section").click({ force: true });
  await page.waitForTimeout(1000);

  const dataviewHeightRestore = (await dataview.boundingBox())?.height;
  expect(dataviewHeightRestore).toBe(128);
}, 100000);

test("Tag Paper and Filter by Tag", async () => {
  const dataview = page.locator("#list-data-view").first();
  const paperItem = dataview.locator("div").first();
  await paperItem.click({ force: true });

  await page.locator("#edit-selected-btn").click({ force: true });
  await page.waitForSelector("#paper-edit-view", { state: "visible" });

  await page.locator("#paper-edit-view-tags-input input").fill("test1");
  await page.keyboard.press("Enter");
  await page.locator("#paper-edit-view-save-btn").click({ force: true });
  await page.waitForTimeout(1000);

  const tagInDetail = await page.locator("#detail-tag-section > div").count();
  expect(tagInDetail).toBe(2);

  await page.locator(".sidebar-tag-item").first().click({ force: true });
  await page.waitForTimeout(1000);

  const dataviewHeightAfterFilter = (await dataview.boundingBox())?.height;
  expect(dataviewHeightAfterFilter).toBe(64);

  await page.locator("#sidebar-library-section").click({ force: true });
  await page.waitForTimeout(1000);

  const dataviewHeightRestore = (await dataview.boundingBox())?.height;
  expect(dataviewHeightRestore).toBe(128);
}, 100000);

test("General Search", async () => {
  const dataview = page.locator("#list-data-view").first();
  await page.locator("#search-input > input").fill("correlation");
  await page.waitForTimeout(1000);
  const dataviewHeightAfterSearch = (await dataview.boundingBox())?.height;
  expect(dataviewHeightAfterSearch).toBe(64);
}, 100000);

test("Fulltext Search", async () => {
  await page.locator("#search-clear-btn").click({ force: true });
  await page.waitForTimeout(1000);

  const dataview = page.locator("#list-data-view").first();
  const dataviewHeightBeforeSearch = (await dataview.boundingBox())?.height;
  expect(dataviewHeightBeforeSearch).toBe(128);

  await page.locator("#search-input > button").click({ force: true });
  await page.waitForTimeout(1000);
  await page.locator("#search-input > input").fill("CCA");
  await page.waitForTimeout(1000);
  const dataviewHeightAfterSearch = (await dataview.boundingBox())?.height;
  expect(dataviewHeightAfterSearch).toBe(64);
}, 100000);

test("Advanced Search", async () => {
  await page.locator("#search-clear-btn").click({ force: true });
  await page.waitForTimeout(1000);

  const dataview = page.locator("#list-data-view").first();
  const dataviewHeightBeforeSearch = (await dataview.boundingBox())?.height;
  expect(dataviewHeightBeforeSearch).toBe(128);

  await page.locator("#search-input > button").click({ force: true });
  await page.locator("#search-input > input").focus();
  await page.waitForTimeout(1000);
  await page.locator("#search-input > input").fill(`pubTime == '2022'`);
  await page.waitForTimeout(1000);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  const dataviewHeightAfterSearch = (await dataview.boundingBox())?.height;
  expect(dataviewHeightAfterSearch).toBe(64);
}, 100000);

test("List Table View", async () => {
  if (await page.locator("#win-more-menu-btn").isVisible()) {
    await page.locator("#win-more-menu-btn").click({ force: true });
  }
  await page.locator("#table-view-btn").click({ force: true });
  await page.waitForTimeout(1000);
  await page.waitForSelector("#table-data-view", { state: "visible" });

  if (await page.locator("#win-more-menu-btn").isVisible()) {
    await page.locator("#win-more-menu-btn").click({ force: true });
  }
  await page.locator("#table-reader-view-btn").click({ force: true });
  await page.waitForTimeout(1000);
  const dataview = page.locator("#table-data-view > .table-body").first();
  const paperItem = dataview.locator("div").nth(1);
  await paperItem.click({ force: true });

  await page.waitForSelector("#table-reader-data-view", { state: "visible" });
}, 100000);
