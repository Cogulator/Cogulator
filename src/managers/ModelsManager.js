class ModelsManager {
	constructor() {
		this.update();
		this.selected = "";
		
		$( document ).on( "GOMS_Processed", function(evt, taskTimeMS) {
			G.modelsManager.saveModel();
		});
		
		window.addEventListener('unload', function(event) {
			G.modelsManager.saveModel();
			G.modelsManager.deleteModels();
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
	
}

G.modelsManager = new ModelsManager();
