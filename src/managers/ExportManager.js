class ExportManager {
	constructor() {
		this.EOL = require('os').EOL;
		
		ipcRenderer.on('File->Export Model', (sender, arg) => {
			G.exportManager.exportModel();
		})
		
		ipcRenderer.on('File->Export Working Memory', (sender, arg) => {
			G.exportManager.exportWM();
		})
	}
	
	
	exportModel() {
		var model = "operator" + "\t" + "label" + "\t" + "line_number" + "\t" + "resource" + "\t" + "thread" + "\t" + "operator_time" + "\t" + "step_start_time" + "\t" + "step_end_time" + this.EOL;
		
		let steps = G.gomsProcessor.intersteps;
		for (var i = 0; i < steps.length; i++) {
			let step = steps[i];
			model += step.operator + "\t" + step.label + "\t" + step.lineNo + "\t" + step.resource + "\t" + step.thread + "\t" + step.time + "\t" + step.startTime + "\t" + step.endTime + this.EOL;
		}
		
		let defaultFileName = path.basename(G.modelsManager.selected, ".goms") + "_steps.txt";
		this.save(model, defaultFileName);
	}
	
	
	exportWM() {
		var items = "time" + "\t" + "items_in_memory" + this.EOL;
		
		let memory = G.memory.workingmemory;
		for (var i = 0; i < memory.length; i++) {
			let stack = memory[i];
			let time = i * 50;
			let count = stack.length;
			items += time + "\t" + count + this.EOL;
		}
		
		//in the second part of the file, report out life of each chunk
		items += "time" + "\t" + "chunk_name" + "\t" + "rehearsals" + "\t" + "probability_of_recall" + this.EOL;
		for (var i = 0; i < memory.length; i++) {
			let stack = memory[i];
			let time = i * 50;
			for (var j = 0; j < stack.length; j++) {
				let chunk = stack[j];
				items += time + "\t" + chunk.chunkName + "\t" + chunk.rehearsals + "\t" + chunk.probabilityOfRecall + this.EOL;
			}
		}
		
		let defaultFileName = path.basename(G.modelsManager.selected, ".goms") + "_memory.txt";
		this.save(items, defaultFileName);
	}
	
	
	save(text, defaultName) {
		var fullPath = dialog.showSaveDialog({
							defaultPath: '~/' + defaultName,
							filters: [{
								name: 'Plain Text',
								extensions: ['txt']
							}]
						});
		G.io.writeToFile(fullPath, text);
	}
}


G.exportManager = new ExportManager();
