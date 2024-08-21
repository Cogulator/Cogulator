class AutocompleteManager {
	
	constructor() {
		this.isVisible = false;
		this.codeTop =  parseInt( $( '#code' ).css('top').replace("px", "") );
		this.codeLeft = parseInt( $( '#code' ).css('left').replace("px", "") );
		
		//arrays for autocomplete matches (operators taken from OperatorsManager global)
		this.controls = ["goal", "operator"];
		this.times = ["syllables)", "seconds)", "ms)", "milliseconds)"];
		this.setRegExs();

		//handle text change
		$( document ).on( "Line_Update", function() {
			G.autocomplete.onTextChange();
		});
		
		//handle creation of new operator
		$( document ).on( "New_Operator", function() {
			G.autocomplete.setRegExs();
		});
		
		//handle creation of new operator
		$( document ).on( "Model_Loaded", function() {
			G.autocomplete.hide();
		});
		
		G.quill.on('selection-change', function(range, oldRange, source) {
			G.autocomplete.hide();
		});
	}
	
	
	//these need to modified versions of what is contained in Solarize.js	
	//regexs to determine whether autocomplete should be offered
	setRegExs() {
		this.regexs = [];
		this.regexs.push({ exp: /^[\.| ]{0,15}(go?a?\b|al?s?\b)/i,  type: "goal" }); //goals 
		this.regexs.push({ exp: this.operatorRegEx(), type: "operator" }); //operators
		this.regexs.push({ exp: /\([0-9]{1,5} (sy?l?l?a?b?le?\b|mi?l?l?i?s?e?c?o?n?d?s?\b|se?c?o?n?\b|m\b)/i, type: "time" }); //time or syllables
	}
	
	
	//called by the modified key bindings setup in QuillEditor.js
	complete() {
		let text = $( '#autocomplete' ).text();
		G.quill.insertText(G.quill.getSelection().index, text + " ");
		this.hide();
	}
			
	
	onTextChange() {
		this.hide();
		
		//get caret index, jump out if null
		if (G.quill.getSelection() == null) return;
		var caretIndex = G.quill.getSelection().index - 1; 
		if (caretIndex < 0) caretIndex = 0;
		
		//get the text on the current line from line start to current cursor position
		let startIndex = G.quillManager.getLineStart(caretIndex);
		let length = caretIndex - startIndex + 1;
		let line = G.quill.getText(startIndex, length); //from beginning of line to current caret position
		if (line.indexOf("\*") > -1) return; //into the comments, don't bother continuing

		//Once we have a regex of a given type, we're not going to try matching it for that line anymore
		var _regexs = this.regexs;
		if (this.hasOperator(line)) _regexs = this.regexs.filter((rgx) => (rgx.type != "operator" && rgx.type != "goal"));
		if (this.hasGoal(line)) _regexs = []; //If this is a goal line, and we've already done the autocomplete, no other autocompletes apply.
		if (this.hasTime(line)) _regexs = this.regexs.filter((rgx) => rgx.type != "time");
		
		//if one of the regexs comes up with a match on the line, try autocomplete.  If autocomplete is a go, stop
		for (var i = 0; i < _regexs.length; i++) {
			let regex = _regexs[i];
			let match = line.match(regex.exp); //just want to find first match
			if (match != null) {
				if (this.getCompletion(caretIndex, length, regex.type)) return; //if you can autocomplete, stop here
			}
		}
	}


	//Possibly overly simple method for identifying whether operator already exists in line
	hasOperator(line) {
		let operators = G.operatorsManager.operators
		for (var i = 0; i < operators.length; i++) {
			if (line.toLowerCase().includes(operators[i].operator.toLowerCase())) return true;
		}
		return false;
	}


	hasGoal(line) {
		if (line.toLowerCase().includes("goal")) return true;
		if (line.toLowerCase().includes("also")) return true;
		return false;
	}


	hasTime(line) {
		if (line.toLowerCase().includes("syllables")) return true;
		if (line.toLowerCase().includes("seconds")) return true;
		if (line.toLowerCase().includes("millseconds")) return true;
		return false;
	}
		
	
	//TODO: don't complete if line contains goal or also
	getCompletion(caretIndex, maxLength, type) {
		//figure out what's been typed so far
		var matchToArray = [];
		if 		(type == "operator") matchToArray = G.operatorsManager.operators.map(obj => obj.operator);
		else if (type == "goal") matchToArray = this.controls;
		else if (type == "time") matchToArray = this.times;
		
		//find the word right before the cursor, determine if it matches with the keyword shortened to the same length as typed text
		let typed = G.quillManager.getWord(caretIndex).toLowerCase();
		if (typed.length == 0) return false;
		
		for (var i = 0; i < matchToArray.length; i++) {
			let matchTo = matchToArray[i].toLowerCase();
			let matchToSub = matchTo.substring(0, typed.length);
			
			//if you've got a match, show it
			if (matchToSub == typed) {
				this.show(matchTo.substring(typed.length, matchTo.length), caretIndex);
				return true;
			}
		}
			
		return false;
	}
		
		
	show(completionTxt, caretIndex) {
        this.codeLeft = parseInt( $( '#code' ).css('left').replace("px", "") ); //because the sidebar can be resized, need to reset this variable
        
		this.isVisible = true;
		let caretBounds = G.quill.getBounds(caretIndex + 1);
		$( '#autocomplete' ).text(completionTxt);
		$( '#autocomplete' ).css({"visibility": "visible", "top": caretBounds.top + this.codeTop, "left": caretBounds.left + this.codeLeft});
	}
	
	
	hide() {
		this.isVisible = false;
		$( '#autocomplete' ).css({"visibility": "hidden"});
	}
	
	
	//build the operator regex using all existing operators (it's a big boy)
	operatorRegEx() {
		// /^[\.| ]{0,15}sa?\b|lo?o?\b/i
		var regexStr = "^[\\.| ]{0,15}(";
		
		for (var i = 0; i < G.operatorsManager.operators.length; i++) {
			let operator = G.operatorsManager.operators[i].operator.toLowerCase();
			regexStr += operator.charAt(0);
			for (var j = 1; j < operator.length - 1; j++) regexStr += operator.charAt(j) + "?"; //don't inlcude last letter
			regexStr += "\\b";

			if (i != G.operatorsManager.operators.length - 1) regexStr += "|";
			else regexStr += ")";
		}
		
		let regex = new RegExp(regexStr, "im");
		return regex;
	}
	
}

G.autocomplete = new AutocompleteManager();