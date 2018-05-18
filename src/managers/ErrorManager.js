class GomsError {
	//types
	//  operator_error
	//  time_modifier_error
	//  forgetting_error
	constructor(type, lineNo, hint = "") {
		this.parser = new LineParser();
		this.type = type; //
		this.lineNo = lineNo;
		this.id = this.lineNo + "_" + this.type;
		if (hint == "") this.hint = this.getHint(type);
		else this.hint = hint;
	}
	
	getHint(type) {
		switch(type) {
			case "operator_error":
				return "I couldn&#39;t find an operator at the start of this line."
			case "time_modifier_error":
				return "Inside the parenthetical, use seconds, millseconds, ms, or syllables.";
			case "invalid_args_create":
				return "I was expecting 2 arguments!"
			case "invalid_var_create":
				return "State variable already exists!"
			case "invalid_var_dne":
				return "State variable does not exist!"
			case "invalid_if_unclosed":
				return "I was expecting an EndIf"
			case "invalid_endif":
				return "I was not expecting any arguments."
			case "invalid_goto":
				return "I was expecting something like: goto goal."
			case "invalid_goal_dne":
				return "Goal does not exist!"
			case "infinite_loop":
				return "I ran into an infinite loop!"
			default:
				text = "";
		}
	}
}

class ErrorManager {
	
	constructor() {
		this.lineParser = new LineParser();
		this.errors = [];
		this.tips = [];
		
		$( document ).on( "GOMS_Process_Started", function() {
		  	G.errorManager.errors.length = 0;
		});
		
		$( document ).on( "Memory_Processed", function(evt, taskTimeMS) {
		  	G.qutterManager.updateErrorMarkers();
		});
		
		$( document ).on( "Line_Update", function() {
		  	G.errorManager.onLineChange();
		});
	}
	

	onLineChange() {
		let selection = G.quill.getSelection();
		if (selection == null)  return;
		
		let index = selection.index;
		let lineNumber = G.quillHelper.getLineNumber(index);
		let lineTxt = G.quillHelper.getLine(index);
		
		let componentsAndErrors = this.lineParser.parse(lineTxt);
		if (componentsAndErrors.error != null) {
			let error = new GomsError(componentsAndErrors.error, lineNumber);
			this.addError(error);
		} else {
			this.removeErrorFromLine(lineNumber);
		}
	}
	
	
	addError(errorToAdd) {
		var exists = false;
		var replaced = false;
		
		//assumes line parser only returns one error per line
		for (var i = 0; i < this.errors.length; i++) {
			let error = this.errors[i];
			if (error.id == errorToAdd.id) { //if the error already exists, don't do anything
				exists = true;
				break;
			} else if (error.lineNo == errorToAdd.lineNo) { //if a different error exists for the line, replace with this one
				replaced = true;
				this.errors[i] = errorToAdd;
				break;
			}
		}
		
		if (exists) return; //if the error is already in the error stack, there's nothing to do
		if (!replaced) this.errors.push(errorToAdd); //if you did not replace an existing error with errorToAdd, push errorToAdd
		
		G.qutterHelper.updateErrorMarkers();
	}
	
	
	removeErrorFromLine(lineNumber) {
		let startingLength = this.errors.length;
		
		//assumes line parser only returns one error per line
		for (var i = 0; i < this.errors.length; i++) {
			let error = this.errors[i];
			if (error.lineNo == lineNumber) {
				this.errors.splice(i, 1);
				break;
			}
		}
		
		if (this.errors.length < startingLength) G.qutterHelper.updateErrorMarkers();
	}

}

G.errorManager = new ErrorManager();
	   
	   
	   
	   
	   