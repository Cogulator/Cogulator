class FilePathManager {
	constructor() {
        
        this.desktop = ipcRenderer.sendSync('read-desktop-path');
        this.documents = ipcRenderer.sendSync('read-documents-path');
        
        this.cogulator = path.join(this.documents, "cogulator");
        this.models = path.join(this.cogulator, "models");
        this.methods = path.join(this.cogulator, "methods");
        this.operators = path.join(this.cogulator, "operators");
        this.config = path.join(this.cogulator, "config");
        
        this.operatorsFile = path.join(this.operators, "operators.txt");
        this.configFile = path.join(this.config, "config.txt");
	}
}

G.paths = new FilePathManager();