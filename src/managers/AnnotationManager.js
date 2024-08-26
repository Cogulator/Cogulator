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
		
		
		$('.edit_button').mousedown(function() {
			$( this ).animate({ opacity: 0.75}, 25);
		});
		$('.edit_button').mouseup(function() {
			$( this ).animate({ opacity: 1}, 100);
		});
		$('.edit_button').mouseleave(function() {
			$( this ).animate({ opacity: 1}, 100);
		});
	}
	
	
	//Three types of annotation
	//  - add annotation to all lines
	//  - remove annotaiton from all lines
	//  - toggle annotation for all lines
	//pressedTab is used with Quill KeyBindings to detect when tab is pressed
	annotate(annotation, type) {
		var selection = G.quill.getSelection();
		if (selection == null) return;
		
		var annotatedText = "";
		var start = Math.max(0, G.quillManager.getLineStart(selection.index));
		var end = G.quillManager.getLineEnd(selection.index + selection.length);
		var selectedText = G.quill.getText(start, end - start);
		
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
			if (start <= 0) {
				G.quill.updateContents([
					{delete: end - start},
					{insert: annotatedText}
				]);
			} else {
				G.quill.updateContents([
					{retain: start},
					{delete: end - start},
					{insert: annotatedText}
				]);
			}

			//G.quill.setSelection(selectedText.index, annotatedText.length); //resets the selection
			G.modelEvents.triggerMultiline(); //forces model rerun & solarize all (until I get the event listener working properly
		}
	}
	
}

G.annotationManager = new AnnotationManager();