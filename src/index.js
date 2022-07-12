

const electron = require('electron');
const { app, BrowserWindow, ipcMain, dialog, Menu, MenuItem } = require('electron'); 
const path = require('path');
const config = require('electron-json-config').factory();
const { setupTitlebar, attachTitlebarToWindow } = require ('custom-electron-titlebar/main');


// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
	
	
  if (require('os').type() == "Windows_NT") {
      setupTitlebar();
	  mainWindow = new BrowserWindow({width: 1200, 
								  height: 1000, 
                                  webPreferences: {nodeIntegration: true, 
                                                   contextIsolation: false,
                                                   preload: path.join(app.getAppPath(), 'src', 'preload.js')},
                                  titleBarStyle: 'hidden',
								  icon: path.join(__dirname, 'src/icons/png/64x64.png')});
      attachTitlebarToWindow(mainWindow);
  } else {
	  mainWindow = new BrowserWindow({width: 1200, 
								  height: 1000, 
                                  webPreferences: {nodeIntegration: true, 
                                                   contextIsolation: false},
								  titleBarStyle: 'hiddenInset',
								  icon: path.join(__dirname, 'src/icons/png/64x64.png')});
  }


  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // Custom menu using the code at the bottom of this file
  Menu.setApplicationMenu(menu);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);


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
    dialog.showErrorBox(error);
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


