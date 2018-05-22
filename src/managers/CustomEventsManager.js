class ModelEvents {
	
	constructor() {
		this.lengthWas = G.quill.getLength();
		this.lengthIs = G.quill.getLength();
		
		this.linesWere = G.quill.getText().split('\n').length;
		this.linesAre = this.linesWere;
		
		$( document ).on( "Model_Loaded", function() {
			$( document ).trigger( "Model_Update_MultiLine" );
		});
		
		G.quill.on('text-change', function(eventName) {
			G.modelEvents.lengthIs = G.quill.getLength();
			G.modelEvents.linesAre = G.quill.getText().split('\n').length;
			
			G.modelEvents.handleEvent();
		});
		
	}
	
	
	triggerMultiline() {
		$( document ).trigger( "Model_Update_MultiLine" );
	}

	
	triggerSingleline() {
		$( document ).trigger( "Model_Update_SingleLine" );
	}
	

	handleEvent() {
		let lengthDelta = this.lengthDelta();
		let lineDelta = this.linesDelta();
		if (lineDelta > 1) {
			//triggers solarize all, and goms processor run (which in turn triggers error check run)
			$( document ).trigger( "Model_Update_MultiLine" );
		} else if (lineDelta == 1) {
			//triggers solarize line, and goms proceessor run (which in turn triggers error check run)
			$( document ).trigger( "Model_Update_SingleLine" );
		} else if (lengthDelta > 1) {
			$( document ).trigger( "Model_Update_MultiLine" );
		} else if (lengthDelta > 0) {
			$( document ).trigger( "Line_Update" );
		}
	}
	
	
	lengthDelta() {
		let delta = this.lengthIs - this.lengthWas;
		this.lengthWas = this.lengthIs;
		return Math.abs(delta);
	}
	
	linesDelta() {
		let delta = this.linesAre - this.linesWere;
		this.linesWere = this.linesAre;
		return Math.abs(delta);
	}

}

G.modelEvents = new ModelEvents();