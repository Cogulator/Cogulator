class SolarizeManager {
	
	constructor() {
		this.selected = "";
		this.goalClr = '#D33682'; //magenta
        this.referenceClr = '#6C71C4'; //violet
		this.operatorClr = '#268BD2'; //blue
		this.chunkClr = '#2BA198'; //cyan
		this.timeClr = '#859900'; //green
		this.commentClr = '#999999'; //grey
		this.blackClr = '#000000'; //grey
		this.highlightClr = '#B58900'; //yellow
		this.forgotClr = 'red';
					
		this.setRegexs();
					
		$( document ).on( "New_Operator", function() {
			G.solarize.setRegexs();
		});
		
		$( document ).on( "Model_Update_MultiLine", function() {
			G.solarize.all();
		});
										
		$( document ).on( "Line_Update", function() {
			if (G.solarize.selected != G.modelsSidebar.selectedPath) G.solarize.all();
			else 													 G.solarize.line();
		});
	}
    
    
    setLight() {
		this.commentClr = '#999999'; //grey
		this.blackClr = '#000000'; //grey
        this.setRegexs();
        G.solarize.all();
    }
    
    setDim() {
		this.commentClr = '#777'; //grey
		this.blackClr = '#000000'; //grey
        this.setRegexs();
        G.solarize.all();
    }
    
    setDark() {
        this.commentClr = '#586E75'; //grey
		this.blackClr = '#93A1A1'; //grey
        this.setRegexs();
        G.solarize.all();
    }
	
	
	setRegexs() {
		this.regexs = [];
        this.regexs.push({ exp: /^[\.| ]{0,15}(@goal|@also)\b/gmi, clr: this.referenceClr }); //references 
		this.regexs.push({ exp: /^[\.| ]{0,15}(goal|also)\b/gmi, clr: this.goalClr }); //goals 
        this.regexs.push({ exp: / as /gmi, clr: this.goalClr }); //as for thread label);
		this.regexs.push({ exp: this.controlRegEx(), clr: this.goalClr }); // control
		this.regexs.push({ exp: this.operatorRegEx(), clr: this.operatorClr }); //operators
		this.regexs.push({ exp: /<[^>\n]+>/gmi, clr: this.chunkClr }); //working memory
		this.regexs.push({ exp: /\(\s{0,15}[0-9]{1,5}\s{1,5}(syllables|seconds|milliseconds|second|ms)\s{0,15}\)/gmi, clr: this.timeClr }); //time or syllables
		this.regexs.push({ exp: /\[[^\]\n]+\]/gmi, clr: this.highlightClr }); //highlighting
		this.regexs.push({ exp: /\*.*/gmi, clr: this.commentClr }); //comments must be last
	}
		
	
	//The updateContent Quill method chains together updates like so... quill.updateContents({ retain: length, attributes: { color: match.clr } },{ retain: length }); 
	//The index of the current retain, is essentially the endIndex of the last retain + 1.  Index is pushed forward by the length of retain.  So, this method works out
	//how to iterate through the matched regexs, order them so that you can chain the retains together, and apply black where needed
	all() {
		G.solarize.selected = G.modelsSidebar.selectedPath;
	
		var matches = [];
		var retain = [];
		let text = G.quill.getText();
		
		for (var i = 0; i < this.regexs.length; i++) {
			let regex = this.regexs[i].exp;
			let clr = this.regexs[i].clr;
			
			// push all the matches into an array that can then be reordered and processed for retain operations
			var match;
			while( (match = regex.exec(text)) != null ) {
                if (regex.toString() === "/ as /gim") { //only include "as" matches if on a goal or also line
                    let line = G.quillManager.getLine(match.index).toLowerCase();
                    if (line.includes("also") || line.includes("goal")) {
                        matches.push( {index: match.index, length: match[0].length, color: clr} );
                    }
                } else {
                    matches.push( {index: match.index, length: match[0].length, color: clr} );
                }
            }
		}
		
		//change the color to red for any forgetting errors
		let forgettingErrors = G.errorManager.errors.filter(error => error.type == "forgetting_error");
		for (var i = 0; i < forgettingErrors.length; i ++) {
			for (var j = 0; j < matches.length; j++) {
				let match = matches[j];
				if (match.color == this.chunkClr) {
					let chunk = G.quill.getText(match.index, match.length);
					let matchLineNo = G.quillManager.getLineNumber(match.index);
					if (chunk == forgettingErrors[i].chunkName && matchLineNo == forgettingErrors[i].lineNo) matches[j].color = this.forgotClr;
				}
			}
		}
				
		//sort the matches by index
		matches.sort(function(a, b){
			return a.index-b.index;
		});
		
		//remove matches that are "inside" of a comment match (probably better with a regex, but negetive lookbehinds are tricky, and I ain't too bright)
		const commentMatches = matches.filter(match => match.color == this.commentClr);
		for (var i = 0; i < matches.length; i++) {
			let match = matches[i];
			if (match.color == this.commentClr) continue;
			
			for (var j = 0; j < commentMatches.length; j++) {
				let comment = commentMatches[j];
				if (match.index >= comment.index && match.index <= comment.index + comment.length) {
					matches.splice(i, 1);
					i--;
					break;
				}
			}
		}
		
		//build the retain array
		var index = 0;
		for (var i = 0; i < matches.length; i++) {
			let match = matches[i];
			
			//if there is space between text that needs to be solarized
			if (match.index > index) {
				let retainBlack = match.index - index;
				retain.push({ retain: retainBlack, attributes: { color: this.blackClr } }); 
				index += retainBlack
			}  
			
			retain.push({ retain: match.length, attributes: { color: match.color } }); 
			index += match.length;
		}
		
		//format everything at the end black
		if (index < G.quill.getLength()) {
			let delta = G.quill.getLength() - index;
			retain.push({ retain: delta, attributes: { color: this.blackClr } }); 
		}
						
		//update
		G.quill.updateContents(retain, 'silent');
	}
    
    
    line() {
		var matches = [];
		var retain = [];
        
        if (G.quill.getSelection() == null)  return;
		var cursorIndex = G.quill.getSelection().index; 
		if (cursorIndex < 0) cursorIndex = 0;
		
		var lineStart = G.quillManager.getLineStart(cursorIndex);
		let lineEnd = G.quillManager.getLineEnd(cursorIndex);
		if (lineEnd < lineStart) lineStart = G.quillManager.getLineStart(lineEnd - 1);
		
		let lineLngth = lineEnd - lineStart;
		if (lineLngth <= 0) return;
		
        let text = G.quill.getText();
        
		for (var i = 0; i < this.regexs.length; i++) {
			let regex = this.regexs[i].exp;
			let clr = this.regexs[i].clr;
			
			// push all the matches into an array that can then be reordered and processed for retain operations
			var match;
			while( (match = regex.exec(text)) != null ) {
                if (match.index >= lineStart && match.index + match[0].length <= lineEnd) {
                    matches.push( {index: match.index, length: match[0].length, color: clr} );
                }
            }
		}
        
		//sort the matches by index
		matches.sort(function(a, b){
			return a.index-b.index;
		});
        
        
        if (matches.length == 0) {
            retain.push({ retain: lineStart});
            retain.push({ retain: lineLngth, attributes: { color: this.blackClr } });
        } else {
            var index = 0;
            for (var i = 0; i < matches.length; i++) {
                let match = matches[i];
                //if there is space between text that needs to be solarized
                if (match.index > index) {
                    let retainBlack = match.index - index;

                    if (index < lineStart || index > lineEnd) {
                        retain.push({ retain: retainBlack }); 
                    } else {
                        retain.push({ retain: retainBlack, attributes: { color: this.blackClr } }); 
                    }

                    index += retainBlack
                }  

                retain.push({ retain: match.length, attributes: { color: match.color } }); 
                index += match.length;
            }

            //format everything at the end black
            if (index < G.quill.getLength() && lineEnd > index && index > lineStart) {
                let delta = lineEnd - index;
                retain.push({ retain: delta, attributes: { color: this.blackClr } }); 
            }
        }
        
		//update
		G.quill.updateContents(retain, 'silent');
	}
	
	
	
	//Function for updating the quillet
	solarizeQuillet() {
		var matches = [];
		var retain = [];
		let text = G.quillet.getText();
		
		for (var i = 0; i < this.regexs.length; i++) {
			let regex = this.regexs[i].exp;
			let clr = this.regexs[i].clr;
			
			// push all the matches into an array that can then be reordered and processed for retain operations
			var match;
			while( (match = regex.exec(text)) != null ) matches.push( {index: match.index, length: match[0].length, color: clr} );
		}
				
		//sort the matches by index
		matches.sort(function(a, b){
			return a.index-b.index;
		});
		
		//remove matches that are "inside" of a comment match (probably better with a regex, but negetive lookbehinds are tricky, and I ain't too bright)
		const commentMatches = matches.filter(match => match.color == this.commentClr);
		for (var i = 0; i < matches.length; i++) {
			let match = matches[i];
			if (match.color == this.commentClr) continue;
			
			for (var j = 0; j < commentMatches.length; j++) {
				let comment = commentMatches[j];
				if (match.index >= comment.index && match.index <= comment.index + comment.length) {
					matches.splice(i, 1);
					i--;
					break;
				}
			}
		}
		
		//build the retain array
		var index = 0;
		for (var i = 0; i < matches.length; i++) {
			let match = matches[i];
            
			//if there is space between text that needs to be solarized
			if (match.index > index) {
				let retainBlack = match.index - index;
				retain.push({ retain: retainBlack, attributes: { color: this.blackClr } }); 
				index += retainBlack
			}  
			
			retain.push({ retain: match.length, attributes: { color: match.color } }); 
			index += match.length;
		}
						
		//update
		G.quillet.updateContents(retain, 'silent');
	}
	
	
	operatorRegEx() {
		let prefix = "^[\\.| ]{0,15}(";
		let suffix = ")\\b";
		var operatorsStr = "";
		
		for (var i = 0; i < G.operatorsManager.operators.length; i++) {
			operatorsStr += G.operatorsManager.operators[i].operator;
			if (i != G.operatorsManager.operators.length - 1) operatorsStr += "|";
		}
		
		let regex = new RegExp(prefix + operatorsStr + suffix, "gmi");
		return regex;
	}

	controlRegEx() {
		let prefix = "^[\\.| ]{0,15}(";
		var operatorsStr = "if|endif|createstate:?|setstate:?|goto:?";
		let suffix = ")\\b";

		let regex = new RegExp(prefix + operatorsStr + suffix, "gmi");
		return regex;
	}
	
}

G.solarize = new SolarizeManager();