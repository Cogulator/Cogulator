class FilePathManager {
	constructor() {
		this.desktop = app.getPath('desktop');
		
		this.cogulator = path.join(app.getPath('documents'), "cogulator");
		
		this.models = path.join(this.cogulator, "models");
		this.methods = path.join(this.cogulator, "methods");
		
		this.operators = path.join(this.cogulator, "operators");
		this.operatorsFile = path.join(this.operators, "operators.txt");
		
		this.config = path.join(this.cogulator, "config");
		this.configFile = path.join(this.config, "config.txt");
	}
}

G.paths = new FilePathManager();