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
			G.annotationManager.annotate(".", "add");
			return false;
		}
	},

	//Dedent a group of lines
	custom: {
		key: ['Tab'],
		shiftKey: true,
		handler: function(range, context) {
			G.annotationManager.annotate(".", "remove");
			return false;
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