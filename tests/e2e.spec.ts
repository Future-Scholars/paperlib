/// <reference lib="dom"/>
import { ElectronApplication, _electron as electron } from "playwright";
import { afterAll, beforeAll, expect, test } from 'vitest';


let electronApp: ElectronApplication;

beforeAll(async () => {
  process.env.NODE_ENV = 'vitest';
  electronApp = await electron.launch({ args: ['.'] });
}, 200000);

afterAll(async () => {
  const page = await electronApp.firstWindow()
  await page.locator('#list-view-btn').click()
  const e = await (page.locator("#dev-btn-bar")).elementHandle()
  await e?.evaluate((e) => {
    e.style.display = "flex"
  })
  await page.locator('#dev-delete-all-btn').click();
  await page.waitForTimeout(1000)

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

test('Presetting Language', async () => {
  const page = await electronApp.firstWindow()
  await page.waitForTimeout(1000)
  if (await page.isVisible("#presetting-lang-view")) {
    await page.locator('#presetting-lang-continue-btn').click();
    await page.waitForSelector('#presetting-lang-view', { state: 'hidden' })
  }
})

test('Presetting DB', async () => {
  const page = await electronApp.firstWindow()

  await page.waitForTimeout(1000)
  if (await page.isVisible("#presetting-db-view")) {
    await page.locator('#presetting-db-continue-btn').click();
    await page.waitForSelector('#presetting-db-view', { state: 'hidden' })
  }
})

test('Presetting Scraper', async () => {
  const page = await electronApp.firstWindow()

  await page.waitForTimeout(1000)
  if (await page.isVisible("#presetting-scraper-view")) {

    const scrapersSelect = page.locator('#presetting-scrapers-preset-select')
    await scrapersSelect.selectOption({ label: 'Computer Science' })

    await page.locator('#presetting-scraper-continue-btn').click();
    await page.waitForSelector('#presetting-scraper-view', { state: 'hidden' })
  }
})



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
  await page.waitForTimeout(4000)

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

}, 10000)

test('Rating Paper', async () => {
  const page = await electronApp.firstWindow()

  const dataview = page.locator('#list-data-view').first()
  const paperItem = dataview.locator('div').first()
  await paperItem.click()

  await page.locator('#rating-3-btn').click();

  const dataTextList = await dataview.allInnerTexts()
  const targetText =
    'Balanced Meta-Softmax for Long-Tailed Visual Recognition.\n' +
    'Jiawei Ren, Cunjun Yu, Shunan Sheng, Xiao Ma, Haiyu Zhao, Shuai Yi, Hongsheng Li\n' +
    '2020\n' +
    '|\n' +
    'Conference on Neural Information Processing Systems (NeurIPS)\n' +
    '|'
  expect(dataTextList[0]).toBe(targetText)
})

test('Edit Paper', async () => {
  const page = await electronApp.firstWindow()

  const dataview = page.locator('#list-data-view').first()
  const paperItem = dataview.locator('div').first()
  await paperItem.click()

  await page.locator('#edit-selected-btn').click();
  await page.waitForSelector('#paper-edit-view', { state: 'visible' })

  await page.locator('#paper-edit-view-author-input > input').fill('abc')
  await page.locator('#paper-edit-view-publication-input > input').fill('arxiv')
  await page.locator('#paper-edit-view-save-btn').click();

  const dataTextList = await dataview.allInnerTexts()
  const targetText =
    'Balanced Meta-Softmax for Long-Tailed Visual Recognition.\n' +
    'abc\n' +
    '2020\n' +
    '|\n' +
    'arxiv\n' +
    '|'
  expect(dataTextList[0]).toBe(targetText)
})

test('Scrape Paper', async () => {
  const page = await electronApp.firstWindow()

  const dataview = page.locator('#list-data-view').first()
  const paperItem = dataview.locator('div').first()
  await paperItem.click()

  await page.locator('#scrape-selected-btn').click();
  await page.waitForTimeout(5000)

  const dataTextList = await dataview.allInnerTexts()
  const targetText =
    'Balanced Meta-Softmax for Long-Tailed Visual Recognition.\n' +
    'Jiawei Ren, Cunjun Yu, Shunan Sheng, Xiao Ma, Haiyu Zhao, Shuai Yi, Hongsheng Li\n' +
    '2020\n' +
    '|\n' +
    'Conference on Neural Information Processing Systems (NeurIPS)\n' +
    '|'
  expect(dataTextList[0]).toBe(targetText)
}, 10000)

test('Delete Paper', async () => {
  const page = await electronApp.firstWindow()

  const dataview = page.locator('#list-data-view').first()
  const paperItem = dataview.locator('div').first()
  await paperItem.click()
  await page.waitForTimeout(1000)

  await page.locator('#delete-selected-btn').click();
  await page.waitForTimeout(1000)
  await page.locator('#delete-confirm-btn').click();
  await page.waitForTimeout(1000)

  const dataviewHeight = (await dataview.boundingBox())?.height
  expect(dataviewHeight).toBe(0)

})

test('Import Multiple PDFs', async () => {
  const page = await electronApp.firstWindow()

  const e = await (page.locator("#dev-btn-bar")).elementHandle()
  await e?.evaluate((e) => {
    e.style.display = "flex"
  })

  await page.locator('#dev-add-two-test-data-btn').click();
  await page.waitForTimeout(4000)

  const dataview = page.locator('#list-data-view').first()
  const dataviewHeightBeforeSearch = (await dataview.boundingBox())?.height
  expect(dataviewHeightBeforeSearch).toBe(128)

}, 10000)

test('Sort', async () => {
  const page = await electronApp.firstWindow()

  await page.locator('#list-view-btn').click()
  await page.locator('#sort-menu-btn').click()
  await page.locator('#sort-asce-btn').click()
  await page.waitForTimeout(1000)

  const dataview = page.locator('#list-data-view').first()
  const asceTranslate = await dataview.locator('div').first().locator('div').first().evaluate((e) => e.style.transform)

  await page.locator('#sort-menu-btn').click()
  await page.locator('#sort-desc-btn').click()
  await page.waitForTimeout(1000)

  const descTranslate = await dataview.locator('div').first().locator('div').first().evaluate((e) => e.style.transform)

  expect(asceTranslate !== descTranslate).toBeTruthy()

}, 5000)

test('Flag Paper and Filter by Flag', async () => {
  const page = await electronApp.firstWindow()
  const dataview = page.locator('#list-data-view').first()

  const dataviewHeightBeforeFilter = (await dataview.boundingBox())?.height
  expect(dataviewHeightBeforeFilter).toBe(128)

  const paperItem = dataview.locator('div').first()
  await paperItem.click()

  await page.locator('#flag-selected-btn').click();
  await page.locator('#sidebar-flag-section').click()
  await page.waitForTimeout(1000)

  const dataviewHeightAfterFilter = (await dataview.boundingBox())?.height
  expect(dataviewHeightAfterFilter).toBe(64)

  await page.locator('#sidebar-library-section').click()
  await page.waitForTimeout(1000)

  const dataviewHeightRestore = (await dataview.boundingBox())?.height
  expect(dataviewHeightRestore).toBe(128)
})

test('Tag Paper and Filter by Tag', async () => {
  const page = await electronApp.firstWindow()

  const dataview = page.locator('#list-data-view').first()
  const paperItem = dataview.locator('div').first()
  await paperItem.click()

  await page.locator('#edit-selected-btn').click();
  await page.waitForSelector('#paper-edit-view', { state: 'visible' })

  await page.locator('#paper-edit-view-tags-input input').fill('test1')
  await page.keyboard.press('Enter')
  await page.locator('#paper-edit-view-save-btn').click();
  await page.waitForTimeout(1000)

  const tagInDetail = await page.locator('#detail-tag-section > div').count()
  expect(tagInDetail).toBe(2)

  await page.locator('.sidebar-tag-item').first().click()
  await page.waitForTimeout(1000)

  const dataviewHeightAfterFilter = (await dataview.boundingBox())?.height
  expect(dataviewHeightAfterFilter).toBe(64)

  await page.locator('#sidebar-library-section').click()
  await page.waitForTimeout(1000)

  const dataviewHeightRestore = (await dataview.boundingBox())?.height
  expect(dataviewHeightRestore).toBe(128)

}, 10000)

test('General Search', async () => {
  const page = await electronApp.firstWindow()

  const dataview = page.locator('#list-data-view').first()
  await page.locator('#search-input > input').fill('correlation')
  await page.waitForTimeout(1000)
  const dataviewHeightAfterSearch = (await dataview.boundingBox())?.height
  expect(dataviewHeightAfterSearch).toBe(64)

}, 10000)

test('Fulltext Search', async () => {
  const page = await electronApp.firstWindow()

  await page.locator('#search-clear-btn').click()
  await page.waitForTimeout(1000)

  const dataview = page.locator('#list-data-view').first()
  const dataviewHeightBeforeSearch = (await dataview.boundingBox())?.height
  expect(dataviewHeightBeforeSearch).toBe(128)

  await page.locator('#search-input > button').click()
  await page.waitForTimeout(1000)
  await page.locator('#search-input > input').fill('CCA')
  await page.waitForTimeout(1000)
  const dataviewHeightAfterSearch = (await dataview.boundingBox())?.height
  expect(dataviewHeightAfterSearch).toBe(64)

}, 10000)

test('Advanced Search', async () => {
  const page = await electronApp.firstWindow()

  await page.locator('#search-clear-btn').click()
  await page.waitForTimeout(1000)

  const dataview = page.locator('#list-data-view').first()
  const dataviewHeightBeforeSearch = (await dataview.boundingBox())?.height
  expect(dataviewHeightBeforeSearch).toBe(128)

  await page.locator('#search-input > button').click()
  await page.locator('#search-input > input').focus()
  await page.waitForTimeout(1000)
  await page.locator('#search-input > input').fill(`pubTime == '2022'`)
  await page.waitForTimeout(1000)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1000)
  const dataviewHeightAfterSearch = (await dataview.boundingBox())?.height
  expect(dataviewHeightAfterSearch).toBe(64)

}, 10000)

test('List Table View', async () => {
  const page = await electronApp.firstWindow()

  await page.locator('#table-view-btn').click()
  await page.waitForTimeout(1000)
  await page.waitForSelector('#table-data-view', { state: 'visible' })

  await page.locator('#table-reader-view-btn').click()
  await page.waitForTimeout(1000)
  const dataview = page.locator('#table-data-view > .table-body').first()
  const paperItem = dataview.locator('div').nth(1)
  await paperItem.click()

  await page.waitForSelector('#table-reader-data-view', { state: 'visible' })

}, 10000)