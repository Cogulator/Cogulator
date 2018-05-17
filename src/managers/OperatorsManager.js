class OperatorsManager {
	
	constructor() {
		this.operators = [];
		let operatorText = this.loadOperators();
		this.setOperators(operatorText);
	}
	
	
	loadOperators() {
		let text = fs.readFileSync(G.paths.operatorsFile, 'utf8');
		return text;
	}
	
	
	createOperator(name, resource, time, description) {
		var name = name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
		let line = "\n" + resource.trim() + " " + name.trim() + " " + time.trim() + " " + this.replaceAll(description, " ", "_") + "\n";
		G.io.appendToFile(G.paths.operatorsFile, line, this.onOperatorCreated);
	} onOperatorCreated() {
		let operatorText = G.operatorsManager.loadOperators();
		G.operatorsManager.setOperators(operatorText);
		$( document ).trigger( "New_Operator" ); // tells solarize & gomsprocessor to do their things
		$( document ).trigger( "Model_Loaded" ); // tells solarize & gomsprocessor to do their things
	}
	
	
	setOperators(operatorText) {
		let lines = operatorText.split('\n');
		
		for (var i = 0; i < lines.length; i++) {
			let cmpnts = lines[i].split(" ");
			if (cmpnts.length >= 3) {
				let time = parseInt(cmpnts[2]);
				if (this.isResource(cmpnts[0]) && !isNaN(time)) {
					var operator = new Operator(cmpnts[0], cmpnts[1], time);
					if (cmpnts.length >= 4) operator.description = cmpnts[3];
					if (cmpnts.length >= 5) operator.timeModifier = cmpnts[4];
					this.operators.push(operator);
				}
			}
		}
	}
	
	
	isResource(resource) {
		if (resource == 'see') return true;
		if (resource == 'hear') return true;
		if (resource == 'cognitive') return true;
		if (resource == 'hands') return true;
		if (resource == 'speech') return true;
		if (resource == 'system') return true;
		
		return false; 
	}
	
	replaceAll (text, search, replacement) {
    	return text.replace(new RegExp(search, 'g'), replacement);
	}
	
}

G.operatorsManager = new OperatorsManager();