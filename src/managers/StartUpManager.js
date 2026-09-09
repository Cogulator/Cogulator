class StartUpManager {
	
	load() {
		this.index = 0;
		this.js = ["./managers/SettingsManager.js",
                   "../packages/modeling-engine/src/core/objects/Components.js",
					"../packages/modeling-engine/src/core/objects/Operator.js",
					"../packages/modeling-engine/src/core/objects/Step.js",
					"../packages/modeling-engine/src/core/objects/Chunk.js",
				    "./objects/Point.js",
					"./utilities/StringUtils.js",
					"./interface/QuillEditor.js",
					"./managers/CustomEventsManager.js",
					"./managers/QuillManager.js",
					"./managers/QutterManager.js",
					"./managers/AnnotationManager.js",
					"../packages/modeling-engine/src/core/objects/TimeObject.js",
					"../packages/modeling-engine/src/core/cognition/LineParser.js",
					"./managers/ErrorManager.js",
				    "./managers/TipManager.js",
					"../packages/modeling-engine/src/core/cognition/GomsProcessor.js",
					"../packages/modeling-engine/src/core/cognition/Memory.js",
					"../packages/modeling-engine/src/core/cognition/SubjectiveWorkload.js",
				    "./cognition/FittsLaw.js",
				    "./managers/ExportManager.js",
					"./managers/ModelsManager.js",
					"./managers/OperatorsManager.js",
					"./managers/MethodsManager.js",
					"./managers/SolarizeManager.js",
					"./managers/AutocompleteManager.js",
                    "./managers/DarkLightManager.js",
					"./interface/ModelsSidebar.js",
					"./managers/StatsDisplayManager.js",
				    "./managers/ScreenShotManager.js",
					"./interface/GanttChart.js",
					"./interface/PopOver.js",
				    "./interface/PopOverFix.js",
				    "./managers/ReloadManager.js",
				    "./interface/NewFileCHI.js",
                    "./interface/FinderCHI.js",
				  	"./interface/InsertionCHI.js",
			    	"./interface/MagicModels.js",
				  	"./managers/DragAndDropManager.js"];
		
		this.loadScript(this.js[this.index]);
	}
	
	loadScript(source) {
		const script = document.createElement('script');
		script.src = source;
		script.onload = () => G.startUp.getNext();
		script.onerror = () => console.error(`Unable to load ${source}`);
		document.head.appendChild(script);
	}

	
	getNext() {
		G.startUp.index++;
		
		if (G.startUp.index < G.startUp.js.length) {
			this.loadScript(this.js[this.index]);
		} else {
			G.modelsManager.loadLastModel();
            if (G.darkLightManager.isDark) G.darkLightManager.youWantItDarker(true); //true indicates this is happening on startup
		}
	}
}


G.startUp = new StartUpManager();
