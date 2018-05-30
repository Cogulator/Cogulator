class ModelEvents {
	
	constructor() {
		this.textWas = G.quill.getText();
		this.textIs = this.textWas;
				
		this.linesWere = G.quill.getText().split('\n').length;
		this.linesAre = this.linesWere;
		
		G.quill.on('text-change', function(eventName) {
			G.modelEvents.textIs = G.quill.getText();
			G.modelEvents.linesAre = G.quill.getText().split('\n').length;
			
			G.modelEvents.handleEvent();
		});
	}
	
	
	triggerMultiline() {
		$( document ).trigger( "Model_Update_MultiLine" );
	}

	
	triggerSingleline() {
		$( document ).trigger( "Line_Update" );
	}
	

	handleEvent() {
		let textDelta = this.textDelta(); //if two models are different in content, but the same number of charaters and lines, we still want the thing to fire
		let lineDelta = this.linesDelta(); //this might not be necessary anymore
		
		if (lineDelta > 0 || textDelta > 1) $( document ).trigger( "Model_Update_MultiLine" ); //triggers solarize all, goms processor, and error check
		else 								$( document ).trigger( "Line_Update" );
	}
	
	
	textDelta() {
		var longer = this.textIs;
		var shorter = this.textWas;
		if (longer.length < shorter.length) {
			var longer = this.textWas;
			var shorter = this.textIs;
		}

		var i = 0;
		var j = 0;
		var delta = "";

		while (j < longer.length) {
			if (shorter[i] != longer[j] || i == shorter.length) delta += longer[j];
			else i++;
			j++;
			
			if (delta.length > 2) break; //for right now, we can stop here
		}
	
		this.textWas = this.textIs;
		return delta.length;
	}
	
	
	linesDelta() {
		let delta = this.linesAre - this.linesWere;
		this.linesWere = this.linesAre;
		return Math.abs(delta);
	}

}

G.modelEvents = new ModelEvents();