import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import fs from 'fs';
import { registerIpcHandlers } from './ipcHandlers';
import { systemService } from './services/systemService';
import { secureStorage } from './services/secureStorage';
import { sshConfigManager } from './services/sshConfigManager';
import { logger } from './services/loggerService';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

/**
 * Configure Windows Startup (Auto-start on laptop boot)
 */
function configureAutoStart(): void {
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
      path: process.execPath,
      args: ['--hidden'],
    });
    logger.info('Windows auto-start on boot registered successfully.', 'MainProcess');
  } catch (err: any) {
    logger.warn(`Failed to configure auto-start: ${err.message}`, 'MainProcess');
  }
}

/**
 * Helper to resolve the application icon path across dev & prod environments
 */
function getAppIconPath(): string {
  const candidates = [
    path.join(__dirname, '../../resources/icon.png'),
    path.join(__dirname, '../../src/renderer/public/icon.png'),
    path.join(__dirname, '../../dist/icon.png'),
    path.join(app.getAppPath(), 'resources/icon.png'),
    path.join(app.getAppPath(), 'dist/icon.png'),
    path.join(process.resourcesPath, 'icon.png'),
    path.join(process.resourcesPath, 'resources/icon.png'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return '';
}

/**
 * Create System Tray Icon for silent background operation
 */
function createSystemTray(): void {
  try {
    const iconPath = getAppIconPath();
    let icon: nativeImage;

    if (iconPath && fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    } else {
      icon = nativeImage.createFromNamedImage('NSStatusAvailable', [16, 16]);
    }

    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open GitIdentity',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createWindow();
          }
        },
      },
      {
        label: 'Auto-Start on Boot',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (item) => {
          app.setLoginItemSettings({
            openAtLogin: item.checked,
            openAsHidden: item.checked,
          });
        },
      },
      { type: 'separator' },
      {
        label: 'Exit GitIdentity',
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip('GitIdentity — Active SSH Multi-Account Router');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      } else {
        createWindow();
      }
    });

    logger.info('System Tray created successfully.', 'MainProcess');
  } catch (e) {
    logger.warn('System tray creation note: ' + e);
  }
}

function createWindow(): void {
  logger.info('Creating Electron main window...', 'MainProcess');

  const iconPath = getAppIconPath();
  const windowIcon = iconPath && fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined;

  const isHiddenBoot = process.argv.includes('--hidden');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 950,
    minHeight: 650,
    backgroundColor: '#080B12',
    title: 'GitIdentity',
    icon: windowIcon,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../../dist-electron/preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  // Reveal window smoothly once DOM is rendered and ready
  mainWindow.once('ready-to-show', () => {
    if (!isHiddenBoot && mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // In production build, dist/index.html is at ../../dist/index.html relative to dist-electron/main
    const prodHtmlPath = path.join(__dirname, '../../dist/index.html');
    const fallbackHtmlPath = path.join(__dirname, '../renderer/index.html');

    if (fs.existsSync(prodHtmlPath)) {
      mainWindow.loadFile(prodHtmlPath);
    } else if (fs.existsSync(fallbackHtmlPath)) {
      mainWindow.loadFile(fallbackHtmlPath);
    } else {
      mainWindow.loadFile(path.join(app.getAppPath(), 'dist/index.html'));
    }
  }

  // Hide to System Tray when close button (X) is clicked instead of quitting
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      if (mainWindow) mainWindow.hide();
      logger.info('Main window hidden to System Tray.', 'MainProcess');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  registerIpcHandlers();
  
  // Clean global fallback git identity to prevent wrong-account leaks
  await systemService.cleanGlobalGitConfig();

  // Sync SSH config and Git includeIf rules for all saved accounts
  const accounts = secureStorage.getAccounts();
  if (accounts.length > 0) {
    sshConfigManager.syncAccounts(accounts);
  }

  // Configure auto-start on Windows boot
  configureAutoStart();

  createWindow();
  createSystemTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});
