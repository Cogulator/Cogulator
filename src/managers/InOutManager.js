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
			else if (stats.isFile() && this.isGOMS(file)) directoryPaths[0].files.push({file: file.replace('.goms',''), filePath: filePath});
		});
		
		//get the .goms files in the directories found on the first iteration
		for (var i = 1; i < directoryPaths.length; i++) {
			files = fs.readdirSync(directoryPaths[i].directoryPath);
			files.forEach(file => {
				let filePath = path.join(directoryPaths[i].directoryPath, file);
				let stats = fs.lstatSync(filePath);
				if (stats.isFile() && this.isGOMS(file)) directoryPaths[i].files.push({file: file.replace('.goms',''), filePath: filePath});
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
		if (this.pathExists(pth)) {
			try {  
				var data = fs.readFileSync(pth, 'utf8');
			} catch(err) {
				console.log("LOAD FILE");
				let error = "🐟 SORRY CHARLIE - Could not read file at " + pth + ". Either the file does not exist or permissions do not allow for it to be opened.";
				ipcRenderer.sendSync('dialog-error', error);
			}

			callback(data); 
		} else {
			let error = "🐟 SORRY CHARLIE - Could not find file at " + pth + ". Either the file does not exist or permissions do not allow for it to be opened.";
			ipcRenderer.sendSync('dialog-error', error);
		}
	}
	

	rename(sourcePth, targetPth) {
		fs.renameSync(sourcePth, targetPth);
	}
	
	
	copyFile(sourcePth, targetPth, callback) {
		try {
			const BUF_LENGTH = 64*1024;
			const buff = new Buffer(BUF_LENGTH);
			const fdr = fs.openSync(sourcePth, 'r');
			const fdw = fs.openSync(targetPth, 'w');
			let bytesRead = 1;
			let pos = 0;

			while (bytesRead > 0) {
				bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
				fs.writeSync(fdw,buff,0,bytesRead);
				pos += bytesRead;
			}

			fs.closeSync(fdr);
			fs.closeSync(fdw);
		} catch (err) {
			//dialog.showErrorBox("Could not copy file.", "Could not copy file at " + sourcePth + ". Either the file does not exist or permissions do not allow for it to be opened.");
            let error = "Could not copy file. Could not copy file at " + sourcePth + ". Either the file does not exist or permissions do not allow for it to be opened."
            ipcRenderer.sendSync('dialog-error', error);
		}

		callback(targetPth);
	}
	
	
	//Only handles one directory level down right now
	newFile(pth, filename, text, callback) {
		if (!this.pathExists(pth)) fs.mkdirSync(pth);
		let fullPath = path.join(pth, filename);
		
		try {  
			let file = fs.openSync(fullPath, 'w');
            fs.close(file, (err) => {
                if (err)
                    console.error('Failed to close file', err);
                else {
                    console.log("\n> File Closed successfully");
                }
            });
		} catch(err) {
            console.log("CREATE ERROR", err);
            //dialog.showErrorBox("Could not create file.", "Could not create file at " + pth + ". This can be caused by permissions that do not allow for writing the file.");
            let error = "Could not create file. Could not create file at " + pth + ". This can be caused by permissions that do not allow for writing the file."
            ipcRenderer.sendSync('dialog-error', error);
		}
		
		if (typeof callback === 'function') callback(fullPath, text);
	}
	
	
	newDirectory(pth) {
		if (!this.pathExists(pth)) fs.mkdirSync(pth);
	}
	
	
	writeToFile(pth, text, callback = 0) {
		try {  
			fs.writeFileSync(pth, text);
		} catch(err) {
			console.log("SAVE ERROR", err);
			//dialog.showErrorBox("Could not save.", "Could not save file at " + pth + ". This can be caused by permissions that do not allow for writing the file.");
            let error = "Could not save. Could not save file at " + pth + ". This can be caused by permissions that do not allow for writing the file."
            ipcRenderer.sendSync('dialog-error', error);
		}
		
		if (typeof callback === 'function') callback();
	}
	
	
	appendToFile(pth, text, callback) {			
		try {  
			fs.appendFileSync(pth, text)
		} catch(err) {
			//dialog.showErrorBox("Could not save.", "Could not save operator. Verify you have permission to write to " + pth);
            let error = "Could not save. Could not save operator. Verify you have permission to write to " + pth
            ipcRenderer.sendSync('dialog-error', error);
		}
		
		callback();
	}
	
	
	delete(pth, callback = 0) {
		trash(pth).then(() => {
			if (typeof callback === 'function') callback();
		});
	}
	
	
	pathExists(pth) {
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
