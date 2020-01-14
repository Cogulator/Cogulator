class LineParser {
	constructor() {}

	parseControl(line) {
		//if this line is empty, return null
		if (line.match(/[a-z]/gmi) == null) return {components: null, error: null};
		
		//components to return
		var components = new Components();
		
		//remove comments
		if (line.indexOf("*") > -1) line = line.substring(0, line.indexOf("*"));

		//count indents
		let indentCountAndRemove = this.removeAndCountIndents(line)
		components.indents = indentCountAndRemove.indents;
		line = indentCountAndRemove.line;
		
		//look for an operator
		let regex = this.controlRegEx();
		let match = line.match(regex);
		if (match == null) {
			// console.log('no match for ' + line);
			if (line.match(/[a-z]/gmi) == null) return {components: null, error: null};
			return {components: null, error: "operator_error"};
		}
		// console.log('match ' + match);
		//save the operator and remove it from the line
		components.operator = match[0].replace(":","").toLowerCase();
		line = line.substring(match[0].length + 1, line.length); //remove the operator from the line
		
		//get label
		line = this.removeWhiteSpaceFromBeginningAndEnd(line);
		components.label = line;
		// console.log(components);
		
		return {components: components, error: null};
	}
	
	parse(line) {
		//if this line is empty, return null
		if (line.match(/[a-z]/gmi) == null) return {components: null, error: null};
		
		//components to return
		var components = new Components();
		
		//remove comments
		if (line.indexOf("*") > -1) line = line.substring(0, line.indexOf("*"));

		//count indents
		let indentCountAndRemove = this.removeAndCountIndents(line)
		components.indents = indentCountAndRemove.indents;
		line = indentCountAndRemove.line;
		
		//look to see if this is a control or reference line
		let cntrlRegex = this.controlRegEx();
		if (line.match(cntrlRegex) != null) return {components: null, error: null}; // if it's a control line, pack up your bags
        if (line.toLowerCase().match(/^(@goal|@also)/) != null) return {components: null, error: null}; // if it's a reference line, pack up your bags
		
		//look for an operator
		let regex = this.operatorRegEx();
		let match = line.match(regex);
		if (match == null) {
			//if (line.match(/[a-zA-Z0-9]{1,20}[\s]/) != null) return {components: null, error: "operator_error"}; //if there hasn't been a full word typed yet
			//return {components: null, error: null};
			if (line.match(/[a-z]/gmi) == null) return {components: null, error: null};
			return {components: null, error: "operator_error"};
		}

		//save the operator and remove it from the line
		components.operator = match[0].replace(":","").toLowerCase();
		line = line.substring(match[0].length + 1, line.length); //remove the operator from the line
        
        //get any working memory chunks out
		let chunkMatch = line.match( /<[^>]+>/gmi);
		if (chunkMatch != null) {
			for (var c = 0; c < chunkMatch.length; c++) components.chunkNames.push(chunkMatch[c]);
		}
        
		//get thread label if also
		if (components.operator == 'also') {
            //remove any chunks for references from the line
            if (chunkMatch != null) {
                for (var c = 0; c < chunkMatch.length; c++) {
                    line = line.replace(chunkMatch[c], "");
                }
            }
            
			components.threadLabel = "!X!X!"; //default
			var asMatch = line.match(/ as /mi);
			if (asMatch != null) {
                components.threadLabel = this.removeWhiteSpaceFromBeginningAndEnd(line.substring(asMatch.index + asMatch[0].length, line.length));
                components.threadLabel = components.threadLabel.replace(/\s/g,''); //remove all whitespace from thread name
				line = line.substring(0, asMatch.index);
			}
		}

		//get time parenthetical, if present
		let timeMatch = line.match(/\(\s{0,15}[0-9]{1,5}\s{1,5}(seconds|second|ms|milliseconds|syllables)\s{0,15}\)/mi);
		if (timeMatch != null) {
			line = line.substring(0, timeMatch.index);
			components.parenthetical = timeMatch[0].replace("(","").replace(")","");
		} else {
			if (line.match(/\(\s{0,15}[0-9]{1,3}.{0,15}\)/mi) != null) return {components: null, error: "time_modifier_error"};
		}
		
		//get label
		line = this.removeWhiteSpaceFromBeginningAndEnd(line);
		components.label = line;
		
		return {components: components, error: null};
	}
	
	
	removeAndCountIndents(line) {
		var rtrn = line;
		var count = 0;
		while (rtrn.charAt(0) == "." || rtrn.charAt(0) == " " || rtrn.charAt(0) == "\t") {
			if (rtrn.charAt(0) == ".") count++;
			rtrn = rtrn.substr(1);
		}

		return({indents: count, line: rtrn});
	}
	
	
	removeWhiteSpaceFromBeginningAndEnd(line) {
		var rtrn = line;
		while (rtrn.charAt(0) == " " || rtrn.charAt(0) == "\t" || rtrn.charAt(0) == "\n") rtrn = rtrn.substr(1);
		while (rtrn.charAt(rtrn.length - 1) == " " || rtrn.charAt(rtrn.length - 1) == "\t") rtrn = rtrn.substring(0, rtrn.length - 1);

		return(rtrn);
	}
	
	
	operatorRegEx() {
		// /^(goal:?|also:?|look|point|click|ignore|cognitive_processor)\b/mi;
		var operatorsStr = "^(goal:?|also:?|";
		let suffix = ")\\b";
		
		for (var i = 0; i < G.operatorsManager.operators.length; i++) {
			operatorsStr += G.operatorsManager.operators[i].operator.toLowerCase();
			if (i != G.operatorsManager.operators.length - 1) operatorsStr += "|";
		}
		// console.log("regex "+operatorsStr)

		let regex = new RegExp(operatorsStr + suffix, "mi");
		return regex;
	}

	controlRegEx() {
		var operatorsStr = "^(if|endif|createstate:?|setstate:?|goto:?";
		let suffix = ")\\b";
		let regex = new RegExp(operatorsStr + suffix, "mi");
		return regex;
	}

}



