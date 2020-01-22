const electron = require('electron');
const { app, BrowserWindow } = require('electron');
const path = require('path');
require('update-electron-app')()

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
	  mainWindow = new BrowserWindow({width: 1200, 
								  height: 1000, 
								  frame: false,
								  titleBarStyle: 'hiddenInset',
                                  webPreferences: {nodeIntegration: true},
								  icon: path.join(__dirname, 'src/icons/png/64x64.png')});
  } else {
	  mainWindow = new BrowserWindow({width: 1200, 
								  height: 1000, 
                                webPreferences: {nodeIntegration: true},
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
  Menu.setApplicationMenu(menu)
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
const {Menu} = require('electron')
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
			}
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
