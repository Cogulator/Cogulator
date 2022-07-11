ipcRenderer.on('File->ChangeModelsDirectory', (sender) => {
    G.paths.updateModelsDirectory();
})

class FilePathManager {
	constructor() {
        
        this.desktop = ipcRenderer.sendSync('read-desktop-path');
        this.documents = ipcRenderer.sendSync('read-documents-path');
        this.models = ipcRenderer.sendSync('read-models-path'); //allows for user set models directory
        
        this.cogulator = path.join(this.documents, "cogulator");
        this.methods = path.join(this.cogulator, "methods");
        this.operators = path.join(this.cogulator, "operators");
        this.config = path.join(this.cogulator, "config");
        
        this.operatorsFile = path.join(this.operators, "operators.txt");
        this.configFile = path.join(this.config, "config.txt");
	}
    
    updateModelsDirectory() {
        this.models = ipcRenderer.sendSync('read-models-path');
    }
}

G.paths = new FilePathManager();