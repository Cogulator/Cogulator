const electron = require('electron');
const { BrowserWindow } = require('electron');
const path = require('path');
const {ipcRenderer} = require('electron');

class Globals {
	constructor() {}
}

var G = new Globals();