const { registerRagHandlers, validateGroqApiKey } = require('./ragHandler');
const electron = require('electron');
const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem } = require('electron'); 
const path = require('path');
const fs = require('fs');
const os = require('os');
const trash = require('trash').default;
const config = require('electron-json-config').factory();


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
const GROQ_KEY_CONFIG = 'groqApiKeyEncrypted';
const exportPathsByWebContentsId = new Map();

function getGroqApiKey() {
  const encryptedKey = config.get(GROQ_KEY_CONFIG);
  if (!encryptedKey || !electron.safeStorage.isEncryptionAvailable()) return null;

  try {
    return electron.safeStorage.decryptString(Buffer.from(encryptedKey, 'base64'));
  } catch (error) {
    console.warn('Unable to read the saved Groq API key.', error.message);
    return null;
  }
}

function setGroqApiKey(apiKey) {
  if (!electron.safeStorage.isEncryptionAvailable()) {
    throw new Error('Secure credential storage is unavailable on this computer.');
  }
  config.set(GROQ_KEY_CONFIG, electron.safeStorage.encryptString(apiKey).toString('base64'));
}

const createWindow = () => {	
	const webPreferences = {
		nodeIntegration: false,
		contextIsolation: true,
		sandbox: true,
		preload: path.join(app.getAppPath(), 'src', 'preload.js'),
	};
  if (require('os').type() == "Windows_NT") {
	  mainWindow = new BrowserWindow({width: 1200, 
								  height: 1000, 
								  webPreferences,
								  icon: path.join(__dirname, 'src/icons/png/64x64.png')});
  } else {
	  mainWindow = new BrowserWindow({width: 1200, 
								  height: 1000, 
								  webPreferences,
								  titleBarStyle: 'hiddenInset',
								  icon: path.join(__dirname, 'src/icons/png/64x64.png')});
  }


  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Cogulator is a local application. Do not let renderer content navigate to
  // another origin or create a privileged child window.
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow.webContents.getURL()) event.preventDefault();
  });

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // For handling LLM requests
  registerRagHandlers(mainWindow, getGroqApiKey);
  // Electron may have already torn down webContents by the time `closed` is
  // delivered (notably when the app is force-quit). Retain the identifier while
  // the window is alive instead of reading it during teardown.
  const webContentsId = mainWindow.webContents.id;

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    exportPathsByWebContentsId.delete(webContentsId);
    mainWindow = null;
  });

  // Custom menu using the code at the bottom of this file
  Menu.setApplicationMenu(menu);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

ipcMain.handle('groq-key-status', () => ({
  configured: Boolean(getGroqApiKey()),
  secureStorageAvailable: electron.safeStorage.isEncryptionAvailable(),
}));

ipcMain.handle('groq-key-save', async (_event, apiKey) => {
  const normalizedKey = String(apiKey || '').trim();
  await validateGroqApiKey(normalizedKey);
  setGroqApiKey(normalizedKey);
  return { configured: true };
});

ipcMain.handle('groq-key-remove', () => {
  config.delete(GROQ_KEY_CONFIG);
  return { configured: false };
});

ipcMain.handle('open-groq-console', () => {
  return electron.shell.openExternal('https://console.groq.com/keys');
});

ipcMain.handle('open-cogulator-folder', () => {
  const cogulatorPath = path.join(app.getPath('documents'), 'cogulator');
  return electron.shell.openPath(cogulatorPath);
});

ipcMain.handle('open-cogulator-website', () => electron.shell.openExternal('https://cogulator.io'));

const windowCommands = new Set(['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll']);
ipcMain.on('window-command', (event, command) => {
  if (!windowCommands.has(command)) throw new Error('Unsupported window command.');
  mainWindow.webContents[command]();
  event.returnValue = true;
});

ipcMain.on('window-is-fullscreen', (event) => {
  event.returnValue = mainWindow.isFullScreen();
});

ipcMain.on('window-set-fullscreen', (event, value) => {
  mainWindow.setFullScreen(Boolean(value));
  event.returnValue = true;
});

function managedRoots() {
  return [
    path.join(app.getPath('documents'), 'cogulator'),
    config.get('cogModelsPath'),
  ].filter(Boolean).map((root) => path.resolve(root));
}

function isManagedPath(candidate) {
  if (typeof candidate !== 'string') return false;
  const resolved = path.resolve(candidate);
  return managedRoots().some((root) => {
    const relative = path.relative(root, resolved);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  });
}

function assertManagedPath(candidate, { allowExportPath = false, event } = {}) {
  const resolved = typeof candidate === 'string' ? path.resolve(candidate) : null;
  const permittedExportPath = allowExportPath && exportPathsByWebContentsId.get(event?.sender?.id);
  if (!resolved || (!isManagedPath(resolved) && resolved !== permittedExportPath)) {
    throw new Error('Cogulator can only access its model folders and the file selected for export.');
  }
  return resolved;
}

const pathOperations = new Set(['basename', 'dirname', 'extname', 'join', 'resolve']);
ipcMain.on('path-operation', (event, operation, ...args) => {
  if (!pathOperations.has(operation) || !args.every((arg) => typeof arg === 'string')) {
    throw new Error('Unsupported path operation.');
  }
  event.returnValue = path[operation](...args);
});

ipcMain.on('platform-info', (event) => {
  event.returnValue = { type: os.type(), EOL: os.EOL, pathSeparator: path.sep };
});

ipcMain.on('file-operation', (event, operation, ...args) => {
  let result;
  switch (operation) {
    case 'mkdir':
      result = fs.mkdirSync(assertManagedPath(args[0]));
      break;
    case 'readdir':
      result = fs.readdirSync(assertManagedPath(args[0]));
      break;
    case 'stat': {
      const stat = fs.lstatSync(assertManagedPath(args[0]));
      result = { isDirectory: stat.isDirectory(), isFile: stat.isFile() };
      break;
    }
    case 'read':
      result = fs.readFileSync(assertManagedPath(args[0]), args[1]);
      break;
    case 'rename':
      result = fs.renameSync(assertManagedPath(args[0]), assertManagedPath(args[1]));
      break;
    case 'exists':
      result = isManagedPath(args[0]) && fs.existsSync(args[0]);
      break;
    case 'write':
      result = fs.writeFileSync(assertManagedPath(args[0], { allowExportPath: true, event }), args[1]);
      break;
    case 'append':
      result = fs.appendFileSync(assertManagedPath(args[0]), args[1]);
      break;
    case 'copy':
      if (!isManagedPath(args[0]) && path.extname(args[0]).toLowerCase() !== '.goms') {
        throw new Error('Only .goms files may be imported from outside Cogulator folders.');
      }
      result = fs.copyFileSync(args[0], assertManagedPath(args[1]));
      break;
    default:
      throw new Error('Unsupported file operation.');
  }
  event.returnValue = result;
});

ipcMain.handle('file-trash', async (event, target) => trash(assertManagedPath(target, { event })));


// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
	
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// Template and initialization of custom menu
const template = [
	{
		label: 'File',
		submenu: [
			{
				label: 'Save',
				accelerator: 'CmdOrCtrl+S',
				click () { mainWindow.webContents.send('File->Save') } //handled in modelmanager
			},
			{
				label: 'Export Model',
				click () { mainWindow.webContents.send('File->Export Model') } //handled in exportmanager
			},
			{
				label: 'Export Working Memory',
				click () { mainWindow.webContents.send('File->Export Working Memory') } //handled in exportmanager
			},
			{
				label: 'Open Cogulator Folder',
				click () { 
					let cogulatorPath = path.join(app.getPath('documents'), "cogulator");
					require('electron').shell.openExternal("file://" + cogulatorPath);
				}
			},
            {
				label: 'Change Models Folder',
				click () { 
                    let options = {properties:["openDirectory"]}
                    let dir = dialog.showOpenDialogSync(options); //returns an array evidently, if without "multiSelections"
                    if (dir == undefined || dir[0] == undefined) return;
                    config.set('cogModelsPath', dir[0]);
                    mainWindow.webContents.send('File->ChangeModelsDirectory');
                    
				}
			},
            {
				label: 'Use Default Models Folder',
				click () { 
                    let docPath = electron.app.getPath('documents');
                    var modelsPath = path.join(docPath, "cogulator");
                    modelsPath = path.join(modelsPath, "models");
                    config.set('cogModelsPath', modelsPath);
                    mainWindow.webContents.send('File->ChangeModelsDirectory');
				}
			}
		]
	},
	{
		label: 'Edit',
		submenu: [
            {
				role: 'undo'
			},
            {
				role: 'redo'
			},
			{
				type: 'separator'
			},
			{
				role: 'cut'
			},
			{
				role: 'copy'
			},
			{
				role: 'paste'
			},
			{
				role: 'pasteandmatchstyle'
			},
			{
				role: 'delete'
			},
			{
				role: 'selectall'
			},
            {
				type: 'separator'
			},
            {
				label: 'Find',
                accelerator: 'CmdOrCtrl+F',
				click () { mainWindow.webContents.send('Edit->Find') } //FinderCHI.js
			},
		]
	},
	{
		label: 'View',
		submenu: [
			{
				label: 'Reload',
				accelerator: 'CmdOrCtrl+R',
				click (item, focusedWindow) {
					if (focusedWindow) focusedWindow.reload()
				}
			},
			{
				label: 'Toggle Developer Tools',
				accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
				click (item, focusedWindow) {
					if (focusedWindow) focusedWindow.webContents.toggleDevTools()
				}
			},
			{
				type: 'separator'
			},
            {
                label: 'Light',
				click () { mainWindow.webContents.send('View->Light'); } //DarkLightManager.js
            },
            {
                label: 'Dark',
				click () { mainWindow.webContents.send('View->Dark'); } //DarkLightManager.js
            },
            {
				type: 'separator'
			},
			{
				role: 'resetzoom'
			},
			{
				role: 'zoomin'
			},
			{
				role: 'zoomout'
			},
			{
				type: 'separator'
			},
			{
				role: 'togglefullscreen'
			},
            {
				type: 'separator'
			},
            {
                label: 'Toggle Line Numbers',
				click () { mainWindow.webContents.send('View->Toggle Line Numbers'); }
            }
		]
	},
	{
		role: 'window',
		submenu: [
			{
				role: 'minimize'
			},
			{
				role: 'close'
			}
		]
	},
	{
		role: 'help',
		submenu: [
			{
				label: 'Quick Start',
				click () { mainWindow.webContents.send('Help->Quick Start') } //handled in HelpScreen.js
			},
			{
				label: 'Learn More',
				click () { require('electron').shell.openExternal('http://cogulator.io') }
			},
            {
                label: "Version: " + app.getVersion()
            }
		]
	}
]

if (process.platform === 'darwin') {
	const name = app.getName()
	template.unshift({
	label: name,
		submenu: [
			{
				role: 'about'
			},
			{
				type: 'separator'
			},
			{
				role: 'services',
				submenu: []
			},
			{
				type: 'separator'
			},
			{
				role: 'hide'
			},
			{
				role: 'hideothers'
			},
			{
				role: 'unhide'
			},
			{
				type: 'separator'
			},
			{
				role: 'quit'
			}
		]
	})
	// Edit menu.
	template[2].submenu.push(
		{
			type: 'separator'
		},
		{
			label: 'Speech',
			submenu: [
				{
				role: 'startspeaking'
				},
				{
				role: 'stopspeaking'
				}
			]
		}
	)
	// Window menu.
	template[4].submenu = [
		{
			label: 'Close',
			accelerator: 'CmdOrCtrl+W',
			role: 'close'
		},
		{
			label: 'Minimize',
			accelerator: 'CmdOrCtrl+M',
			role: 'minimize'
		},
		{
			label: 'Zoom',
			role: 'zoom'
		},
		{
			type: 'separator'
		},
		{
			label: 'Bring All to Front',
			role: 'front'
		}
	]
}

const menu = Menu.buildFromTemplate(template)



// -- SETTINGS CONTROLS ---------------------------------------------- //
if (config.get('darkMode') == undefined) config.set('darkMode', false);
if (config.get('sidebarWidth') == undefined) config.set('sidebarWidth', 190);
if (config.get('lineNumbers') == undefined) config.set('lineNumbers', false);
if (config.get('cogModelsPath') == undefined) {
    let docPath = electron.app.getPath('documents');
    var modelsPath = path.join(docPath, "cogulator");
    modelsPath = path.join(modelsPath, "models");
    config.set('cogModelsPath', modelsPath);
}

ipcMain.on('set-config', (event, key, value) => {
    config.set(key, value);
    event.returnValue = "setit";
});

ipcMain.on('get-config', (event, key) => {
    event.returnValue = config.get(key);
});


// -- GET DOCUMENTS & DESKTOP PATH ----------------------------------------------
ipcMain.on('read-documents-path', (event, args) => {
    event.returnValue = electron.app.getPath('documents');
});

ipcMain.on('read-desktop-path', (event, args) => {
    event.returnValue = electron.app.getPath('desktop');
});

ipcMain.on('read-models-path', (event, args) => {
    event.returnValue = config.get('cogModelsPath');
});


//-- DIALOG BOXES ----------------------------------------------
// Dialog Box for error
ipcMain.on('dialog-error', (event, error) => {
    dialog.showErrorBox("Error", error);
});

//Dialog box for confirming delete
ipcMain.on('dialog-delete-confirm', (event, name) => {
    const result = dialog.showMessageBoxSync(mainWindow, {
		type: 'question',
		buttons: ['Delete', 'Cancel'],
		defaultId: 0,
		message: `Are you sure you want to delete ${name}?`
	});
    
    event.returnValue = (result === 0);
});


//Dialog box for selecting path to export model or working memory trace
ipcMain.on('dialog-export-path', (event, name) => {
    var fullPath = dialog.showSaveDialogSync({
        defaultPath: '~/' + name,
        filters: [{
            name: 'Plain Text',
            extensions: ['txt']
        }]
    });
    
    console.log(">>>",fullPath,"<<<");
	if (fullPath) exportPathsByWebContentsId.set(event.sender.id, path.resolve(fullPath));
    event.returnValue = fullPath; //if cancel, this will return undefined
});


//-- CONTEXT MENUS ----------------------------------------------
//Builds a model context menu on demand for ModelsSidebar
ipcMain.on('model-context-menu', (event, path, name) => {
    var modelContextMenu = new Menu();
    modelContextMenu.append(new MenuItem({
        label: 'Duplicate Model',
        click: () => {
            mainWindow.webContents.send('Model->Duplicate', path);
        }
    }));
    modelContextMenu.append(new MenuItem({
        label: 'Rename Model',
        click: () => {
            mainWindow.webContents.send('Model->Rename', path, name);
        }
    }));
    modelContextMenu.append(new MenuItem({
        label: 'Delete Model',
        click: () => {
            const result = dialog.showMessageBoxSync(mainWindow, {
                type: 'question',
                buttons: ['Delete', 'Cancel'],
                defaultId: 0,
                message: `Are you sure you want to delete ${name}?`
            });
                        
            if (result == 0) { //if delete rather than cancel
                mainWindow.webContents.send('Model->Delete', path);
            } 
        }
    }));
    
    modelContextMenu.popup();
    event.returnValue = "";
});

//Builds a directory context menu on demand for ModelsSidebar
ipcMain.on('directory-context-menu', (event, path, name) => {
    var directoryContextMenu = new Menu();
    directoryContextMenu.append(new MenuItem({
        label: 'Rename Directory',
        click: () => {
            mainWindow.webContents.send('Directory->Rename', path, name);
        }
    }));
    directoryContextMenu.append(new MenuItem({
        label: 'Delete Directory',
        click: () => {
            const result = dialog.showMessageBoxSync(mainWindow, {
                type: 'question',
                buttons: ['Delete', 'Cancel'],
                defaultId: 0,
                message: `Are you sure you want to delete ${name}?`
            });
                        
            if (result == 0) { //if delete rather than cancel
                mainWindow.webContents.send('Directory->Delete', path);
            } 
        }
    }));
    
    directoryContextMenu.popup();
    event.returnValue = "";
});
