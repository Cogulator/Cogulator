class FinderCHI {
    constructor() {
        this.matches = [];
        this.focusIndex = 0;
        
        this.highlightColor = "#D9D6D6"; //grey
        this.focusColor = "#F8E71C"; //yellow
        
        ipcRenderer.on('Edit->Find', (sender, arg) => {
			G.finderCHI.show();
		})
        
        //hide if click on anything other than find chi
		$(document).bind('click', function(e) {
			if (!G.finderCHI.targetIsThis(e.target) && e.target.innerHTML != "Find" && e.target.id != "windows_edit_btn") G.finderCHI.hide();  
		});
        
        //listen for typing in textfield
        $(document).on("keyup", "#finder_text_field", function(evt) {
            if (evt.key == "Enter")       G.finderCHI.onNextButton();
            else if (evt.key == "Escape") G.finderCHI.hide();
			else                          G.finderCHI.onType( $(this).val() );
    	});
        
        $(document).on("click", "#finder_previous_button", function() {
			G.finderCHI.onPreviousButton();
		});
        
        $(document).on("click", "#finder_next_button", function() {
			G.finderCHI.onNextButton();
		});
    }
    
    show() {
        $(" #finder_text_field" ).val("");
        $( '#finder_container' ).slideToggle("fast");
        $( '#finder_text_field' ).focus();
        $('#finder_text_field').css('border-color', '#C6C3C3');
        this.focusIndex = 0;
    }
        
    onType(find) {
        this.matches.length = 0;
        this.unHighlight();
        if (find == "") {
            $( '#finder_stats' ).text('');
            //$( '#finder_text_field' ).css('background-color', 'transparent');
            $( '#finder_text_field' ).css('border-color', '#C6C3C3');
            return;
        }
        
        let regex = new RegExp(find, "gi");
        let goms = G.quill.getText();
        
        var match;
        while( (match = regex.exec(goms)) != null ) {
            this.matches.push(match);
        }
                
        //build the highlight array
        var lastIndex = 0;
        var formatting = [];
		for (var i = 0; i < this.matches.length; i++) {
			let index = this.matches[i].index;
            if (index - lastIndex > 0) formatting.push({ retain: index - lastIndex }); //retaining 0 at index 0 chokes
            formatting.push({ retain: find.length, attributes: { "background-color": this.highlightColor} });
            lastIndex = index + find.length;
		}
                 
		//update
		G.quill.updateContents(formatting, 'silent');
        
        //set the first match to the focus color
        if (this.matches.length != 0) {
            G.quill.formatText(
                this.matches[0].index, find.length, {                   
                'background-color': this.focusColor
                },
                'silent'
            );
            
            $( '#finder_stats' ).text('1 of ' + this.matches.length);
            //$( '#finder_text_field' ).css('background-color', '#E5F1ED'); //green
            $( '#finder_text_field' ).css('border-color', '#4CBD99'); //green
            G.quill.setSelection(this.matches[0].index, 0); //scroll to the first match
            $( '#finder_text_field' ).focus(); //returns focus to find text field
        } else {
            $( '#finder_stats' ).text('no results');
            $( '#finder_text_field' ).css('border-color', 'red');
        }
        
        
    }
    
    unHighlight() {
        G.quill.formatText(
            0, G.quill.getText().length, {                   
            'background-color': false
            },
            'silent'
        );
    }
    
    onPreviousButton() {
        let was = this.matches[this.focusIndex];
        
        this.focusIndex--;
        if (this.focusIndex < 0 ) this.focusIndex = this.matches.length - 1;
        let is = this.matches[this.focusIndex];
        
        this.changeFocus(was, is);
    }
    
    onNextButton() {
        let was = this.matches[this.focusIndex];
        
        this.focusIndex++;
        if (this.focusIndex > this.matches.length - 1) this.focusIndex = 0;
        let is = this.matches[this.focusIndex];
        
        this.changeFocus(was, is);
    }
    
    changeFocus(was, is) {
        let length = $( '#finder_text_field' ).val().length
        
        //last back to yellow
        G.quill.formatText(
            was.index, length, {                   
            'background-color': this.highlightColor
            },
            'silent'
        );
        
        //new back to orange
        G.quill.formatText(
            is.index, length, {                   
            'background-color': this.focusColor
            },
            'silent'
        );
        
        let num = this.focusIndex + 1
        $( '#finder_stats').text(num + ' of ' + this.matches.length);
        
        G.quill.setSelection(is.index, 0); //scrolls the code
        $( '#finder_text_field' ).focus();
    }
    
    
    hide() {
        if ( $( '#finder_container' ).is(":visible") ) {
            this.unHighlight();
            $( '#finder_container' ).slideToggle("fast");
        }
        
        $('#finder_stats').text('');
        $('#finder_text_field').css('border-color', '#C6C3C3');
    }
    
    targetIsThis(target) {
		if (target.id == "finder_container") return true;
		
		var itIs = false;
		$(target).parents().each(function(){
			if (this.id == "finder_container") itIs = true;
		});
		
		return itIs;
	}
}

G.finderCHI = new FinderCHI();