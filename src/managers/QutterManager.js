class QutterManager { //Quill gutter
	
	constructor() {
        this.lineHeight = 22; //dependent on set font size.  Magic number.
        this.showLineNumbers = false
        
        //Handle line number toggle
        ipcRenderer.on('View->Toggle Line Numbers', (sender, arg) => {
            G.qutterManager.showLineNumbers = !G.qutterManager.showLineNumbers;
            G.qutterManager.updateMarkers();
		})
        
		//Sync Qutter scroll to Quill scroll
		$( G.quill.scrollingContainer ).scroll(function(){
			$('#gutter').scrollTop(this.scrollTop);
		})
		
		//recalculate as needed
		$( window ).resize(function() {
			G.qutterManager.updateMarkers(); //cheap way to avoid "this" binding issues
		});
		
		//on selection change on keydown, check to see if the current line is blank, if so update the markers so the insert button will be shown
		G.quill.on('selection-change', function(range, oldRange, source) {
			if (G.qutterManager.getInsertionLine() != null) G.qutterManager.updateMarkers();
		});
		$( document ).on("keyup", function() {
			if (G.qutterManager.getInsertionLine() != null) G.qutterManager.updateMarkers();
		});
		
		
		//handle error marker hover
		$( '#gutter' ).on( 'mouseenter', '.error_and_tip_marker', function () {
			let type =  $(this).data("type");
			if (type == "error") {
				let hint = $(this).data("hint");
				G.errorPopOver.show( hint, $(this).offset(), "red" );
			} else { //tip
				let hint = $(this).data("hint");
				G.errorPopOver.show( hint, $(this).offset(), "orange" );
			}
			
			let hint = $(this).data("hint");
			G.errorPopOver.show( hint, $(this).offset() );
		});
		
		$( '#gutter' ).on( 'mouseleave', '.error_and_tip_marker', function () {
			G.errorPopOver.hide();
		});
		
		
		//handle fixable tip marker hover
		$( '#gutter' ).on( 'mouseenter', '.fixable_tip_marker', function () {
			let hint = $(this).data("hint");
			let fix = $(this).data("fix");
			let lineNo = $(this).data("line");
			
			G.fixPopOver.show($(this).offset(), fix, lineNo);
			G.errorPopOver.show( hint, $(this).offset(), "orange" );
		});
		
		$( '#fixable_tip_popover' ).on( 'mouseleave', function () {
			G.errorPopOver.hide();
			G.fixPopOver.hide();
		});
		
		$( '#fixable_tip_button' ).on("click", function() {
			G.fixPopOver.fix();
			
			//insert the fix
			G.errorPopOver.hide();
			G.fixPopOver.hide();
		});
		
	} 
	
	
	updateMarkers() { 
		let errors = G.errorManager.errors;
		let tips = G.tipManager.tips;
		let insertionLine = G.qutterManager.getInsertionLine();
		var html = "";
        var lineNumber = 1;
		
		//for each line, see if an error exists
		let lines = G.quill.getLines(1, G.quill.getLength());
		for (var i = 0; i < lines.length; i++) {
			//determine if this line has an error in it.
			var foundErrorOrTip = false;
			for (var j = 0; j < errors.length; j++) {
				let error = errors[j];
				if (error.lineNo == i) {
					html += "<center><div class='error_and_tip_marker_container'><div class='error_and_tip_marker red_background' data-type='error' data-hint='" + error.hint + "'>!</div></div></center>"
					foundErrorOrTip = true;
					break;
				}
			}
			
			//if there are no errors on the line, look to see if there are any tips
			if (!foundErrorOrTip) {
				for (var j = 0; j < tips.length; j++) {
					let tip = tips[j];
					if (tip.lineNo == i) {
						if (tip.fix != "") {
							html += "<center><div class='error_and_tip_marker_container'><div class='fixable_tip_marker orange_background' data-type='tip' data-fix='" + tip.fix + "' data-id='" + tip.id + "' data-hint='" + tip.hint + "' data-line='" + tip.lineNo + "'>?</div></div></center>"
						} else {
							html += "<center><div class='error_and_tip_marker_container'><div class='error_and_tip_marker orange_background' data-type='tip' data-id='" + tip.id + "' data-hint='" + tip.hint + "' data-line>?</div></div></center>"
						}
						
						foundErrorOrTip = true;
						break;
					}
				}
			}
			
			//if there are no errors or tips on the line, and it's the selected line, check to see if the line is blank. If so, add insertion marker
			if (!foundErrorOrTip && insertionLine != null) {
				if (insertionLine == i) {
					html += "<center><div class='error_and_tip_marker_container'><div class='insertion_marker purple_background' data-line='" + insertionLine + "'>+</div></div></center>"
					foundErrorOrTip = true;
				}
			}
			
            if (!foundErrorOrTip) {
                if (this.showLineNumbers) html += "<span class='line_number'>" + lineNumber + "</span><br>";
                else                      html += "<br>";
            }
			
			
			let wrappedLines = Math.floor(lines[i].domNode.clientHeight / this.lineHeight);
			for (var j = 0; j < wrappedLines - 1; j++) html += "<br>"; 
            
            
            lineNumber++;
		}
			
		//Finish off side bar
		if (insertionLine != null && insertionLine == lines.length) {
			html += "<div class='error_and_tip_marker_container'><div class='insertion_marker purple_background' data-line='" + insertionLine + "'>+</div></div>"
		} else if (this.showLineNumbers) {
			html += "<span class='line_number'>" + lineNumber + "</span><br>";
		} else {
            html += "<br>"; 
        }
		
		if (html != $('#gutter').html) {
			$('#gutter').html(html);
		}
        
	}
	
	
	getInsertionLine() {
		let selection = G.quill.getSelection();
		
		if (selection == null) return null;
		if (selection.length > 1) return null;
				
		let lineText = G.quillManager.getLine(selection.index);
		if (lineText.length > 0) return null;
		
		return G.quillManager.getLineNumber(selection.index);
	}
	
	
}


G.qutterManager = new QutterManager();




