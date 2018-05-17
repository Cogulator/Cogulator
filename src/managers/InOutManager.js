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
		fs.readFile(pth, function (err, data) {
			if (err) {
				alert("Could not read file at " + pth + ". Either does not exist or permissions do not allow.");
				throw err; 
			}
			
			callback(data.toString());
		});
    }
	
	
	//Only handles one directory level down right now
	newFile(pth, filename, text, callback) {
		if (!this.fileExists(pth)) fs.mkdirSync(pth);
		
		let fullPath = path.join(pth, filename);
		console.log("NEW FILE", fullPath);
		fs.open(fullPath, 'w', function (err, file) {
			if (err) throw err;
			fs.close(file);
			callback(fullPath, text);
		});
	}
	
	
	newDirectory(pth) {
		if (!this.fileExists(pth)) fs.mkdirSync(pth);
	}
	
	
	writeToFile(pth, text) {
		console.log("WRITE", pth, text);
		fs.writeFile(pth, text, (err) => {  
			if (err) throw err;
		});
	}
	
	
	appendToFile(pth, text, callback) {
		fs.appendFile(pth, text, function (err) {
		  if (err) throw err;
		  callback();
		});
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