/*******************************************************************************
 * This is the copyright work of The MITRE Corporation, and was produced for the
 * U. S. Government under Contract Number DTFAWA-10-C-00080.
 *
 * For further information, please contact The MITRE Corporation, Contracts Office,
 * 7515 Colshire Drive, McLean, VA  22102-7539, (703) 983-6000.
 *
 * Copyright 2014 The MITRE Corporation
 *
 * Approved for Public Release; Distribution Unlimited. 14-0584
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

class GomsProcessor {
	
	constructor() {
		this.parser = new LineParser();

		this.currentGoalLine = 0;
		this.currentIndent = -1;
		this.currentGoals = [];
		
		this.steps = [];
		this.intersteps = []; //interleaved steps
		this.thrdOrdr = []; //an order of threads for gantt chart time line annotation

		this.threadTracker = []; //dictionary tracks the active method for each thread
		this.resourceAvailability= []; //dictionary
		this.threadAvailability= []; //dictionary

		this.newThreadNumber = 0; //used as a thread name for "Also" when one is not provided

		this.totalTaskTime = 0.0;
		this.cycleTime  = 0.0;

		this.stateTable = []; //dictionary
		this.goalTable = []; //dictionary
		this.goalSteps = [];
				
		$( document ).on( "Model_Update_MultiLine", function() {
			G.gomsProcessor.process();
		});
		
		
		$( document ).on( "Model_Update_SingleLine", function() {
			G.gomsProcessor.process();
		});
		
		
		$( document ).on( "Error_Count_Change", function() {
			G.gomsProcessor.process();
		});
	}
	

	process() {
		$( document ).trigger( "GOMS_Process_Started" );
		
		this.maxEndTime = 0;
		this.cycleTime = 0; //ms. 50 ms Based on production rule cycle time.  Bovair & Kieras/Card, Moran & Newell
		this.newThreadNumber = 0;
				
		this.steps = [];
		this.intersteps = [];
		this.thrdOrdr = [];

		this.threadTracker = []; //dictionary //hashmap that tracks that active goal for each thread
		this.resourceAvailability = []; //dictionary
		this.threadAvailability = []; //dictionary

		//(<resource name>, <time resource comes available>)
		var to = new TimeObject(0, 0);
		var verbalcomsArray = [to];
		var seeArray = [to];
		var cognitiveArray = [to];
		var handsArray = [to];
		this.resourceAvailability["verbalcoms"] = verbalcomsArray;
		this.resourceAvailability["see"] = seeArray;
		this.resourceAvailability["cognitive"] = cognitiveArray;
		this.resourceAvailability["hands"] = handsArray;

		//for (var errorKey: Object in $.errors) delete $.errors[errorKey]; //clear out all $.errors
		//for (var stateKey: Object in stateTable) delete stateTable[stateKey]; //clear out all $.errors
		//for (var goalKey: Object in goalTable) delete goalTable[goalKey]; //clear out all $.errors

		this.generateStepsArray();
		if (this.steps.length > 0) this.processStepsArray(); //processes and then interleaves steps
		
		this.totalTaskTime = Math.max.apply(Math, this.intersteps.map(function(o){ return o.endTime; }));
		$( document ).trigger( "GOMS_Processed", [this.totalTaskTime] );
	}


	// Purpose: Iterates through the model error check, and create the "Step" object.
	// Input: None
	// Output: None
	//
	// Notes: Cog+ modifies this method heavily.  New operators modify the line pointer during execution
	generateStepsArray() {
		this.stateTable = []; //dictionary
		this.goalTable = []; //dictionary

		var codeLines = G.quill.getText().split("\n");
		var beginIndex = 0;
		var endIndex = codeLines[0].length;
		var jumps = 0;
		//G.solarize.solarizeAll();
		for (var lineIndex = 0; lineIndex < codeLines.length; lineIndex++) {
			var line = codeLines[lineIndex];
			var parsed = this.parser.parseControl(line);
			if (parsed.components != null && parsed.error == null) {
				var components = parsed.components;
				// console.log(parsed.components);
				// this.processBaseCogulatorLine(this.parser.parse(line), lineIndex);
				var tokens = components.label.split(' ').filter(String);
				tokens.unshift(components.operator)
				// tokens = tokens.filter(noEmpty);
				if(tokens.length > 0){
					switch (tokens[0].toLowerCase()) {
						case "createstate":
							if (!this.hasError(tokens, lineIndex)) this.createState(tokens[1], tokens[2]);
							break;
						case "setstate":
							if (!this.hasError(tokens, lineIndex)) this.setState(tokens[1], tokens[2]);
							break;
						case "if":
							//should return int of next line to be processed based on the resolution of the if statement.
							if (!this.hasError(tokens, lineIndex)) lineIndex = this.nextIfLine(codeLines, lineIndex); 
							break;
						case "goto":
							//Checks for infinite loops and syntax errors. Jumps are limited to 25, after which all jumps will be considered errors and not processed.
							if (!this.hasError(tokens, lineIndex, jumps)) {
								//line should be in the form "GoTo Goal: goal_name" (name can contain spaces, colons are optional) 
								tokens[1] = this.trimColon(tokens[1])
								var goalLabel = tokens.slice(2, tokens.length).join(" ");
								if(this.goalTable[goalLabel] !== undefined){
									lineIndex = this.goalTable[goalLabel] - 1;
									jumps++;
								}
							}
							break;
					}
				}
			} else {
				this.processBaseCogulatorLine(this.parser.parse(line), lineIndex);
			}
		}
		this.removeGoalSteps();
		this.setPrevLineNo();
	}

	// Purpose:  To determine if there is a syntax error in cog+ operators
	// Input: Front trimmed line tokenized using space as dilimiter. 
	//		  	Operator should always be first token
	//        	Example:  CreateState,target1,isFriendly,,,  <-whitespace at end of line
	//		  	Example:  GoTo,Goal:,hands,and,feet
	//		  A lineNum representing the index of the line
	//		  An optional jumps argument for detecting infinite loops for goto
	// Output: Boolean 
	//		   True if hasError.
	//		   False if syntax is correct
	//
	// Notes: Does not handle infinite loops or invalid GoTo jumps.  Those are handled in
	//		  GenerateStepsArray when GoTo is processed.
	//		  Empty (whitespace) tokens are removed before processing so that no field will be empty
	hasError(tokens, lineNum, jumps = 0) {
		var lines = G.quill.getText().split("\n");
		// tokens = tokens.filter(noEmpty);
		var operator = this.trimColon(tokens[0].toLowerCase());
		if (operator == "createstate") {
			// Expected: CreateState name value
			if (tokens.length != 3) {
				// console.log("I was expecting 2 arguments.")
				G.errorManager.errors.push(new GomsError("invalid_args_create", lineNum));
				return true;
			} else if (this.stateTable[tokens[1]] != undefined) {
				G.errorManager.errors.push(new GomsError("invalid_var_create", lineNum));
				// console.log("'"+tokens[1]+"' already exists.");
				return true;
			}
		} else if (operator == "setstate") {
			// Expected: SetState name value
			if(tokens.length != 3){
				G.errorManager.errors.push(new GomsError("invalid_args_create", lineNum));
				// console.log("I was expecting 2 arguments.")
				return true;
			} else if(this.stateTable[tokens[1]] == undefined){
				// console.log("'"+tokens[1]+"' does not exist.")
				G.errorManager.errors.push(new GomsError("invalid_var_dne", lineNum));
				return true;
			} 
		} 
		else if (operator == "if") {
			// Expected: If state value
			if (tokens.length != 3) {
				G.errorManager.errors.push(new GomsError("invalid_args_create", lineNum));
				return true;
			} else if (this.stateTable[tokens[1]] == undefined){
				G.errorManager.errors.push(new GomsError("invalid_var_dne", lineNum));
				return true;
			} else {
				// Check if it's missing an endif
				if (this.findMatchingEndIf(lines, lineNum) == lines.length) {
					G.errorManager.errors.push(new GomsError("invalid_if_unclosed", lineNum));
					return true;
				}
			}
		} else if (operator == "endif") {
			if (tokens.length != 1) {
				G.errorManager.errors.push(new GomsError("invalid_endif", lineNum));
				return true;
			}
		} else if (operator == "goto") {
			// Expected: GoTo Goal: value (case can be lower and colon optional)
			if (tokens.length <= 2) {
				G.errorManager.errors.push(new GomsError("invalid_args_create", lineNum));
				return true;
			}
			tokens[1] = this.trimColon(tokens[1]);
			if (tokens.slice(0, 2).join(" ").toLowerCase() != "goto goal") {
				G.errorManager.errors.push(new GomsError("invalid_goto", lineNum));
				return true;
			}
			// Index all goals defined and check if goal exists
			this.indexGoalLines(lines);
			var goalLabel = tokens.slice(2, tokens.length).join(" ");
			var goalLine = this.goalTable[goalLabel];
			if (goalLine == undefined) {
				G.errorManager.errors.push(new GomsError("invalid_goal_dne", lineNum));
				return true;
			}
			if (jumps > 25) {
				G.errorManager.errors.push(new GomsError("infinite_loop", lineNum));
				return true;
			}
		}

		return false;
	}


	//Filter Method to get rid of empty strings in token array.  Taken from example
	//http://board.flashkit.com/board/showthread.php?805338-Remove-empty-elements-in-an-arry
	// noEmpty(item: * , index: int, array: Array) {
	// 	return item != "";
	// }


	// Purpose: removes all colons from a string to make it be optional for parsing
	// Input: String: operator string
	//	Example: "CreateState: goal_name value"
	//  Output: String: trimmed operator 
	//	Example: "CreateState goal_name value"
	trimColon(string) { //return String
		// var trimmed = string;
		// var colon = trimmed.indexOf(':');
		// while (colon != -1) {
		// 	trimmed = trimmed.substring(0, colon) + trimmed.substring(colon + 1, trimmed.length);
		// 	colon = trimmed.indexOf(':');
		// }
		return string.replace(":","").toLowerCase();
	}

	//Purpose:  Find the "beginIndex" used in process steps array. Should be the sum 
	//			of the length of all lines that came before. Necessary for line jumping
	// 			for if's and goTos.
	//
	//Input: Array lines: all lines in the editor (codeLines from generateStepArray).
	//Output: int beginIndex: the correct index to feed solarize function
	findBeginningIndex(lines, lineNumber) {
		var beginIndex = 0;
		for (var i = 0; i < lineNumber; i++) {
			beginIndex += lines[i].length + 1; //Plus new line character
		}
		return beginIndex;
	}
	
	//Purpose: Creates the stepArray to be processed.
	//Input: Array syntaxArray: created from solarizeLine().
	//		 int: lineIndex (current line being processed)
	//Output: none
	//Notes: created for Cog+ functionality.  Code was extracted from processStepArray.
	processBaseCogulatorLine(lineCompoments, lineIndex) {
		if (lineCompoments.error != null) G.errorManager.errors.push(new GomsError(lineCompoments.error, lineIndex));
		if (lineCompoments.components == null || lineCompoments.error != null) return; 
		
		let components = lineCompoments.components;
		var indentCount = components.indents;
		var stepOperator = components.operator;
		var stepLabel = components.label;
		var stepTime = components.parenthetical;
		var chunkNames = components.chunkNames;

		var methodGoal = "";
		var methodThread = "";
		var methodIndex = 0;

		if (stepOperator != "goal" && stepOperator != "also") {
			var goalAndThread = this.findGoalAndThread(indentCount); //determine the operator and thread
			methodGoal = goalAndThread[0];
			methodThread = goalAndThread[1];
			methodIndex = goalAndThread[2];
		} else {
			methodGoal = stepLabel;
			if (components.threadLabel == "!X!X!") {
				methodThread = this.newThreadNumber.toString();
				this.newThreadNumber++;
			} else {
				methodThread = components.threadLabel;
			}
		}

		//remove the top goal from the stack if we come back from its body
		if(indentCount < this.currentIndent)
		{
			for(var i = 0; i < (this.currentIndent - indentCount); i++)
			{
				var removedGoal = this.currentGoals.pop();
			}
		}
		//update the current indent for next time
		this.currentIndent = indentCount;

		if (stepOperator == "goal" || stepOperator == "also") {
			this.currentGoalLine = lineIndex;

			//add the goal to the stack when you see it
			this.currentGoals.push(stepLabel + "_" + lineIndex);
		}

		
		if (stepOperator.length > 0) { //if there are no errors in the line and an operator exists...
			var s = new Step(indentCount, 
								   methodGoal, 
								   methodThread,
								   methodIndex,
								   stepOperator, 
								   this.getOperatorTime(stepOperator, stepTime, stepLabel), 
								   this.getOperatorResource(stepOperator), 
								   stepLabel, 
								   lineIndex,
								   0, 
								   this.currentGoalLine,
								   chunkNames);

			//add the set of current goals to this step for use later in the ui
			s.goalMap = [];
			for(var i = 0; i < this.currentGoals.length; i++) {
				s.goalMap[this.currentGoals[i]] = this.currentGoals[i];
			}
			
			this.steps.push(s);
		}
	}


	removeGoalSteps() {
		this.goalSteps = [];
		for (var i = this.steps.length - 1; i > -1; i--) {
			if (this.steps[i].operator == "goal" || this.steps[i].operator == "also") {
				let goalStep = this.steps.splice(i, 1);
				this.goalSteps.push(goalStep);
			} 
		}
	}


	setPrevLineNo() {
		//steps[0] is set to 0 by default, all others should be updated
		for (var i = 1; i < this.steps.length; i++) {
			this.steps[i].prevLineNo = this.steps[i - 1].lineNo;
		}
	}


	//*** Second Pass interleaves the steps according to thread name
	processStepsArray() {
		do {
			var step = this.steps[0]; //look at the first step in the steps arraylist
			this.threadTracker[step.thread] = step.goal;

			//iterate through each thread in the tracker, and place one step from each active thread/goal
			for (var myKy in this.threadTracker) {
				var goal = this.threadTracker[myKy];
				var thred = myKy;
				this.interleaveStep(thred, goal);
			}

		} while (this.steps.length > 0);

		this.thrdOrdr.push("base");
		for (var myKey in this.threadTracker) {
			var thread = myKey;
			if (thread != "base") this.thrdOrdr.push(thread);
		}

	}

	interleaveStep(thread, goal) {
		for (var i = 0; i < this.steps.length; i++) {
			var step = this.steps[i];

			if (thread == "base") {
				if (step.thread == "base") {
					var t = this.findStartEndTime(step);
					step.startTime = t[0];
					step.endTime = t[1];
					this.intersteps.push(step);
					this.steps.splice(i, 1);
					break;
				}
			} else {
				if (step.thread == thread && step.goal == goal) {
					var th = this.findStartEndTime(step);
					step.startTime = th[0];
					step.endTime = th[1];
					this.intersteps.push(step);
					this.steps.splice(i, 1);
					break;
				}
			}

		}
	}

	findStartEndTime(step) {
		var resource = step.resource;
		var thread = step.thread;
		var method = step.goal
		var stepTime = step.time

		var zerodTO = new TimeObject(0, 0);
		var resourceTO;
		var threadTO;
		var methodTO;
		var resourceTime = 0;
		var threadTime = 0;
		var methodTime = 0;

		if (resource == "speech" || step.resource == "hear") resource = "verbalcoms";

		if (this.threadAvailability[thread] == null) {
			var prevLineNumberTime = this.getPreviousLineTime(step.prevLineNo);
			zerodTO.et = prevLineNumberTime;
			this.threadAvailability[thread] = zerodTO;
		}
		threadTO = this.threadAvailability[thread];
		threadTime = threadTO.et;

		var startTime = threadTime;
		var endTime = startTime + stepTime + this.cycleTime;

		if (resource != "system") {
			startTime = this.getResourceAvailability(resource, startTime, endTime, stepTime);
			endTime = startTime + stepTime + this.cycleTime;
		}

		//store the results for the next go round
		this.threadAvailability[thread] = new TimeObject(startTime, endTime);

		var reslt = [];
		reslt[0] = startTime;
		reslt[1] = endTime;

		return reslt;
	}


	getPreviousLineTime(lineNoToFind) {
		//retrieve the start time for the step previous to the current one
		for (var i = 0; i < this.intersteps.length; i++) {
			let step = this.intersteps[i];
			if (step.lineNo == lineNoToFind) {
				return step.startTime;
			}
		}

		//this should never happen...
		return 0;
	}

	getResourceAvailability(resource, startTime, endTime, stepTime) {
		//pull the resource array of TimeObjects associated with the resource
		var resourceArray = this.resourceAvailability[resource]; //time the resource becomes available
		for (var i = 0; i < resourceArray.length - 1; i++) {
			if (resourceArray[i].et < resourceArray[i + 1].st) { //this means there's a gap - it's worth digging further
				if (startTime >= resourceArray[i].et) { //if the resource availability occurs after the earliest possible start time, it's worth digging further
					if (endTime <= resourceArray[i + 1].st) { //... check to see if there's a gap large enough to insert the operator
						var gapTO = new TimeObject(Math.max(startTime, resourceArray[i].et), Math.max(endTime, resourceArray[i].et + stepTime + this.cycleTime));
						resourceArray.splice(i, 0, gapTO);
						return (Math.max(gapTO.st, startTime));
					}
				}
			}
		}


		var to = new TimeObject(Math.max(startTime, resourceArray[resourceArray.length - 1].et), Math.max(endTime, resourceArray[resourceArray.length - 1].et + stepTime + this.cycleTime));
		resourceArray.push(to);
		return (Math.max(to.st, startTime));
	}


	findGoalAndThread(indents) {
		var goalAndThread = [];

		//start last line entered in steps and search backard until you find the goal for line being processed
		if (this.steps.length > 0) {
			for (var i = this.steps.length - 1; i >= 0; i--) {
				if (this.steps[i].indentCount == indents - 1) { //if this step exists one level above the line being processed in the hiearchy
					if (this.steps[i].operator == "goal") {
						goalAndThread[0] = this.steps[i].goal;
						goalAndThread[1] = "base";
						goalAndThread[2] = i;
						return goalAndThread;
					} else if (this.steps[i].operator == "also") {
						goalAndThread[0] = this.steps[i].goal;
						goalAndThread[1] = this.steps[i].thread;
						goalAndThread[2] = i;
						return goalAndThread;
					}
				}
			}
		}

		goalAndThread[0] = "none";
		goalAndThread[1] = "base" // a thread without a goal should return base
		goalAndThread[2] = 0;
		return goalAndThread;
	}



	itIsAStepOperator(stepOperator) {
		//if the operator exists, return true
		for (var i = 0; i < G.operatorsManager.operators.length; i++) {
			if (stepOperator.toLowerCase() == operators[i].operator.toLowerCase()) return true;
		}
		return false; //could not find a match
	}


	getOperatorTime(operatorStr, customTime, lbl) {
		//match the operator string to a defined operator
		var operatorObj = new Operator();
		
		for (var i = 0; i < G.operatorsManager.operators.length; i++) {
			let oprtr = G.operatorsManager.operators[i];
			if (operatorStr.toLowerCase() == oprtr.operator.toLowerCase()) {
				operatorObj = oprtr
				break;
			}
		}

		if (operatorObj == null) return -1; //could not match the operator
		
		//assuming you were able to match the operator, calculate a time to return
		var rslt = 1.0;
		var labelUse = operatorObj.timeModifier;
		if (labelUse == null) labelUse = "";

		//if the custom time exists, use it, otherwise look up the time in the operators arrays
		if (customTime != "") {
			var parts = customTime.split(' ');
			for (var p = 0; p < parts.length; p++) {
				if (parts[p].length == 0) {
				parts.splice(p, 1);
				p--;
			  }
			}
						
			if (G.stringUtils.trim(parts[1]) == "ms" || G.stringUtils.trim(parts[1]) == "milliseconds") {
				return Number(parts[0]);
			} else if (G.stringUtils.trim(parts[1]) == "seconds") {
				return Number(parts[0] * 1000);
			} else if (G.stringUtils.trim(parts[1]) == "syllables") {
				rslt = Number(parts[0] / 2); //syllable time should be half of whole word time, which is used for op.time
			}
		} else if (operatorStr == "say" || operatorStr == "hear" || labelUse.indexOf("count_label_words") > -1) { //if there's no customTime, use the number of words in the lbl
			rslt = this.removeConsectiveWhiteSpaces(lbl).split(' ').length;
		} else if (operatorStr == "type" || operatorStr == "tap" || labelUse.indexOf("count_label_characters") > -1) {
			var leftAngleBracketIndices = lbl.match(/</g);
			var rightAngleBracketIndices = lbl.match(/>/g);
			//because brackets are used for chunk naming, that should be removed from the lable length count if used in something like a Type operator
			if (leftAngleBracketIndices != null && rightAngleBracketIndices != null) {
				if (leftAngleBracketIndices.length == rightAngleBracketIndices.length) rslt = lbl.length - leftAngleBracketIndices.length - rightAngleBracketIndices.length;
				else rslt = lbl.length; //if the operator is "type", figure out how many characters are in the string and save that as result
			} else {
				rslt = lbl.length; //if the operator is "type", figure out how many characters are in the string and save that as result
			}
		}


		return Number(operatorObj.time) * rslt;
	}


	removeConsectiveWhiteSpaces(lbl) {
		while (lbl.search('  ') > -1) lbl = lbl.split('  ').join(' ');
		return lbl;
	}

	getOperatorResource(operator) {
		//if the custom exists, use it, otherwise look up the time in the operators arrays
		for (var i = 0; i < G.operatorsManager.operators.length; i++) {
			let op = G.operatorsManager.operators[i];
			if (operator.toLowerCase() == op.operator.toLowerCase()) {
				return op.resource.toLowerCase();
			}
		}
		return "no match"; //could not find a match
	}


	// Purpose: removes spaces and periods from front of line so that we can identify the operator
	// Input: String: raw line 
	//	Example: "...CreateState goal_name value"
	// Output: String: trimmed line 
	//	Example: "CreateState goal_name value"
	trimIndents(line) {
		while (line.length > 0 && line.charAt(0) == ' ' || line.charAt(0) == '.') {
			line = line.substr(1);
		}
		return line;
	}

	// Purpose: Creates new state in the stateTable, all values are represented as strings.
	// Input: String key, String value (target1, visited)
	// Output: none
	// SideEffect:  An new entry in global stateTable is added
	createState(key, value) {
		this.stateTable[key] = value;
	}

	// Purpose: Changes an existing state in the stateTable, all values are represented as strings.
	// Input: String key, String value (target1, visited)
	// Output: none
	// SideEffect:  An existing entry in global stateTable is changed
	setState(key, value) {
		this.stateTable[key] = value;
	}

	// Purpose: finds the lineNumbers of all goals in the program and stores them in the goalTable
	// 			The value is an Object with attributes lineNo, start (start of actual steps), end
	// Input: Array of lines representing the text on the editor
	// Output: none
	// SideEffect: makes entries of all the goals in the model in $.goalTable
	indexGoalLines(lines) {
		for (var i = 0; i < lines.length; i++) {
			var tokens = this.trimIndents(lines[i]).split(' ');
			var operator = this.trimColon(tokens[0]);
			if (operator == "goal") {
				// Goal line assumed to be in the form "goal goal_name"
				tokens[1] = tokens[1].replace(":","");
				var goalName = tokens.slice(1, tokens.length).join(" ");
				this.goalTable[goalName] = i;
			}
		}
	}

	// Purpose: Finds next value of lineCounter. 
	// Input:  Array lines:  Model text deliniated by line
	//		   int lineCounter: lineNumber of Current If-statement
	//
	// Output: int: the lineNumber of the next statement to be processed
	// ifTrue: lineCounter - continue processing where you are.
	// ifFalse: the line of the matching EndIf;
	nextIfLine(lines, lineCounter) {
		var ifIsTrue = this.evaluateIfStatement(this.trimIndents(lines[lineCounter]));
		if (ifIsTrue) {
			//do not jump any lines, lineCounter in parseloop will iterate to next line
			return lineCounter;
		} else {
			//Jump to the end of the ifStatement
			return this.findMatchingEndIf(lines, lineCounter);
		}
	}

	// Purpose: Returns the lineNumber of the matching EndIf
	// Input: Array lines, representing all of the lines of the model
	//		  int lineNum, the lineNumber of the current if statement
	// Output: int of the matching EndIf
	//		   if no ENDIF is found, returns entire length of lines
	// Notes: Handles possible nested ifs
	// SideEffect: None besides solarizing the line
	findMatchingEndIf(lines, lineNum) {
		var numIfs = 0;
		var numEndIfs = 0;
		for (var i = lineNum; i < lines.length; i++) {
			var tokens = this.trimColon(this.trimIndents(lines[i])).split(' ');
			if (tokens[0].toLowerCase() == "if") { //Handles nested ifs
				numIfs++; //for each if found, it must find an additional endif
			} else if (tokens[0].toLowerCase() == "endif") {
				numEndIfs++;
				if (numEndIfs == numIfs) {
					//trace("found endif on line "+i + " for if line "+ifObject.ifLine);
					return i;
				}
			}
		}
		return lines.length;
	}


	// Purpose: Checks the truth value of the input against the statetable
	// Input: String ifLine: already frontTrimmed line (If this_state isTrue)
	// Output: Boolean: if an entry in StateTable matches exactly the key and value
	// Hint: if debugging, check that whitespace characters have been trimmed
	// in both the table and the input
	evaluateIfStatement(ifLine) {
		//input must be in the form "If key value"
		var key = ifLine.split(' ')[1];
		var ifValue = ifLine.split(' ')[2];
		var tableValueString = this.stateTable[key];

		return (tableValueString == ifValue);
	}

}

G.gomsProcessor = new GomsProcessor();
