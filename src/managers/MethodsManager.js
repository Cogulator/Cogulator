class MethodsManager {
	constructor() {
		this.update();
		this.stepsToWrite = "";
	}
	
	
	update() {
		this.paths = G.io.getDirectoryPaths(G.paths.methods);
		this.methods = this.getMethods();
	}

	
	newMethod(name, steps) {
		this.stepsToWrite = steps;
		let pth = path.join(G.paths.methods, "custom");
		G.io.newFile(pth, name + ".goms", steps, this.onNewMethodCreated);
	} onNewMethodCreated(pth, steps) {
		G.io.writeToFile(pth, G.methodsManager.stepsToWrite);
        G.methodsManager.update()
	}
	
	
	getMethods() {
		let methodsArr = [];
		
		for (var i = 0; i < this.paths.length; i++) {
			let methods = this.paths[i];
			for (var j = 0; j < methods.files.length; j++) {
				methodsArr.push(methods.files[j]);
			}
		}
		return methodsArr;
	}
	
	
	loadMethod(pth) {
		G.io.loadFile(pth, this.displayModel);
	} insertMethod(code) {
		//once you get the code, insert it at the cursor
		//G.quill.setText(code);
		//$( document ).trigger( "Model_Loaded" );
	}
	
}

G.methodsManager = new MethodsManager();