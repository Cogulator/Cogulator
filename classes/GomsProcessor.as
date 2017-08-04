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

package classes {
	import flash.utils.Dictionary;
	import classes.SyntaxColor;
	import classes.TimeObject;
	import classes.Step;
	import classes.StringUtils;
	import com.inruntime.utils.*;


	public class GomsProcessor {
		private static var $: Global = Global.getInstance();

		private static var cntrlmthds: Array; //list of methods in the control loop for overview timeline
		private static var allmthds: Array;
		private static var steps: Array;
		private static var intersteps: Array; //interleaved steps
		private static var thrdOrdr: Array; //an order of threads for gantt chart time line annotation

		private static var threadTracker: Dictionary; // tracks the active method for each thread
		private static var resourceAvailability: Dictionary;
		private static var threadAvailability: Dictionary;

		private static var newThreadNumber: int; // = 0; //used as a thread name for "Also" when one is not provided

		private static var maxEndTime: Number; // = 0;
		private static var cycleTime: Number;


		private static var stateTable: Dictionary = new Dictionary();
		private static var goalTable: Dictionary = new Dictionary();

		public static function processGOMS(): Array {
			maxEndTime = 0;
			cycleTime = 0; //ms. 50 ms Based on production rule cycle time.  Bovair & Kieras/Card, Moran & Newell
			newThreadNumber = 0;

			cntrlmthds = new Array();
			allmthds = new Array();
			steps = new Array();
			intersteps = new Array();
			thrdOrdr = new Array();

			threadTracker = new Dictionary(); //hashmap that tracks that active goal for each thread
			resourceAvailability = new Dictionary();
			threadAvailability = new Dictionary();

			//(<resource name>, <time resource comes available>)
			var to: TimeObject = new TimeObject(0, 0);
			var verbalcomsArray: Array = new Array(to);
			var seeArray: Array = new Array(to);
			var cognitiveArray: Array = new Array(to);
			var handsArray: Array = new Array(to);
			resourceAvailability["verbalcoms"] = verbalcomsArray;
			resourceAvailability["see"] = seeArray;
			resourceAvailability["cognitive"] = cognitiveArray;
			resourceAvailability["hands"] = handsArray;


			for (var errorKey: Object in $.errors) delete $.errors[errorKey]; //clear out all $.errors
			for (var stateKey: Object in stateTable) delete stateTable[stateKey]; //clear out all $.errors
			for (var goalKey: Object in goalTable) delete goalTable[goalKey]; //clear out all $.errors

			generateStepsArray();


			if (steps.length > 0) processStepsArray(); //processes and then interleaves steps
			
			return (new Array(maxEndTime, thrdOrdr, threadAvailability, intersteps, allmthds, cntrlmthds));
		}


		
		// Purpose: Iterates through the model to color, error check, and create the "Step" object.
		// Input: None
		// Output: None
		//
		// Notes: Cog+ modifies this method heavily.  New operators modify the line pointer during execution
		private static function generateStepsArray() {
			var codeLines: Array = $.codeTxt.text.split("\r");
			var beginIndex: int = 0;
			var endIndex: int = codeLines[0].length;
			stateTable = new Dictionary();
			var jumps:int = 0;
			//Color all lines since GoTo skips some lines, but we don't want them to be gray. 
			SyntaxColor.solarizeAll($.codeTxt);
			
			for (var lineIndex: int = 0; lineIndex < codeLines.length; lineIndex++) {
				var line = codeLines[lineIndex];
				beginIndex = findBeginningIndex(codeLines, lineIndex);
				endIndex = beginIndex + line.length;

				if (StringUtils.trim(line) != "") {
					var frontTrimmedLine: String = clean(codeLines[lineIndex]);
					var tokens: Array = frontTrimmedLine.split(' ');
					tokens = tokens.filter(noEmpty);
					switch (tokens[0].toLowerCase()) {
						case "createstate":
							if (hasError(tokens, lineIndex)) {
								SyntaxColor.ErrorColorLine(lineIndex);
							} else {
								createState(tokens[1], tokens[2]);
							}
							break;
						case "setstate":
							if (hasError(tokens, lineIndex)) {
								SyntaxColor.ErrorColorLine(lineIndex);
							} else {
								setState(tokens);
							}
							break;
						case "if":
							if (hasError(tokens, lineIndex)) {
								SyntaxColor.ErrorColorLine(lineIndex);
							} else {
								//should return int of next line to be processed based on the resolution
								//of the if statement.
								lineIndex = nextIfLine(codeLines, lineIndex);
							}
							break;
						case "endif":
							if (hasError(tokens, lineIndex)) {
								SyntaxColor.ErrorColorLine(lineIndex);
							}
							//ignore EndIfs, but are useful in processing original statement.
							break;
						case "goto":
							//Checks for infinite loops and syntax errors
							//Jumps are limited to 25, after which all jumps will be considered errors and not processed.
							if (hasError(tokens, lineIndex, jumps)) {
								SyntaxColor.ErrorColorLine(lineIndex);
							} else {
								//line should be in the form "GoTo Goal: goal_name" (name can contain spaces, colons are optional) 
								var goalLabel: String = tokens.slice(2, tokens.length).join(" ");
								if(goalTable[goalLabel] !== undefined){
									lineIndex = goalTable[goalLabel] - 1;
									jumps++;
								} else {
									SyntaxColor.ErrorColorLine(lineIndex);
								}
							}
							break;
						default:
							var syntaxArray: Array = SyntaxColor.solarizeLineNum($.codeTxt, lineIndex, beginIndex, endIndex);
							processBaseCogulatorLine(syntaxArray, lineIndex);
					}
				}
			}
			removeGoalSteps();
			setPrevLineNo();

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
		
		private static function hasError(tokens: Array, lineNum:int, jumps:int = 0): Boolean {
			var lines:Array = $.codeTxt.text.split("\r");
			tokens = tokens.filter(noEmpty);
			var operator = tokens[0].toLowerCase();
			if (operator == "createstate") {
				//CreateState name value extraStuff
				//CreateState name
				//Name already exists
				if (tokens.length != 3) {
					$.errors[lineNum] = "I was expecting 2 arguments."
					return true;
				} else if (stateTable[tokens[1]] != undefined) {
					$.errors[lineNum] = "'"+tokens[1]+"' already exists."
					return true;
				}
			} else if (operator == "setstate") {
				if(tokens.length != 3){
					$.errors[lineNum] = "I was expecting 2  arguments."
					return true;
				} else if(stateTable[tokens[1]] == undefined){
					$.errors[lineNum] = "'"+tokens[1]+"' does not exist."
					return true;
				} 
			} else if (operator == "if") {
				if (tokens.length != 3) {
					$.errors[lineNum] = "I was expecting 2 arguments."
					return true;
				} else if (stateTable[tokens[1]] == undefined){
					$.errors[lineNum] = "'"+tokens[1]+"' does not exist."
					return true;
				} else {
					// Check if it's missing an endif
					if (findMatchingEndIf(lines, lineNum) == lines.length) {
						$.errors[lineNum] = "I was expecting an EndIf."
						return true;
					}
				}
			} else if (operator == "endif") {
				if (tokens.length != 1) {
					$.errors[lineNum] = "I was not expecting any arguments."
					return true;
				}
			} else if (operator == "goto") {
				if (tokens.length <= 2) {
					$.errors[lineNum] = "Goto takes the form \"Goto Goal: goal_name\"."
					return true;
				}
				if (clean(tokens.slice(0, 2).join(" ").toLowerCase()) != "goto goal") {
					//trace("cleaned up goto "+clean(tokens.slice(0, 2).join(" ").toLowerCase()));
					$.errors[lineNum] = "I was expecting something like 'goto goal'."
					return true;
				}
				// Index all goals defined and check if goal exists
				indexGoalLines(lines);
				var goalLabel: String = tokens.slice(2, tokens.length).join(" ");
				var goalLine = goalTable[goalLabel];
				if (goalLine == undefined) {
					$.errors[lineNum] = "'"+goalLabel+"' does not exist."
					return true;
				}
				if (jumps > 25) {
					$.errors[lineNum] = "I ran into an infinite loop."
					return true;
				}
			}
			
			return false;
		}

		
		//Filter Method to get rid of empty strings in token array.  Taken from example
		//http://board.flashkit.com/board/showthread.php?805338-Remove-empty-elements-in-an-arry
		private static function noEmpty(item: * , index: int, array: Array): Boolean {
			return item != "";
		}

		// Purpose: removes comments, unnecessary characters (see trim), indents, and colons
		// Input: String: raw line 
		//	 	  Example: "...CreateState goal_name value *this is a comment"
		// Output: String: trimmed line 
		// Example: "CreateState goal_name value"
		public static function clean(s: String): String {
			//Remove comment
			var commentStart:int = s.indexOf("*");
			if (commentStart >= 0) {
				s = s.substring(0, commentStart); //remove comments from what you're evaluating
			}
			return trimColon(trimIndents(trim(s)));
		}
		
		
		// Purpose: removes all colons from a string to make it be optional for parsing
		// Input: String: operator string
		//	Example: "CreateState: goal_name value"
		//  Output: String: trimmed operator 
		//	Example: "CreateState goal_name value"
		public static function trimColon(string: String): String {
			var trimmed:String = string;
			var colon:int = trimmed.indexOf(':');
			while (colon != -1) {
				trimmed = trimmed.substring(0, colon) + trimmed.substring(colon + 1, trimmed.length);
				colon = trimmed.indexOf(':');
			}
			return trimmed;
		}
			
		private static function trim(s:String):String {
			return s.replace(/^[\s|\t|\n]+|[\s|\t|\n]+$/gs, '');
		}

		//Purpose:  Find the "beginIndex" used in process steps array. Should be the sum 
		//			of the length of all lines that came before. Necessary for line jumping
		// 			for if's and goTos.
		//
		//Input: Array lines: all lines in the editor (codeLines from generateStepArray).
		//Output: int beginIndex: the correct index to feed solarize function
		private static function findBeginningIndex(lines: Array, lineNumber): int {
			var beginIndex: int = 0;
			for (var i: int = 0; i < lineNumber; i++) {
				beginIndex += lines[i].length + 1; //Plus new line character
			}
			return beginIndex;
		}

		//Purpose: Creates the stepArray to be processed.
		//Input: Array syntaxArray: created from solarizeLine().
		//		 int: lineIndex (current line being processed)
		//Output: none
		//Notes: created for Cog+ functionality.  Code was extracted from processStepArray.
		private static function processBaseCogulatorLine(syntaxArray: Array, lineIndex: int) {
			var indentCount: int = syntaxArray[0];
			var stepOperator: String = syntaxArray[1];
			var stepLabel: String = trimLabel(syntaxArray[2]);
			var stepTime: String = syntaxArray[3];
			var chunkNames: Array = syntaxArray[7];

			var methodGoal, methodThread: String;
			if (stepOperator != "goal" && stepOperator != "also") {
				var goalAndThread: Array = findGoalAndThread(indentCount); //determine the operator and thread
				methodGoal = goalAndThread[0];
				methodThread = goalAndThread[1];
			} else {
				methodGoal = stepLabel;
				if (syntaxArray[4] == "!X!X!") {
					methodThread = String(newThreadNumber);
					newThreadNumber++;
				} else {
					methodThread = syntaxArray[4];
				}

				allmthds.push(stepLabel); //for charting in GanttChart
				if (indentCount == 1) cntrlmthds.push(stepLabel); //for charting in GanttChart
			}

			if (syntaxArray[5] == false && stepOperator.length > 0) { //if there are no errors in the line and an operator exists...
				var s: Step = new Step(indentCount, methodGoal, methodThread, stepOperator, getOperatorTime(stepOperator, stepTime, stepLabel), getOperatorResource(stepOperator), stepLabel, lineIndex, 0, chunkNames);
				steps.push(s);
			}
		}


		private static function removeGoalSteps() {
			for (var i: int = steps.length - 1; i > -1; i--) {
				if (steps[i].operator == "goal" || steps[i].operator == "also") steps.splice(i, 1);
			}
		}


		private static function setPrevLineNo() {
			//steps[0] is set to 0 by default, all others should be updated
			for (var i: int = 1; i < steps.length; i++) {
				steps[i].prevLineNo = steps[i - 1].lineNo;
			}
		}


		//*** Second Pass interleaves the steps according to thread name
		private static function processStepsArray() {
			do {
				var step: Step = steps[0]; //look at the first step in the steps arraylist
				threadTracker[step.thred] = step.goal;

				//iterate through each thread in the tracker, and place one step from each active thread/goal
				for (var myKy: String in threadTracker) {
					var goal: String = threadTracker[myKy];
					var thred: String = myKy;
					interleaveStep(thred, goal);
				}

			} while (steps.length > 0);

			thrdOrdr.push("base");
			for (var myKey: String in threadTracker) {
				var thread: String = myKey;
				if (thread != "base") thrdOrdr.push(thread);
			}
			
		}


		private static function interleaveStep(thread: String, goal: String) {
			for (var i: int = 0; i < steps.length; i++) {
				var step: Step = steps[i];

				if (thread == "base") {
					if (step.thred == "base") {
						var t: Array = findStartEndTime(step);
						step.srtTime = t[0];
						step.endTime = t[1];
						intersteps.push(step);
						steps.splice(i, 1);
						break;
					}
				} else {
					if (step.thred == thread && step.goal == goal) {
						var th: Array = findStartEndTime(step);
						step.srtTime = th[0];
						step.endTime = th[1];
						intersteps.push(step);
						steps.splice(i, 1);
						break;
					}
				}

			}
		}


		private static function findStartEndTime(step: Step): Array {
			var resource: String = step.resource;
			var thread: String = step.thred;
			var method: String = step.goal
			var stepTime: Number = step.time

			var zerodTO: TimeObject = new TimeObject(0, 0);
			var resourceTO: TimeObject;
			var threadTO: TimeObject;
			var methodTO: TimeObject;
			var resourceTime: Number = 0;
			var threadTime: Number = 0;
			var methodTime: Number = 0;

			if (resource == "speech" || step.resource == "hear") resource = "verbalcoms";

			if (threadAvailability[thread] == null) {
				var prevLineNumberTime = getPreviousLineTime(step.prevLineNo);
				zerodTO.et = prevLineNumberTime;
				threadAvailability[thread] = zerodTO;
			}
			threadTO = threadAvailability[thread];
			threadTime = threadTO.et;

			var startTime: Number = threadTime;
			var endTime: Number = startTime + stepTime + cycleTime;

			if (resource != "system") {
				startTime = getResourceAvailability(resource, startTime, endTime, stepTime);
				endTime = startTime + stepTime + cycleTime;
			}

			//store the results for the next go round
			threadAvailability[thread] = new TimeObject(startTime, endTime);

			var reslt: Array = new Array();
			reslt[0] = startTime;
			reslt[1] = endTime;

			return reslt;
		}


		private static function getPreviousLineTime(lineNoToFind: int): Number {
			//retrieve the start time for the step previous to the current one
			for each(var step in intersteps) {
				if (step.lineNo == lineNoToFind) {
					return step.srtTime;
				}
			}

			//this should never happen...
			return 0;
		}

		private static function getResourceAvailability(resource: String, startTime: Number, endTime: Number, stepTime: Number): Number {
			//pull the resource array of TimeObjects associated with the resource
			var resourceArray: Array = resourceAvailability[resource]; //time the resource becomes available
			for (var i: int = 0; i < resourceArray.length - 1; i++) {
				if (resourceArray[i].et < resourceArray[i + 1].st) { //this means there's a gap - it's worth digging further
					if (startTime >= resourceArray[i].et) { //if the resource availability occurs after the earliest possible start time, it's worth digging further
						if (endTime <= resourceArray[i + 1].st) { //... check to see if there's a gap large enough to insert the operator
							var gapTO: TimeObject = new TimeObject(Math.max(startTime, resourceArray[i].et), Math.max(endTime, resourceArray[i].et + stepTime + cycleTime));
							resourceArray.splice(i, 0, gapTO);
							return (Math.max(gapTO.st, startTime));
						}
					}
				}
			}


			var to: TimeObject = new TimeObject(Math.max(startTime, resourceArray[resourceArray.length - 1].et), Math.max(endTime, resourceArray[resourceArray.length - 1].et + stepTime + cycleTime));
			resourceArray.push(to);
			return (Math.max(to.st, startTime));
		}


		private static function findGoalAndThread(indents: int): Array {
			var goalAndThread: Array = new Array();

			//start last line entered in steps and search backard until you find the goal for line being processed
			if (steps.length > 0) {
				for (var i: int = steps.length - 1; i >= 0; i--) {
					if (steps[i].indentCount == indents - 1) { //if this step exists one level above the line being processed in the hiearchy
						if (steps[i].operator == "goal") {
							goalAndThread[0] = steps[i].goal;
							goalAndThread[1] = "base";
							return goalAndThread;
						} else if (steps[i].operator == "also") {
							goalAndThread[0] = steps[i].goal;
							goalAndThread[1] = steps[i].thred;
							return goalAndThread;
						}
					}
				}
			}

			goalAndThread[0] = "none";
			goalAndThread[1] = "base" // a thread without a goal should return base
			return goalAndThread;
		}


		private static function trimLabel(lbl: String): String {
			//trim white space from beginning of label
			while (lbl.substr(lbl.length - 1, 1) == " ") lbl = lbl.substr(0, lbl.length - 1);
			return lbl;
		}


		private static function itIsAStepOperator(stepOperator: String): Boolean {
			//if the operator exists, return true
			for each(var operator in $.operatorArray) {
				if (stepOperator.toLowerCase() == operator.appelation.toLowerCase()) return true;
			}
			return false; //could not find a match
		}


		private static function getOperatorTime(operatorStr: String, customTime: String, lbl: String): Number {
			//match the operator string to a defined operator
			//var operatorInfo:Array = new Array({resource: "", appelation: "", time: "", description: "", labelUse: ""});
			var operatorObj: Object = new Object();
			for each(var oprtr in $.operatorArray) {
				if (operatorStr.toLowerCase() == oprtr.appelation.toLowerCase()) {
					operatorObj = oprtr
					break;
				}
			}

			if (operatorObj == null) {
				return -1; //could not match the operator
			}

			//assuming you were able to match the operator, calculate a time to return
			var rslt: Number = 1.0;
			var labelUse: String = operatorObj.labelUse;
			if (labelUse == null) labelUse = "";

			//if the custom time exists, use it, otherwise look up the time in the operators arrays
			if (customTime != "") {
				var parts: Array = customTime.split(' ');
				if (StringUtils.trim(parts[1]) == "ms" || StringUtils.trim(parts[1]) == "milliseconds") {
					return Number(parts[0]);
				} else if (StringUtils.trim(parts[1]) == "seconds") {
					return Number(parts[0] * 1000);
				} else if (StringUtils.trim(parts[1]) == "syllables") {
					rslt = Number(parts[0] / 2); //syllable time should be half of whole word time, which is used for op.time
				}
			} else if (operatorStr == "say" || operatorStr == "hear" || labelUse.indexOf("count_label_words") > -1) { //if there's no customTime, use the number of words in the lbl
				rslt = removeConsectiveWhiteSpaces(lbl).split(' ').length;
			} else if (operatorStr == "type" || operatorStr == "tap" || labelUse.indexOf("count_label_characters") > -1) {
				var leftAngleBracketIndices: Array = lbl.match(/</g);
				var rightAngleBracketIndices: Array = lbl.match(/>/g);
				//because brackets are used for chunk naming, that should be removed from the lable length count if used in something like a Type operator
				if (leftAngleBracketIndices.length == rightAngleBracketIndices.length) rslt = lbl.length - leftAngleBracketIndices.length - rightAngleBracketIndices.length;
				else rslt = lbl.length; //if the operator is "type", figure out how many characters are in the string and save that as result
			}
			
			
			return Number(operatorObj.time) * rslt;
		}


		private static function removeConsectiveWhiteSpaces(lbl): String {
			while (lbl.search('  ') > -1) lbl = lbl.split('  ').join(' ');
			return lbl;
		}

		private static function getOperatorResource(operator: String): String {
			//if the custom exists, use it, otherwise look up the time in the operators arrays
			for each(var op in $.operatorArray) {
				if (operator.toLowerCase() == op.appelation.toLowerCase()) {
					return op.resource.toLowerCase();
				}
			}
			return "no match"; //could not find a match
		}


		private static function removeComments(commentedStr: String): String {
			//remove any comments from the line - they'll be ignored
			var index: int = commentedStr.indexOf("*");
			var noComment: String;

			if (index >= 0) noComment = commentedStr.substring(0, index);
			else noComment = commentedStr;

			return noComment;
		}

		// Purpose: removes spaces and periods from front of line so that we can identify the operator
		// Input: String: raw line 
		//	Example: "...CreateState goal_name value"
		// Output: String: trimmed line 
		//	Example: "CreateState goal_name value"
		private static function trimIndents(line: String): String {
			while (line.length > 0 && line.charAt(0) == ' ' || line.charAt(0) == '.') {
				line = line.substr(1);
			}
			return line;
		}

		// Purpose: Creates new state in the stateTable, all values are represented as strings.
		// Input: String key, String value (target1, visited)
		// Output: none
		// SideEffect:  An new entry in global stateTable is added
		private static function createState(key: String, value: String) {
			stateTable[key] = value;
		}

		// Purpose: Changes an existing state in the stateTable, all values are represented as strings.
		// Input: Array:String line		
		// 		  (Form) Operator, String key, String value 
		//		  Example: setstate, target1, visited  
		// Output: none
		// SideEffect:  An existing entry in global stateTable is changed
		private static function setState(line: Array) {
			if(line.length == 3){
				stateTable[line[1]] = line[2];
			}
			
		}

		// Purpose: finds the lineNumbers of all goals in the program and stores them in the $.goalTable
		// 			The value is an Object with attributes lineNo, start (start of actual steps), end
		// Input: Array of lines representing the text on the editor
		// Output: none
		// SideEffect: makes entries of all the goals in the model in $.goalTable
		private static function indexGoalLines(lines: Array): void {
			for (var i = 0; i < lines.length; i++) {
				var frontTrimmedLine: String = clean(lines[i]);
				var tokens: Array = frontTrimmedLine.split(' ');
				var operator: String = tokens[0].toLowerCase();
				if (operator == "goal") {
					// Goal line assumed to be in the form "goal goal_name"
					var goalName = tokens.slice(1, tokens.length).join(" ");
					goalTable[goalName] = i;
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
		private static function nextIfLine(lines: Array, lineCounter: int): int {
			var ifIsTrue: Boolean = evaluateIfStatement(trimIndents(lines[lineCounter]));
			if (ifIsTrue) {
				//do not jump any lines, lineCounter in parseloop will iterate to next line
				return lineCounter;
			} else {
				//Jump to the end of the ifStatement
				return findMatchingEndIf(lines, lineCounter);
			}
		}

		// Purpose: Returns the lineNumber of the matching EndIf
		// Input: Array lines, representing all of the lines of the model
		//		  int lineNum, the lineNumber of the current if statement
		// Output: int of the matching EndIf
		//		   if no ENDIF is found, returns entire length of lines
		// Notes: Handles possible nested ifs
		// SideEffect: None besides solarizing the line
		public static function findMatchingEndIf(lines: Array, lineNum: int): int {
			var numIfs: int = 0;
			var numEndIfs: int = 0;
			for (var i = lineNum; i < lines.length; i++) {
				SyntaxColor.solarizeLine(i);
				var frontTrimmedLine: String = clean(lines[i]);
				var tokens: Array = frontTrimmedLine.split(' ');
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
		private static function evaluateIfStatement(ifLine: String): Boolean {
			//input must be in the form "If key value"
			var key: String = ifLine.split(' ')[1];
			var ifValue: String = ifLine.split(' ')[2];
			var tableValueString = stateTable[key];

			return (tableValueString == ifValue);
		}
		
	}
}
