class QutterHelper { //Quill gutter
	
	constructor() {
		this.lineHeight = 22; //dependent on set font size
		//this.numberLines(); //initial line numbers
		
		//Sync Qutter scroll to Quill scroll
		$( G.quill.scrollingContainer ).scroll(function(){
			$('#gutter').scrollTop(this.scrollTop);
		})
		
		//renumber as needed
		$( window ).resize(function() {
		  	//G.qutterHelper.numberLines(); //cheap way to avoid "this" binding issues\
			G.qutterHelper.updateErrorMarkers(); //cheap way to avoid "this" binding issues
		});
		
		//handle error marker hover
		$( '#gutter' ).on( 'mouseenter', '.error_marker', function () {
			let hint = $(this).data("hint");
			G.errorPopOver.show( hint, $(this).offset() );
		});
		
		$( '#gutter' ).on( 'mouseleave', '.error_marker', function () {
			G.errorPopOver.hide();
		});
	} 
	
	
	numberLines() {
		var txt = "";
		let lines = G.quill.getLines(1, G.quill.getLength());
		for (var i = 0; i < lines.length; i++) {
			
			txt += i.toString();
			let wrappedLines = lines[i].domNode.clientHeight / this.lineHeight;
			for (var j = 0; j < wrappedLines; j++) txt += "\n";
			
			console.log(lines[i].domNode.clientHeight, wrappedLines, lines[i].domNode.innerHTML);
		}
		
		$('#gutter').text(txt);
	}
	
	
	updateErrorMarkers() { 
		let errors = G.errorManager.errors;
		var html = "";
		
		//for each line, see if an error exists
		let lines = G.quill.getLines(1, G.quill.getLength());
		for (var i = 0; i < lines.length; i++) {
			//determine if this line has an error in it.
			var foundError = false;
			for (var j = 0; j < errors.length; j++) {
				let error = errors[j];
				if (error.lineNo == i) {
					html += "<div class='error_marker_container'><div class='error_marker' data-hint='" + error.hint + "'>!</div></div>"
					foundError = true;
					break;
				}
			}
			
			if (!foundError) { html += "<br>" };
			
			let wrappedLines = lines[i].domNode.clientHeight / this.lineHeight;
			for (var j = 0; j < wrappedLines - 1; j++) html += "<br>"; 
		}
		
		html += "<br>"; 
		
		if (html != $('#gutter').html) {
			$('#gutter').html(html);
		}
	}
	
	
}


G.qutterHelper = new QutterHelper();




