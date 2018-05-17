class AnnotationManager {
	constructor() {
		$('#comment_button').click(function() {
			G.annotationManager.annotate("*", "toggle");
		});
		
		$('#indent_button').click(function() {
			G.annotationManager.annotate(".", "add");
		});
		
		$('#dedent_button').click(function() {
			G.annotationManager.annotate(".", "remove");
		});
	}
	
	
	//Three types of annotation
	//  - add annotation to all lines
	//  - remove annotaiton from all lines
	//  - toggle annotation for all lines
	annotate(annotation, type) {
		var annotatedText = "";
		
		let index = G.quillManager.lastSelection;
		let selectedText = G.quillManager.getLine(index);
		
		let lines = selectedText.split("\n");
		for (var i = 0; i < lines.length; i++) {
			let line = lines[i];
			let firstCharIndex = line.indexOf(line.trim());
			let firstChar = line.charAt(firstCharIndex);
			
			if (line.length > 0) {
				if (firstChar == annotation && type != "add") line = line.slice(0, firstCharIndex) + line.slice(firstCharIndex + 1);
				else if (type != "remove") line = annotation + line;
				
				annotatedText += line;
			}
			
			if (i != lines.length - 1) annotatedText += "\n";
		}

		if (annotatedText.length > 0 && annotatedText != selectedText) {
			G.quill.updateContents([
				{retain: index.index},
				{delete: index.length},
				{insert: annotatedText},
			]);

			//G.quill.setSelection(selectedText.index, annotatedText.length); //resets the selection
			G.modelEvents.triggerMultiline(); //forces model rerun & solarize all (until I get the event listener working properly
		}
	}
	
}

G.annotationManager = new AnnotationManager();