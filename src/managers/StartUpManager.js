class StartUpManager {
	
	load() {
		this.index = 0;
		this.js = ["./cognition/helpers/Components.js", 
					"./cognition/helpers/Operator.js",
					"./cognition/helpers/Step.js",
					"./cognition/helpers/Chunk.js",
					"./utilities/StringUtils.js",
					"./interface/QuillEditor.js",
					"./managers/CustomEventsManager.js",
					"./utilities/QuillHelper.js",
					"./utilities/QutterHelper.js",
					"./managers/AnnotationManager.js",
					"./cognition/helpers/TimeObject.js",
					"./cognition/LineParser.js",
					"./managers/ErrorManager.js",
					"./cognition/GomsProcessor.js",
					"./cognition/Memory.js",
					"./cognition/SubjectiveWorkload.js",
					"./managers/ModelsManager.js",
					"./managers/OperatorsManager.js",
					"./managers/MethodsManager.js",
					"./utilities/Solarize.js",
					"./utilities/Autocomplete.js",
					"./interface/ModelsSidebar.js",
					"./managers/StatsDisplayManager.js",
				    "./managers/ScreenShotManager.js",
					"./interface/GanttChart.js",
					"./interface/PopOver.js",
				    "./managers/ReloadManager.js",
				    "./interface/NewFileCHI.js"];
		
		$.getScript( this.js[this.index], function(){
			G.startUp.getNext();
		});
	}
	
	
	getNext() {
		G.startUp.index++;
		
		if (G.startUp.index < G.startUp.js.length) {
			$.getScript( this.js[this.index], function(){
				G.startUp.getNext();
			});
		} else {
			G.modelsManager.loadLastModel();
		}
	}
}


G.startUp = new StartUpManager();

