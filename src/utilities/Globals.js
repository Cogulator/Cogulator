// The renderer gets only this limited, validated API from preload. Node and
// Electron modules are intentionally unavailable in the page itself.
var fs = window.cogulator.files;
var path = window.cogulator.path;
var ipcRenderer = window.cogulator.ipc;
var os = window.cogulator.os;
var appWindow = window.cogulator.window;

class Globals {
	constructor() {}
}

var G = new Globals();
