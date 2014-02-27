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
	import flash.text.TextFormat;
	import classes.WrappedLineUtils;
	import classes.SolarizedPalette;
	import com.inruntime.utils.*;

	
	public class SyntaxColor {
		private static var $:Global = Global.getInstance();
		private static var indents:int;
		private static var goalLine:Boolean;
		private static var operator:String;
		private static var lineLabel:String;
		private static var time:String;
		private static var threadLabel:String;
		private static var errorFixed:Boolean;
		
		private static const black:TextFormat = new TextFormat();
		private static const grey:TextFormat = new TextFormat();
		private static const blue:TextFormat = new TextFormat();
		private static const orange:TextFormat = new TextFormat();
		private static const green:TextFormat = new TextFormat();
		private static const red:TextFormat = new TextFormat();
		private static const magenta:TextFormat = new TextFormat();
		private static const errorred:TextFormat = new TextFormat();
		
		static var methods:Array = ["Task_Method:", "Goal:", "Also:", "as"];
		static var errorInLine:Boolean = false;
		
		{
			black.color = SolarizedPalette.black;
			grey.color = SolarizedPalette.grey;
			blue.color = SolarizedPalette.blue;
			orange.color = SolarizedPalette.orange;
			green.color = SolarizedPalette.green;
			red.color = SolarizedPalette.red;
			magenta.color = SolarizedPalette.magenta;
			errorred.color = SolarizedPalette.errorred;
		}
		
		
		public static function solarizeAll():void{
			var codeLines:Array = $.codeTxt.text.split("\r");
			var beginIndex:int = 0;
			var endIndex:int = codeLines[0].length;
			for (var key:Object in $.errors) delete $.errors[key];  //clear out all $.errors

			for (var lineIndex:int = 0; lineIndex < codeLines.length; lineIndex++ ) {	
				var line = codeLines[lineIndex];
				endIndex = beginIndex + line.length;
				if (trim(line) != "") solarizeLineNum(lineIndex, beginIndex, endIndex);
				beginIndex = endIndex + 1;
			}
		}
		
		
		public static function solarizeSelectedLine():Boolean {
			//get line number based on caret position
			var lineNumber = WrappedLineUtils.getLineNumber($.codeTxt, $.codeTxt.caretIndex);
				lineNumber--;
			var begindex = WrappedLineUtils.getLineIndex($.codeTxt, lineNumber);
			var endex = WrappedLineUtils.getLineEndIndex($.codeTxt, lineNumber);
				//endex--;
						
			return (solarizeLineNum(lineNumber, begindex, endex)[6]);
		}
		

			
		//0: Number of Indents
		//1: Operator
		//2: Label
		//3: Custom Time (if used)
		//4: Thread Label
		//5: Error in line boolean
		//6: Error fixed in line boolean - the one non-Goms processor calls are looking for
		//public static function solarizeLineNum(lineNum:int):Array {
		public static function solarizeLineNum(lineNum:int, beginIndex:int = -1, endIndex:int = -1):Array {
			time = "";
			
			var lineIsInErrors:Boolean = false;
			if ($.errors[lineNum] != undefined) lineIsInErrors = true;
			errorInLine = false;
			
			if(beginIndex == -1) {
				beginIndex = findBeginIndex();
				endIndex = findEndIndex(beginIndex);
			}
			
			var index:int;
			var lineStartIndex:int = beginIndex;
			
			var lineTxt:String = $.codeTxt.text.substring(beginIndex, endIndex);	
			delete $.errors[lineNum];

			//     -start by setting the whole line to grey
			if (beginIndex > -1 && endIndex <= $.codeTxt.length) $.codeTxt.setTextFormat(grey, beginIndex, endIndex);
			
			//    -evaluate comments
			index = lineTxt.indexOf("*");
			if (index >= 0) {
				lineTxt = lineTxt.substring(0, index); //remove comments from what you're evaluating
			}
								
			
			indents = 0;
			if (trim(lineTxt) != "") {			
				//    -evaluate indents
				
				for (var d:int = 1; d < lineTxt.length; d++) {
					if (lineTxt.charAt(d) != "." && lineTxt.charAt(d) != " ") break;
				}
				
				indents = lineTxt.substring(0, d).split(".").length;
				$.codeTxt.setTextFormat(black, beginIndex + 0, beginIndex + d);
				
				
				//    -evaluate whether operator line or method control line
				index = findIndentEnd(lineTxt);
				endIndex = findItemEnd(index, lineTxt);
				if (endIndex != 0) {
						operator = lineTxt.substring(index, endIndex).toLowerCase();
						operator = trim(operator);
						goalLine = false;
					for each (var method in methods) {
						if (operator == method.toLowerCase()) {
							goalLine = true;
							break;
						}
					}
					if (goalLine) solarizeGoalLine(lineTxt, index, lineNum, beginIndex, endIndex, lineStartIndex);
					else solarizeOperatorLine(lineTxt, index, lineNum, beginIndex, endIndex, lineStartIndex);
				}
			} else return new Array(0, "goal:", "", "", "", false, false); //returning true here means it won't be included in the interleaving process if it's a comment
					
			if (errorInLine == false && lineIsInErrors == true) errorFixed = true; //true means an error was fixed
			else errorFixed = false;
			
			return new Array(indents, operator, lineLabel, time, threadLabel, errorInLine, errorFixed);
		}
		
		
		private static function solarizeGoalLine(lineTxt:String, index:int, lineNum:int, beginIndex:int, endIndex:int, lineStartIndex:int):void {
			$.codeTxt.setTextFormat(magenta, beginIndex + index, beginIndex + endIndex);
			
			//    -evaluate method name
			index = findNextItem(endIndex, lineTxt);
			endIndex = findLabelEnd(lineTxt, "as ");
			
			lineLabel = lineTxt.substring(index, endIndex);
			threadLabel = "base"; //set here, may be modified by also method below;
			if (lineLabel.length > 0) $.codeTxt.setTextFormat(black, beginIndex + index, beginIndex + endIndex);
			
			index = lineTxt.toLowerCase().indexOf("as ");
			endIndex = index + 3;
			if (operator == "also:"){
				threadLabel = "!X!X!"; 
				if (index > -1) {// if "as" is used
					//set "as" magenta
					$.codeTxt.setTextFormat(magenta, beginIndex + index, beginIndex + endIndex);
					//determine thread name & color code
					index = findNextItem(endIndex, lineTxt);
					endIndex = index + lineTxt.length;
					threadLabel = lineTxt.substring(index, endIndex);
					if (threadLabel.length > 0) $.codeTxt.setTextFormat(black, beginIndex + index, beginIndex + index + threadLabel.length);
				}
			}
		}
		
		
		
		private static function solarizeOperatorLine(lineTxt:String, index:int, lineNum:int, beginIndex:int, endIndex:int, lineStartIndex:int):void {
			threadLabel = ""; //setting for the return array			
			
			//    -evaluate operator
			var match:Boolean = false;
			for each (var op in $.operatorArray) {
				if (operator == op.appelation.toLowerCase()) {
					match = true;
					break;
				}
			}
			if (operator.length > 0) {
				if (!match) {
					$.errors[lineNum] = "Couldn't find an operator.";
					$.codeTxt.setTextFormat(errorred, beginIndex + index, beginIndex + endIndex);
					errorInLine = true;
				} else $.codeTxt.setTextFormat(blue, beginIndex + index, beginIndex + endIndex);
			}
				
				
			//    -evaluate label
			index = findNextItem(endIndex, lineTxt);
			endIndex = findLabelEnd(lineTxt, "(");
			lineLabel = lineTxt.substring(index, endIndex);
			if (lineLabel.length > 0) $.codeTxt.setTextFormat(black, beginIndex + index, beginIndex + endIndex);
				
				
			//    -evaluate time
			time = "";
			var leftParenIndex:int = lineTxt.indexOf("(");
			var rightParenIndex:int = lineTxt.indexOf(")");
			if (leftParenIndex > -1) {
				$.codeTxt.setTextFormat(black, beginIndex + leftParenIndex, beginIndex + leftParenIndex + 1); //set right paren to black
				
				//if the "(" marker exists
				if (rightParenIndex > -1 && rightParenIndex > leftParenIndex) {  //if the ")" marker exists and occurs after the left marker					
					$.codeTxt.setTextFormat(black, beginIndex + rightParenIndex, beginIndex + rightParenIndex + 1); //set right paren to black
					
					//find what's in the number position
					index = findNextItem(leftParenIndex + 1, lineTxt);
					endIndex = findItemEnd(index, lineTxt);
					var timeValue:String = lineTxt.substring(index, endIndex);
						timeValue = trim(timeValue);
					if ( isNaN(Number(timeValue) )  ) {
						$.errors[lineNum] = "I was expecting a number after the left parenthesis.";
						if (String(timeValue).length > 0) {
							$.codeTxt.setTextFormat(errorred, beginIndex + index, beginIndex + endIndex);
							time = ""; //if there is an error, blank out time so you don't try to evaluate it GomsProcessor
							errorInLine = true;
						} 
					} else {
						time = String(timeValue);
						$.codeTxt.setTextFormat(black, beginIndex + index, beginIndex + endIndex);
					}

					//find what's in the units position
					index = findNextItem(endIndex, lineTxt);
					endIndex = findLabelEnd(lineTxt,")") + 1;
					//endIndex = findItemEnd(lineTxt.indexOf(")"), lineTxt) - 1;
					var timeUnits:String = (lineTxt.substring(index, endIndex)).toLowerCase();
						timeUnits = trim(timeUnits);
					if (String(timeValue).length > 0) { //only continue with the evaluation if you have a number in the first position
						if (timeUnits != "syllables" && timeUnits != "seconds" && timeUnits != "milliseconds" && timeUnits != "ms") {
							$.errors[lineNum] = "The modifier can be 'seconds', 'milliseconds', or 'ms'";
							if (timeUnits.length > 0) { 
								$.codeTxt.setTextFormat(errorred, beginIndex + index, beginIndex + endIndex);
								time = ""; //if there is an error, blank out time so you don't try to evaluate it GomsProcessor
								errorInLine = true;
							} 
						} else  {
							time = time + " " + timeUnits;
							$.codeTxt.setTextFormat(green, beginIndex + index, beginIndex + endIndex); //set units to green
						}
					}
					
				} else if (rightParenIndex < leftParenIndex && rightParenIndex > - 1) { //if there is a right paren before the left paren
						$.errors[lineNum] = "I found a right paren before the left paren";
						time = ""; //if there is an error, blank out time so you don't try to evaluate it GomsProcessor
						errorInLine = true;
						$.codeTxt.setTextFormat(errorred, beginIndex + rightParenIndex, beginIndex + rightParenIndex + 1);
				} else { // if there is a left paren with no right paren...
					$.errors[lineNum] = "I was expecting a right parenthesis.";
					time = ""; //if there is an error, blank out time so you don't try to evaluate it GomsProcessor
					errorInLine = true;
					$.codeTxt.setTextFormat(errorred, beginIndex + leftParenIndex, beginIndex + lineTxt.length);
				}

			}
			
			
			
			/*index = endIndex + 2; //end index is the character before the break string - move foward to get to the parenthatical and then past it
			if (lineTxt.indexOf("(") > -1) { //if the "(" marker exists
				endIndex = findLabelEnd(lineTxt, ")");
				endIndex++;
				if (lineTxt.indexOf(")") > -1) { //if the ")" marker exists
					var pattern:RegExp = /( )\1+/gi;
					time = lineTxt.substring(index, endIndex);
					time = time.replace(pattern, '$1'); //removes duplicate white spaces
					
					var timeParts:Array = time.split(/\s/);
					
					if (timeParts.length == 2) {
						var codeTxtIndex:int = index + beginIndex;
						if (   isNaN( Number(timeParts[0]) )   ) {
							$.errors[lineNum] = "I was expecting a number after the left parenthesis.";
							if (timeParts[1].length > 0) {
								$.codeTxt.setTextFormat(errorred, codeTxtIndex, codeTxtIndex + timeParts[0].length);
								time = ""; //if there is an error, blank out time so you don't try to evaluate it GomsProcessor
								errorInLine = true;
							}
						} else $.codeTxt.setTextFormat(black, codeTxtIndex - 1, codeTxtIndex + timeParts[0].length);
					
					
						codeTxtIndex = codeTxtIndex + timeParts[0].length + 1;
						timeParts[2] = trim(timeParts[1]);
						if (timeParts[2].toLowerCase() != "syllables" && timeParts[2].toLowerCase() != "seconds" 
						  && timeParts[2].toLowerCase() != "milliseconds" 
						  && timeParts[2].toLowerCase() != "ms") {
							$.errors[lineNum] = "The modifier can be 'seconds', 'milliseconds', or 'ms'";
							if (timeParts[2].length > 0)  {
								$.codeTxt.setTextFormat(errorred, codeTxtIndex, codeTxtIndex + timeParts[1].length);
								time = ""; //if there is an error, blank out time so you don't try to evaluate it GomsProcessor
								errorInLine = true;
							}
						} else {
							$.codeTxt.setTextFormat(black, codeTxtIndex, codeTxtIndex + timeParts[1].length + 1);
							$.codeTxt.setTextFormat(green, codeTxtIndex, codeTxtIndex + timeParts[1].length);
						}
					} else if (lineTxt.indexOf("(") < lineTxt.indexOf(")"))  { //if there are not two pieces of information between the parens
						$.errors[lineNum] = "I was expecting a number and 'seconds', 'milliseconds', or 'ms'";
						time = ""; //if there is an error, blank out time so you don't try to evaluate it GomsProcessor
						errorInLine = true;
						$.codeTxt.setTextFormat(errorred, beginIndex + lineTxt.indexOf("("), beginIndex + lineTxt.indexOf(")"));
					} else { //if there is a right paren before the left paren
						$.errors[lineNum] = "I found a right paren before the left paren";
						time = ""; //if there is an error, blank out time so you don't try to evaluate it GomsProcessor
						errorInLine = true;
						$.codeTxt.setTextFormat(errorred, beginIndex + lineTxt.indexOf(")"), beginIndex + lineTxt.indexOf(")") + 1);
					}
				} else { // if there is a left paren with no right paren...
					$.errors[lineNum] = "I was expecting a right parenthesis.";
					time = ""; //if there is an error, blank out time so you don't try to evaluate it GomsProcessor
					errorInLine = true;
					$.codeTxt.setTextFormat(errorred, beginIndex + lineTxt.indexOf("("), beginIndex + lineTxt.length);
				}
			}*/
		
		}
			
			
		private static function trim(s:String):String {
			return s.replace(/^[\s|\t|\n]+|[\s|\t|\n]+$/gs, '');
		}
		
		private static function countIdents(lineTxt:String):int {
			var indx:int = 0;
			indents = 0;
			while (lineTxt.charAt(indx) == " " || lineTxt.charAt(indx) == ".") {
				if (lineTxt.charAt(indx) == ".") indents++;
				indx++;
			}
			return indx++;
		}
		
		
		private static function findBeginIndex():int {
			
			var startPara:int = $.codeTxt.getFirstCharInParagraph($.codeTxt.getFirstCharInParagraph($.codeTxt.caretIndex));
			//if (startPara == $.codeTxt.caretIndex) startPara = $.codeTxt.getFirstCharInParagraph($.codeTxt.getFirstCharInParagraph($.codeTxt.caretIndex) - 4);
			
			
			return startPara;
		}
		
		private static function findEndIndex(beginIndex:int):int {
			return ( beginIndex + $.codeTxt.getParagraphLength(beginIndex) );
		}
		
		
		private static function findLabelEnd(lineTxt:String, brkString:String):int {
			var endIndex:int = lineTxt.indexOf(brkString);
			if (endIndex == -1) endIndex = lineTxt.length;
			else endIndex--;
			
			return endIndex;
		}
		
		private static function findIndentEnd(lineTxt:String):int{
			for (var i:int = 0; i < lineTxt.length; i++){
				if (lineTxt.charAt(i) != " " && lineTxt.charAt(i) != ".") return i;
			}
			return lineTxt.length;
		}
		
		private static function findItemEnd(startIndex:int, lineTxt:String):int {
			var rslt:int = lineTxt.indexOf(" ", startIndex);
			if (rslt < 0) return lineTxt.length;
			else return rslt;
		}
		
		private static function findNextItem(startIndex:int, lineTxt:String):int {
			for (var i:int = startIndex; i < lineTxt.length; i++){
				//the && deals with consecutive delims
				//if (lineTxt.charAt(i) != " " && lineTxt.charAt(i - 1) == " ") return i;
				if (lineTxt.charAt(i) != " ") return i;
			}
			return lineTxt.length;
		}
		
	}
}
