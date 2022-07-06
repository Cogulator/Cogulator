class ModelsManager {
	constructor() {
		this.update();
		this.selected = "";
        this.shutDownFunctions = [];
                		
		$( document ).on( "GOMS_Processed", function(evt, taskTimeMS) {
			G.modelsManager.saveModel();
		});
        
        $( document ).on( "Win32_Close_Button_Pressed", function(evt) {
			G.modelsManager.handleWindowsClose();
		});
		
		window.addEventListener('unload', function(event) {
			G.modelsManager.saveModel();
			G.modelsManager.deleteModels();
		})
		
		ipcRenderer.on('File->Save', (sender, arg) => {
			G.modelsManager.saveModel();
		})
        
        ipcRenderer.on('Model->Duplicate', (sender, path) => {
            G.modelsManager.duplicateModel(path);
        })
        
        ipcRenderer.on('Model->Delete', (sender, path) => {
            G.modelsManager.deleteModel(path);
        })
        
        ipcRenderer.on('Directory->Delete', (sender, path) => {
            G.modelsManager.deleteDirectory(path);
        })
	}
	
	
	update() {
		this.paths = G.io.getDirectoryPaths(G.paths.models);
		this.models = this.getModels();
	}


	/**
	 * Delete a directory and everything in it.
	 * @param {String} fullPath Full path to the directory.
	 */
	deleteDirectory(fullPath) {
		G.io.delete(fullPath, () => {
			G.modelsManager.update();
		
			// If a model was selecetd in this directory, select first model in list just so something is selected.
			if (this.selected.startsWith(`${fullPath}${path.sep}`)) G.modelsManager.selectDefaultModel();
		});
	}

    
    /**
	 * Select a default model (first in list).  Used when directory is deleted or models folder changed.
	 */
    selectDefaultModel() {
        this.selected = this.models[0].filePath;
        G.modelsManager.setLastOpened();
        G.modelsManager.loadModel(this.selected);
        G.modelsSidebar.buildSideBar();
    }


	/**
	 * Rename a directory.
	 * @param {String} fullPath Full path to the directory.
	 * @param {String} newName New name for the directory.
	 */
	renameDirectory(fullPath, newName) {
		// At the very minimum, name should not contain slashes or spaces.
		const resolvedName = newName.replace(/\//g, "_").replace(/\\/g, "_").replace(/ /g, "_").trim();

		// If new name is blank, don't do anything.
		if (!resolvedName) {
			return;
		}

		const directory = path.dirname(fullPath);
		let newPath = path.join(directory, resolvedName);

		// If new path is same as old path, don't do anything.
		if (newPath === fullPath) {
			return;
		}

		// If desired path exists, add a number to it so it doesn't error or overwrite anything.
		// Loop until we find a directory name that doesn't exist.
		let counter = 0;
		while (G.io.pathExists(newPath)) {
			counter += 1;
			newPath = path.join(directory, `${resolvedName}_${counter}`)
		}

		G.io.rename(fullPath, newPath);
		G.modelsManager.update();

		// If a model in this directory was selected, select it again under the new directory name.
		if (this.selected.startsWith(`${fullPath}${path.sep}`)) {
			const newModelPath = path.join(newPath, path.basename(this.selected));
			this.selected = newModelPath;
			G.modelsManager.setLastOpened();
			G.modelsManager.loadModel(this.selected);
		}
	}

	
	newModel(name, directory) {
		let pth = path.join(G.paths.models, directory);
		G.io.newFile(pth, name + ".goms", "", this.onNewModelCreated);
	} 
    
    onNewModelCreated(pth, text) {
		G.modelsManager.update();
		G.modelsSidebar.buildSideBar();
		G.modelsManager.loadModel(pth);
	}
	
	
	saveModel() {
		G.io.writeToFile(this.selected, G.quill.getText());
	}


	/**
	 * Move the given file in fullPath to the target directory.
	 * @param {String} fullPath 
	 * @param {String} target 
	 * @returns {String} path of new file
	 */
	moveModel(fullPath, target) {
		const fileName = path.basename(fullPath);
		const targetPath = path.join(target, fileName);

		// Only do stuff if moving to a different directory.
		if (fullPath !== targetPath) {
			// If this file was selected, then update the path to it.
			if (this.selected === fullPath) {
				this.selected = targetPath;
				G.modelsManager.setLastOpened();
			}

			G.io.rename(fullPath, targetPath);
			G.modelsManager.update();
		}
		return targetPath;
	}


	/**
	 * Rename the given file in fullPath to the newName
	 * @param {String} fullPath Full path to file like /Users/demo/cogulator/filename.goms
	 * @param {String} newName New name for file without extension like new_filename
	 */
	renameModel(fullPath, newName) {
		// At the very minimum, name should not contain slashes or spaces.
		const resolvedName = newName.replace(/\//g, "_").replace(/\\/g, "_").replace(/ /g, "_").trim();
		
		// If new name is blank, don't do anything.
		if (!resolvedName) {
			return;
		}

		const directory = path.dirname(fullPath);
		let newPath = path.join(directory, `${resolvedName}.goms`);

		// If new path is same as old path, don't do anything.
		if (newPath === fullPath) {
			return;
		}

		// If desired path exists, add a number to it so it doesn't error or overwrite anything.
		// Loop until we find a model name that doesn't exist.
		let counter = 0;
		while (G.io.pathExists(newPath)) {
			counter += 1;
			newPath = path.join(directory, `${resolvedName}_${counter}.goms`)
		}

		G.io.rename(fullPath, newPath);
		G.modelsManager.update();
		// Set this one as the selected model. This prevents creating a file with the old name on window close.
		this.selected = newPath;
		G.modelsManager.setLastOpened();
		return {
			file: resolvedName,
			filePath: newPath,
		};
	}

	/**
	 * Delete a model immediately.
	 * @param {String} fullPath Full path to model
	 */
	deleteModel(fullPath) {
		G.io.delete(fullPath, () => {
			G.modelsManager.update();
		
			// If this model was selecetd, select first model in list just so something is selected.
			if (this.selected === fullPath) {
				this.selected = this.models[0].filePath;
				G.modelsManager.setLastOpened();
				G.modelsManager.loadModel(this.selected);
			}
			
			G.modelsSidebar.buildSideBar();
		});
	}
	

	deleteModels() {
		//loop through all the model buttons created in the sidebar and deleted if marked x
		$( ".model_button" ).each(function( index ) {
			let marked = $( this ).children('.model_button_delete').data("marked");
			let p = $( this ).data("path");
			if (marked == "u") G.io.delete(p); //if it's marked u, that means it's be marked for deletion and "u" for undo is the shown option
		});
	}


	/**
	 * Duplicate a model and append _copy to the new filename.
	 * /Example/INTRO.goms => /Example/INTRO_copy.goms
	 * @param {String} fullPath Full path to the model to copy. 
	 */
	duplicateModel(fullPath) {
		let newFileName = path.basename(fullPath)

		// Strip the .goms extension (make sure it has it first just in case).
		if (G.io.isGOMS(newFileName)) {
			newFileName = newFileName.slice(0, -5);

			let newPath = path.join(path.dirname(fullPath), `${newFileName}_copy.goms`);

			// If desired path exists, add a number to it so it doesn't error or overwrite anything.
			// Loop until we find a model name that doesn't exist.
			let counter = 0;
			while (G.io.pathExists(newPath)) {
				counter += 1;
				newPath = path.join(path.dirname(fullPath), `${newFileName}_copy_${counter}.goms`);
			}

			G.io.copyFile(fullPath, newPath, () => {
				G.modelsManager.update();
				G.modelsSidebar.buildSideBar();
			});
		}
	}
	
	
	copyModel(source) {
		let fileName = path.basename(source)
		let targetPath = path.join(G.paths.models, fileName);
		G.io.copyFile(source, targetPath, this.onCopyComplete);
	} onCopyComplete(pth) {
		G.modelsManager.update();
		G.modelsSidebar.buildSideBar();
		G.modelsManager.loadModel(pth)
	}

	
	getModels() {
		let modelsArr = [];
		
		for (var i = 0; i < this.paths.length; i++) {
			let models = this.paths[i];
			for (var j = 0; j < models.files.length; j++) {
				modelsArr.push(models.files[j]);
                console.log("MDL", models.files[j])
			}
		}
		return modelsArr;
	}
	
	
	loadModel(p) {
		//¡IMPORTANT: The second condition prevents blanking the model on load!  Not entirely clear why this is.
		if (this.selected != "" && this.selected != p) G.modelsManager.saveModel(); 
		
		this.selected = p;
		G.io.loadFile(p, this.displayModel);
	} displayModel(code) {
		$( document ).trigger( "Model_Loaded" );
		G.quill.setText(code); //setting text will be picked up on in customeventmanager and cause the model to process
        G.quill.history.clear();
		G.quill.focus();
		G.modelsSidebar.showSelected(G.modelsManager.selected);
		G.modelsManager.setLastOpened();
	}
	
	
	loadLastModel() {
		G.io.loadFile(G.paths.configFile, this.setLastModelPath);
	} setLastModelPath(p) {
		G.modelsManager.selected = p;
		G.modelsManager.loadModel(p);
	}
	
	
	setLastOpened() {
		G.io.writeToFile(G.paths.configFile, this.selected);
	}
    
    
    //creates an array of functions that need to complete before shutdown on Win32
    //should be transferred over to a promise style setup at some point to prevent hangs if a file cannot be deleted
    handleWindowsClose(){
        G.modelsManager.shutDownFunctions.push(function() {G.io.writeToFile(G.modelsManager.selected, G.quill.getText(), G.modelsManager.shutDownProcessor)});
        
        $( ".model_button" ).each(function( index ) {
			if ($( this ).children('.model_button_delete').data("marked") == "u") {
                let p = $( this ).data("path");
                G.modelsManager.shutDownFunctions.push(function() {G.io.delete(p, G.modelsManager.shutDownProcessor)});
            }
		}); 
        
        this.shutDownProcessor()
        //G.modelsManager.saveModel();
        //G.modelsManager.deleteModels();
        //window.close();
    }
    
    //callback function sent to io manager in handleWindowsClose above
    shutDownProcessor(){
        G.modelsManager.shutDownFunctions.shift();
        if (G.modelsManager.shutDownFunctions.length == 0) {
            window.close();
        } else {
            G.modelsManager.shutDownFunctions[0]();
        }
    }
    	
}

G.modelsManager = new ModelsManager();
