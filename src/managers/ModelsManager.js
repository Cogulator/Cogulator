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
            console.log("TRY TO UNLOAD");
		})
		
		ipcRenderer.on('File->Save', (sender, arg) => {
			G.modelsManager.saveModel();
		})
	}
	
	
	update() {
		this.paths = G.io.getDirectoryPaths(G.paths.models);
		this.models = this.getModels();
	}

	
	newModel(name, directory) {
		let pth = path.join(G.paths.models, directory);
		G.io.newFile(pth, name + ".goms", "", this.onNewModelCreated);
	} onNewModelCreated(pth, text) {
		G.modelsManager.update();
		G.modelsSidebar.buildSideBar();
		G.modelsManager.loadModel(pth);
	}
	
	
	saveModel() {
		G.io.writeToFile(this.selected, G.quill.getText());
	}
	
	
	deleteModels() {
		//loop through all the model buttons created in the sidebar and deleted if marked x
		$( ".model_button" ).each(function( index ) {
			let marked = $( this ).children('.model_button_delete').data("marked");
			let p = $( this ).data("path");
			if (marked == "u") G.io.deleteFile(p); //if it's marked u, that means it's be marked for deletion and "u" for undo is the shown option
		});
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
		G.quill.focus();
		G.modelsSidebar.showSelected(G.modelsManager.selected, false);
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
                G.modelsManager.shutDownFunctions.push(function() {G.io.deleteFile(p, G.modelsManager.shutDownProcessor)});
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
