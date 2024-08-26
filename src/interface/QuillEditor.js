//instantiate Quill

var bindings = {
	//Autocomplete
	list: {
		key: 'Enter',
		handler: function(range, context) {
			if (G.autocomplete.isVisible) {
				G.autocomplete.complete();
			} else {
				return true; // propogate to Quill's default
			}
		}
	},

	//Ident a group of lines
	tab: {
		key: 9,
		handler: function() {
			let lineCount = G.quillManager.getSelectedText().split("\n").length;
			console.log("Jabbed the Tab", lineCount);

			if (lineCount > 1) {
				G.annotationManager.annotate(".", "add", true);
			} else {
				return true; // propogate to Quill's default
			}
		}
	},

	//Dedent a group of lines
	custom: {
		key: ['Tab'],
		shiftKey: true,
		handler: function(range, context) {
			let lineCount = G.quillManager.getSelectedText().split("\n").length;
			console.log("Shifty Tab", lineCount);

			if (lineCount > 1) {
				G.annotationManager.annotate(".", "remove", true);
			} else {
				return true; // propogate to Quill's default
			}
		}
	},
};


G.quill = new Quill('#code', {
	formats: ['color','background-color','font','image'],  //whitelist of acceptable formats
	modules: {
		keyboard: {
		  bindings: bindings
		}
  	}
});


G.quillet = new Quill('#insertion_details_container');