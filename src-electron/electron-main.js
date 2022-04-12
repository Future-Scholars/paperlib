/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-var-requires */
import { app, BrowserWindow, nativeTheme, Menu, dialog } from 'electron';
import { initialize, enable } from '@electron/remote/main';
import path from 'path';
import os from 'os';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';

Store.initRenderer();
initialize();

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

try {
  if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(
      path.join(app.getPath('userData'), 'DevTools Extensions')
    );
  }
} catch (_) {}

let mainWindow;

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 1440,
    height: 860,
    minWidth: 1440,
    minHeight: 860,
    useContentSize: true,
    webPreferences: {
      contextIsolation: true,
      webSecurity: false,
      nodeIntegrationInWorker: true,
      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
    },
    frame: false,
    vibrancy: 'sidebar', // 'light', 'medium-light' etc
    visualEffectState: 'active', // 这个参数不加的话，鼠标离开应用程序其背景就会变成白色
  });

  enable(mainWindow.webContents);

  mainWindow.loadURL(process.env.APP_URL);

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    // mainWindow.webContents.on('devtools-opened', () => {
    //   mainWindow.webContents.closeDevTools();
    // });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on('blur', () => {
    mainWindow.webContents.send('window-lost-focus');
  });

  mainWindow.on('focus', () => {
    mainWindow.webContents.send('window-gained-focus');
  });

  setMainMenu();
}

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

function setMainMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // { role: 'appMenu' }
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              {
                label: 'Preference',
                accelerator: 'Cmd+,',
                click: () => {
                  mainWindow.webContents.send('preferenceShortcutClicked');
                },
              },
              {
                label: 'Check for Updates',
                click: () => {
                  autoUpdater
                    .checkForUpdates()
                    .then((results) => {
                      BrowserWindow.getFocusedWindow().webContents.send(
                        'log',
                        results
                      );
                    })
                    .catch((err) => {
                      BrowserWindow.getFocusedWindow().webContents.send(
                        'log',
                        err
                      );
                    });
                },
              },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          accelerator: 'Enter',
          click: () => {
            mainWindow.webContents.send('shortcutClicked-Enter');
          },
        },
        { type: 'separator' },
        {
          label: 'Copy Bibtex',
          accelerator: isMac ? 'cmd+shift+c' : 'ctrl+shift+c',
          click: () => {
            mainWindow.webContents.send('shortcutClicked-cmd-shift-c');
          },
        },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Scrape',
          accelerator: isMac ? 'cmd+r' : 'ctrl+r',
          click: () => {
            mainWindow.webContents.send('shortcutClicked-cmd-r');
          },
        },
        {
          label: 'Edit Metadata',
          accelerator: isMac ? 'cmd+e' : 'ctrl+e',
          click: () => {
            mainWindow.webContents.send('shortcutClicked-cmd-e');
          },
        },
        {
          label: 'Add Tag',
          accelerator: isMac ? 'cmd+t' : 'ctrl+t',
          click: () => {
            mainWindow.webContents.send('shortcutClicked-cmd-t');
          },
        },
        {
          label: 'Add to Folder',
          accelerator: isMac ? 'cmd+g' : 'ctrl+g',
          click: () => {
            mainWindow.webContents.send('shortcutClicked-cmd-g');
          },
        },
        {
          label: 'Add Note',
          accelerator: isMac ? 'cmd+n' : 'ctrl+n',
          click: () => {
            mainWindow.webContents.send('shortcutClicked-cmd-n');
          },
        },
        {
          label: 'Flag',
          accelerator: isMac ? 'cmd+f' : 'ctrl+f',
          click: () => {
            mainWindow.webContents.send('shortcutClicked-cmd-f');
          },
        },
        { type: 'separator' },
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac
          ? [
              { role: 'pasteAndMatchStyle' },
              { role: 'delete' },
              { role: 'selectAll' },
              { type: 'separator' },
              {
                label: 'Speech',
                submenu: [{ role: 'startSpeaking' }, { role: 'stopSpeaking' }],
              },
            ]
          : [{ role: 'delete' }, { type: 'separator' }, { role: 'selectAll' }]),
      ],
    },
    // { role: 'viewMenu' }
    {
      label: 'View',
      submenu: [
        {
          label: 'Preview',
          accelerator: 'Space',
          click: () => {
            mainWindow.webContents.send('shortcutClicked-Space');
          },
        },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' },
      ],
    },
    // { role: 'windowMenu' }
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac
          ? [
              { type: 'separator' },
              { role: 'front' },
              { type: 'separator' },
              { role: 'window' },
            ]
          : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://paperlib.app/en/blog/intro/');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const deeplinkingUrl = argv.find((arg) => arg.startsWith('paperlib://'));

    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();

      BrowserWindow.getFocusedWindow().webContents.send(
        'pluginURL',
        deeplinkingUrl
      );
    }
  });

  app.whenReady().then(() => {
    createWindow();
  });

  app.on('open-url', (event, url) => {
    if (url.startsWith('paperlib://')) {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        BrowserWindow.getFocusedWindow().webContents.send('pluginURL', url);
      }
    }
  });
}

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('paperlib', process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient('paperlib');
}

autoUpdater.checkForUpdates();

autoUpdater.on('checking-for-update', () => {
  BrowserWindow.getFocusedWindow().webContents.send(
    'log',
    'Checking for update...'
  );
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
autoUpdater.on('update-available', async () => {
  BrowserWindow.getFocusedWindow().webContents.send(
    'log',
    'Avaliable update...'
  );
  const dialogOpts = {
    type: 'info',
    buttons: ['Close'],
    title: 'A new version of PaperLib is available',
    message: 'A new version of PaperLib is available',
    detail: 'It is downloading and will notify you when it is ready.',
  };
  await dialog.showMessageBox(dialogOpts);
});

autoUpdater.on('update-not-available', () => {
  BrowserWindow.getFocusedWindow().webContents.send('log', 'No update...');
});

autoUpdater.on('error', (error) => {
  BrowserWindow.getFocusedWindow().webContents.send('log', error);
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
autoUpdater.on('update-downloaded', async (info) => {
  BrowserWindow.getFocusedWindow().webContents.send('log', info);

  if (!info.releaseNotes) {
    info.releaseNotes = '';
  }

  if (!info.version) {
    info.version = '';
  }

  const dialogOpts = {
    type: 'info',
    buttons: ['Update Now', 'Cancel'],
    title: `A new version ${info.version} of PaperLib is automatically downloaded.`,
    message: `A new version ${info.version} of PaperLib is automatically downloaded.`,
    detail: `${info.releaseNotes}`,
  };

  const response = await dialog.showMessageBox(dialogOpts);
  if (response.response === 0) {
    autoUpdater.quitAndInstall();
  }
});
