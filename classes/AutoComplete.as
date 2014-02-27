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
 
package  classes {
	import flash.text.TextField;
	import flash.text.TextFormat;
	import flash.text.TextFieldAutoSize;
	import flash.geom.Point;
	import flash.display.MovieClip;
	import flash.geom.Rectangle;
	
	public class AutoComplete {
		
		private var black:TextFormat = new TextFormat();
		private var grey:TextFormat = new TextFormat();
							
		private var typed:String;
		private var added:String;	
				
		public function AutoComplete() {
			// constructor code
			black.color = 0x363A3B;
			grey.color = 0x999999;
		}
		
		//this is being used for the autocomplete in the new model chi
		public function autoComplete(field:TextField, phrases:Array) {			
			//setup
			typed = field.text.substring(0, field.caretIndex);
			added = "";
						
			//look for match
			if (typed != "") {
				for each (var item in phrases) { //cycles through all items in the array 
					if ( item.substr(0,typed.length).toLowerCase() == typed.toLowerCase() ) {
						added = item.substr(typed.length, item.length);
						added = added.replace("\r", ''); //make sure there are no carriage returns getting pulled in
						break;
					}
				}
			}

			//update field text with autocomplete
			field.text = typed + added;
			
			//make sure the caret remains in the proper position
			field.setSelection(typed.length, typed.length);
			
			//color text
			if (field.length > 0) field.setTextFormat(black, 0, field.caretIndex);
			if (field.caretIndex < field.length) field.setTextFormat(grey, field.caretIndex, field.length);
		}
		
		
		
		//this is used for autocomplete in the code
		public static function autoCompleteCode(field:Object, phrases:Array):String {
			var parameters:Array = new Array ("seconds)", "syllables)", "milliseconds)", "ms)");
			
			var index:int = wordBegin(field);
			var typed:String = typedText(index, field);
			var added:String = "";
			
			var position:String = positionInLine(field); //"operator" indicates in the operator position "past operator" is, well, you get the idea
							
			if (typed != "") {
				//look for operator match
				if (position == "operator") {
					for each (var item in phrases) { //cycles through all items in the array 
						if ( item.appelation.substr(0,typed.length).toLowerCase() == typed.toLowerCase() ) {
							added = item.appelation.substr(typed.length, item.appelation.length);
							added = added.replace("\r", ''); //make sure there are no carriage returns getting pulled in
							return(added + " ");
						}
					}
				} else if (containsLeftParen(field) && whiteSpaceAdjacent(field) && isNotGoalLine(field)) { //autocomplete seconds, ms, and milliseconds
					for each (var param in parameters) { //cycles through all items in the array 
						if ( param.substr(0,typed.length).toLowerCase() == typed.toLowerCase() ) {
							added = param.substr(typed.length, param.length);
							added = added.replace("\r", ''); //make sure there are no carriage returns getting pulled in
							return(added);
						}
					}
				}
			}
			
			return("");
		}
		
		private static function wordBegin(field:Object):int {
			var startPara:int = field.getFirstCharInParagraph(field.caretIndex);
			var indx:int = field.caretIndex - 1;
			while(field.text.charAt(indx) != " " && field.text.charAt(indx) != ".") {
				indx--
				if (indx < startPara) return(indx + 1);
			}
			return(indx + 1);
		}
		
		private static function typedText(indx:int, field:Object):String {
			return(field.text.substring(indx, field.caretIndex));
		}
		
		private static function whiteSpaceAdjacent(field:Object):Boolean {
			var reg:RegExp = /[\s\r\n\t]/;
			var whiteSpace:Boolean = reg.test( field.text.charAt(field.caretIndex) );
			var atEnd:int = field.length - field.caretIndex; //at end of text field 
			
			if (whiteSpace || atEnd == 0) return true;
			else return false;
		}
		
		private static function isNotGoalLine(field:Object):Boolean {
			var startPara:int = field.getFirstCharInParagraph(field.caretIndex);
			var endPara:int = startPara + (field.getParagraphLength(field.caretIndex) - 1);
			if (field.text.toLowerCase().substring(startPara, endPara).indexOf("goal:") == -1 || field.text.toLowerCase().substring(startPara, endPara).indexOf("also:") == -1) return true;
			else return false;
		}
		
		private static function containsLeftParen(field:Object):Boolean {
			var startPara:int = field.getFirstCharInParagraph(field.caretIndex);
			var endPara:int = startPara + (field.getParagraphLength(field.caretIndex) - 1);
			if (field.text.toLowerCase().substring(startPara, endPara).indexOf("(") > -1) return true;
			else return false;
		}
		
		
		private static function positionInLine(field:Object):String {
			var startPara:int = field.getFirstCharInParagraph(field.caretIndex);
			var endPara:int = startPara + (field.getParagraphLength(field.caretIndex) - 1);
									
			//get rid of idents
			for (var d:int = 0; d < field.text.substring(startPara, endPara).length; d++) {
				if (field.text.substring(startPara, endPara).charAt(d) != "." && field.text.substring(startPara, endPara).charAt(d) != " ") break;
			}
			
			//determine if there are any white spaces before the cursor position in ident free line
			var txt:String = field.text.substring(startPara + d, field.caretIndex - 1);
			var pos:int = txt.indexOf(" ");
			
			if (pos >= 1) return ("past operator");
			else return ("operator");
		}
		
			
	}
	
}
