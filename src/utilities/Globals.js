const electron = require('electron');
const remote = require('electron').remote;
const app = remote.app;
const path = require('path');
const dialog = require('electron').remote.dialog;
const {ipcRenderer} = require('electron');

class Globals {
	constructor() {}
}

var G = new Globals();