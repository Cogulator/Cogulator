const fs = require('fs');
const trash = require('trash');
const http = require('http');

class InOutManager {
	
	makeDirectory(pth) {
		fs.mkdirSync(pth);
	}
	
	
	getDirectoryPaths(pth) {
		var directoryPaths = [{directory: '', directoryPath: pth, files:[]}];
		
		//figure out what the directories are, and get the .goms in the top level while your at it
		var files = fs.readdirSync(pth);
		files.forEach(file => {
			let filePath = path.join(pth, file);
			let stats = fs.lstatSync(filePath);
			if (stats.isDirectory()) directoryPaths.push({directory: file, directoryPath: filePath, files:[]});
			else if (stats.isFile() && this.isGOMS(file)) directoryPaths[0].files.push({file: file.split(".").shift(), filePath: filePath});
		});
		
		//get the .goms files in the directories found on the first iteration
		for (var i = 1; i < directoryPaths.length; i++) {
			files = fs.readdirSync(directoryPaths[i].directoryPath);
			files.forEach(file => {
				let filePath = path.join(directoryPaths[i].directoryPath, file);
				let stats = fs.lstatSync(filePath) 
				if (stats.isFile() && this.isGOMS(file)) directoryPaths[i].files.push({file: file.split(".").shift(), filePath: filePath});
			});
		}
		
		return directoryPaths;
	}
	
	
	//TODO: Error handling
	listFiles(pth) {
		var files = fs.readdirSync(pth);
		return files;
	}
	
	
	loadFile(pth, callback) {
		//console.log("LOAD", pth, callback);

		try {  
			var data = fs.readFileSync(pth, 'utf8');
			//console.log("LOADED", pth);
		} catch(err) {
			//alert("Could not read file at " + pth + ". Either the file does not exist or permissions do not allow for it to be opened.");
			dialog.showErrorBox("Could not open file.", "Could not read file at " + pth + ". Either the file does not exist or permissions do not allow for it to be opened.");
		}
		
		callback(data); 
    }
	
	
	//Only handles one directory level down right now
	newFile(pth, filename, text, callback) {
		if (!this.fileExists(pth)) fs.mkdirSync(pth);
		
		let fullPath = path.join(pth, filename);
		//console.log("NEW FILE", fullPath);
		
		try {  
			let file = fs.openSync(fullPath, 'w');
			fs.close(file);
		} catch(err) {
			console.log("CREATE ERROR", err);
			//alert("Could not create file at " + pth + ". This can be caused by permissions that do not allow for writing the file.");
			dialog.showErrorBox("Could not create file.", "Could not create file at " + pth + ". This can be caused by permissions that do not allow for writing the file.");

		}
		
		callback(fullPath, text);
	}
	
	
	newDirectory(pth) {
		if (!this.fileExists(pth)) fs.mkdirSync(pth);
	}
	
	
	writeToFile(pth, text, callback = 0) {
		//console.log("WRITE", pth);

		try {  
			fs.writeFileSync(pth, text);
		} catch(err) {
			console.log("SAVE ERROR", err);
			dialog.showErrorBox("Could not save.", "Could not save file at " + pth + ". This can be caused by permissions that do not allow for writing the file.");
			//alert("Could not save file at " + pth + ". This can be caused by permissions that do not allow for writing the file.");
		}
		
		if (typeof callback === 'function' && callback()) callback();
	}
	
	
	appendToFile(pth, text, callback) {		
		//console.log("APPND", pth, text, callback);
		
		try {  
			fs.appendFileSync(pth, text)
		} catch(err) {
			dialog.showErrorBox("Could not save.", "Could not save operator. Verify you have permission to write to " + pth);
			//alert("Could not save operator. Verify you have permission to write to " + pth);
		}
		
		callback();
	}
	
	
	deleteFile(pth) {
		trash(pth).then(() => {
			console.log('done');
		});
	}
	
	
	//get rid of this... not necessary
	fileExists(pth) {
		if (fs.existsSync(pth)) return true;
		return false;
	}
	
	
	isGOMS(fileName) {
		let suffix = fileName.split(".").pop();
		if (suffix == "goms") return true;
		return false;
	}
	
}


G.io = new InOutManager();