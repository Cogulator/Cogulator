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
	import flash.text.TextField;
	import flash.events.MouseEvent;
	import flash.events.Event;
	import classes.SyntaxColor;
	import com.inruntime.utils.*;

	public class AddOperatorText {
		private var $:Global = Global.getInstance();
				
		//private var field:TextField;
		
		private var indexOfParagraphStart:int;
		private var indexOfInsertPoint:int;
		private var indexOfSavedCaretPosition:int;
		
		private var savedText:String;
		private var originalTextFront:String;
		private var originalTextBack:String;
		private var insertText:String;

		public function AddOperatorText() {
		}
		
		public function addOperatorPreview(operatorButton:Object, operatorText:String):void {
			var prevStartPara:int = $.codeTxt.getFirstCharInParagraph($.codeTxt.getFirstCharInParagraph($.codeTxt.caretIndex) - 2);
			var endParagraph:int = $.codeTxt.getFirstCharInParagraph($.codeTxt.caretIndex) 
								 + $.codeTxt.getParagraphLength($.codeTxt.caretIndex);
			var indention:String;

			indexOfSavedCaretPosition = $.codeTxt.caretIndex;
			savedText = $.codeTxt.text;
			
			indexOfParagraphStart = $.codeTxt.getFirstCharInParagraph($.codeTxt.caretIndex);
			if ($.codeTxt.caretIndex == indexOfParagraphStart) {
				indexOfInsertPoint = indexOfParagraphStart;
				indention = indent( $.codeTxt, prevStartPara, endParagraph, isAGoal(operatorText) );
			} else {
				indexOfInsertPoint = indexOfParagraphStart + $.codeTxt.getParagraphLength($.codeTxt.caretIndex); //emd of paragraph
				indention = indent( $.codeTxt, $.codeTxt.getFirstCharInParagraph($.codeTxt.caretIndex), endParagraph, isAGoal(operatorText) );
			}
				
			originalTextFront = $.codeTxt.text.substring(0, indexOfInsertPoint);
			originalTextBack = $.codeTxt.text.substring(indexOfInsertPoint, $.codeTxt.length);
			insertText = indention + operatorText.replace("\r", "") + "\r";
			
			$.codeTxt.text = originalTextFront + insertText + originalTextBack;
			$.codeTxt.setSelection(indexOfInsertPoint, indexOfInsertPoint + insertText.length);
			
			operatorButton.addEventListener(MouseEvent.MOUSE_OUT, removeOperatorPreview);
			SyntaxColor.solarizeAll($.codeTxt);
		}
		
		private function removeOperatorPreview (evt:MouseEvent):void {
			$.codeTxt.setSelection(indexOfSavedCaretPosition, indexOfSavedCaretPosition);
			$.codeTxt.text = savedText;
			$.stage.focus = $.codeTxt;
			SyntaxColor.solarizeAll($.codeTxt);
		}
		
		public function removeOperatorListeners(operatorButton:Object):void {
			operatorButton.removeEventListener(MouseEvent.MOUSE_OUT, removeOperatorPreview);
		}
		
		public function addOperatorPermament (operatorButton:Object):void {
			indexOfSavedCaretPosition = indexOfInsertPoint + insertText.length;
			savedText = $.codeTxt.text;
			$.codeTxt.setSelection(indexOfInsertPoint + insertText.length - 1, indexOfInsertPoint + insertText.length - 1);
			$.stage.focus = $.codeTxt;
			operatorButton.removeEventListener(MouseEvent.MOUSE_OUT, removeOperatorPreview);
		}
		
		private function indent(f:TextField, firstCharInParagraph:int, lastCharInParagraph:int, isGoal:Boolean):String {
			 var dots:int = 0;
			 var indent:String = "";
			 
			 for (var c:int = firstCharInParagraph; c < lastCharInParagraph; c ++) {
				 if (f.text.charAt(c) == ".") dots++;
				 else if (f.text.charAt(c) != " ") {
					var subStr:String = f.text.substring(c, c + 5);
					if (subStr == "Goal:" || subStr == "Also:") dots++;
					break; 
				 }
			 }
			 
			 //if this is a goal, remove one of the dots
			 if (isGoal && dots > 0) dots--;
			 
			 for (var i:int = 0; i < dots; i++) {
				 indent += ".";
			 }
			 
			 return (indent);	 
		}
		
		private function isAGoal(txt:String):Boolean {
			var index:int = -1;
			while ( (index = txt.indexOf("Goal:", index + 1) ) != -1){
				return true;
			}
			
			index = -1;
			while ( (index = txt.indexOf("Also:", index + 1) ) != -1){
				return true;
			}
			
			return false;
		}
		
		
		

	}
	
}
