//instantiate Quill

var bindings = {
	list: {
		key: 'enter',
		handler: function(range, context) {
			if (G.autocomplete.isVisible) {
				G.autocomplete.complete();
			} else {
				return true; // propogate to Quill's default
			}
		}
	}
};


G.quill = new Quill('#code', {
	formats: ['color','font','image'],  //whitelist of acceptable formats
	modules: {
		keyboard: {
		  bindings: bindings
		}
  	}
});


G.quillet = new Quill('#insertion_details_container');