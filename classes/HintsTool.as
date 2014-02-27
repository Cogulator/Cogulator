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
 
package classes  {
	import flash.display.MovieClip;
	import flash.events.MouseEvent;
	import flash.text.TextLineMetrics;
	import flash.text.TextFieldAutoSize;
	import fl.events.ScrollEvent;
	import fl.controls.UIScrollBar;
	import flash.text.TextFormat;
	import classes.WrappedLineUtils;
	import classes.SolarizedPalette;
	import com.inruntime.utils.*;
	
	public class HintsTool {
		private var $:Global = Global.getInstance();

		private var _hintsButton:MovieClip;
		private var _hintsCHI:MovieClip;
		private var _errorLine:MovieClip;
		private var _highlighter:MovieClip;
		private var _scrollBar:UIScrollBar;
		private var _insert:AddOperatorText;
		
		private var hintsArray:Array;
		private var newHintsArray:Array;
		private var currentHint:int;
		private var handsLocation:String;
		
		private var defaultFormat:TextFormat = new TextFormat();
		private var errorFormat:TextFormat = new TextFormat();
		private var hintFormat:TextFormat = new TextFormat();
		private var hintOverFormat:TextFormat = new TextFormat();
		
		public function HintsTool(hb:MovieClip, hc:MovieClip, el:MovieClip, h:MovieClip, sb:UIScrollBar, ins:AddOperatorText) {
			_hintsButton = hb;
			_hintsCHI = hc;
			_errorLine = el;
			_highlighter = h;
						
			_scrollBar = sb;			
			_insert = ins;
			_highlighter.visible = false;
			_errorLine.visible = false;
			_errorLine.x = 190.7;
						
			_hintsButton.addEventListener(MouseEvent.CLICK, showHintsCHI);
			_hintsCHI.closeButton.addEventListener(MouseEvent.CLICK, hideHintsCHI);
			_hintsCHI.leftButton.addEventListener(MouseEvent.CLICK, iterateHint);
			_hintsCHI.rightButton.addEventListener(MouseEvent.CLICK, iterateHint);
			
			defaultFormat.color = SolarizedPalette.darkgrey;
			errorFormat.color = SolarizedPalette.errorred;
			hintFormat.color = SolarizedPalette.darkgrey;
			hintFormat.underline = true;
			hintOverFormat.color = SolarizedPalette.orange;
			hintOverFormat.underline = true;
			
			hintsArray = new Array();
			
			currentHint = 0;
		}

		
		private function showHintsCHI(evt:MouseEvent) {
			currentHint = 0;
			_hintsCHI.visible = true;
			_scrollBar.addEventListener(ScrollEvent.SCROLL, scrolled);
			generateHints();
		}
		
		
		public function hideHintsCHI(event = null) {
			currentHint = 0;
			_hintsCHI.visible = false;
			_highlighter.visible = false;
			_errorLine.visible = false;
			_scrollBar.removeEventListener(ScrollEvent.SCROLL, scrolled);
		}
		
		
		public function generateHints() {
			hintsArray.length = 0;
			//generate non-error hints
			newHints(); 
			var len:int = hintsArray.length;

			//generate error hints
			for (var key:* in $.errors) {
				hintsArray.push({txt: $.errors[key], lineNo: key, type: "error"});
			}
						
			//allows hints to resume where it was after model refresh
			if (currentHint >= hintsArray.length) currentHint = hintsArray.length - 1; 
			setHintIcon(len);

			if (_hintsCHI.visible) {
				shownHideLeftRightButtons();
				if (hintsArray.length == 0) {
					_hintsCHI.hintText.text = "looks good to me  :-)";
					hideHintsCHI();
					setHintFormatAndManageListeners("");
				} else {
					hintsArray.sortOn("lineNo", Array.NUMERIC); 
					nextHint();
				}
			}
		}
		
		
		private function setHintIcon(len:int){ 
			if (hintsArray.length == 0) _hintsButton.visible = false;
			else {
				_hintsButton.visible = true;
				if (len > 0 && hintsArray.length == len) _hintsButton.hintIcon.gotoAndStop(2);
				else if (len == 0 && hintsArray.length > 0) _hintsButton.hintIcon.gotoAndStop(3);
				else if (len > 0 && hintsArray.length > 0) _hintsButton.hintIcon.gotoAndStop(4);
			}
		}
		
		
		private function shownHideLeftRightButtons() {
			if (hintsArray.length <= 1) {
				_hintsCHI.leftButton.visible = false;
				_hintsCHI.rightButton.visible = false;
			} else {
				_hintsCHI.leftButton.visible = true;
				_hintsCHI.rightButton.visible = true;
			}
		}
		
		
		private function onLinkMouseOver(evt:MouseEvent){
			_hintsCHI.hintText.setTextFormat(hintOverFormat, 0, 3);
		}
		
		
		private function onLinkMouseOut(evt:MouseEvent){
			_hintsCHI.hintText.setTextFormat(hintFormat, 0, 3);
		}
		
		
		private function newHints() {
			handsLocation = null; 
			for each (var step:Step in $.gantt.intersteps) {
				if ( (step.operator == "say" || step.operator == "hear") && step.label == "") {
					hintsArray.push({txt: "Say/Hear should have a label. It's used to calculate operator duration", lineNo: step.lineNo, type: "static_hint"});
				} else if (step.operator == "type" && step.label == "") {
					hintsArray.push({txt: "Type should have a label. It's used to calculate operator duration", lineNo: step.lineNo, type: "static_hint"});
				}
				if (step.resource == "hands") {
					if (handsLocation == null) {
						if (step.operator == "point" || step.operator == "click") handsLocation = "mouse";
						else handsLocation = "keyboard";
					} else if (step.operator == "hands") { //operator rather than resource 
						handsLocation = null //setting to null allows to work without setting location in label
					} else if ((step.operator == "point" || step.operator == "click") && handsLocation == "keyboard") {
						hintsArray.push({txt: "Add a hands to mouse operator?", lineNo: step.lineNo, type: "hint"});
					} else if ((step.operator == "keystroke" || step.operator == "type") && handsLocation == "mouse"){
						hintsArray.push({txt: "Add a hands to keyboard operator?", lineNo: step.lineNo, type: "hint"});
					} else if (step.operator == "type" && step.label.substr(step.label.length - 1, 1) == " ") {
						hintsArray.push({txt: "Heads up: The blank spaces at the end of your label affect task time.", lineNo: step.lineNo, type: "static_hint"});
					}
				}
			}
		}
		
		
		private function setHintFormatAndManageListeners(type:String){ 
			if (type == "error") {
				_hintsCHI.hintText.setTextFormat(errorFormat);
				_hintsCHI.hintText.removeEventListener(MouseEvent.MOUSE_OVER, onLinkMouseOver);
				_hintsCHI.hintText.removeEventListener(MouseEvent.MOUSE_OUT, onLinkMouseOut);
				_hintsCHI.hintText.removeEventListener(MouseEvent.MOUSE_OVER, previewFixIt);
				_hintsCHI.hintText.removeEventListener(MouseEvent.MOUSE_OUT, removePreviewFixIt);
				_hintsCHI.hintText.removeEventListener(MouseEvent.CLICK, fixIt);
			} else if (type == "hint"){
				_hintsCHI.hintText.setTextFormat(hintFormat, 0, 3);
				_hintsCHI.hintText.addEventListener(MouseEvent.MOUSE_OVER, onLinkMouseOver);
				_hintsCHI.hintText.addEventListener(MouseEvent.MOUSE_OUT, onLinkMouseOut);
				_hintsCHI.hintText.addEventListener(MouseEvent.MOUSE_OVER, previewFixIt);
				_hintsCHI.hintText.addEventListener(MouseEvent.MOUSE_OUT, removePreviewFixIt);
				_hintsCHI.hintText.addEventListener(MouseEvent.CLICK, fixIt);
				_insert.removeOperatorListeners(_hintsCHI.hintText);
			} else {
				_hintsCHI.hintText.setTextFormat(defaultFormat);
				_hintsCHI.hintText.removeEventListener(MouseEvent.MOUSE_OVER, onLinkMouseOver);
				_hintsCHI.hintText.removeEventListener(MouseEvent.MOUSE_OUT, onLinkMouseOut);
				_hintsCHI.hintText.removeEventListener(MouseEvent.MOUSE_OVER, previewFixIt);
				_hintsCHI.hintText.removeEventListener(MouseEvent.MOUSE_OUT, removePreviewFixIt);
				_hintsCHI.hintText.removeEventListener(MouseEvent.CLICK, fixIt);
				_insert.removeOperatorListeners(_hintsCHI.hintText);
			}
		}
		
		
		private function iterateHint(evt:MouseEvent) {
			if (evt.currentTarget.name == "leftButton") currentHint--;
			else currentHint ++;
			nextHint();
		}
		
		
		private function nextHint() {			
			if (currentHint < 0) currentHint = hintsArray.length - 1;
			else if (currentHint >= hintsArray.length) currentHint = 0;
			
			_hintsCHI.hintCount.text = String(currentHint + 1) + " of " + String(hintsArray.length);
			
			_hintsCHI.hintText.text = hintsArray[currentHint].txt;
			verticallyAlign();
			
			highlightLine(hintsArray[currentHint].lineNo, hintsArray[currentHint].type);
			setHintFormatAndManageListeners(hintsArray[currentHint].type);
		}
		
		
		private function verticallyAlign() {
			_hintsCHI.hintText.autoSize = TextFieldAutoSize.CENTER;			
			_hintsCHI.hintText.y = (_hintsCHI.bckgrnd.height / 2) - (_hintsCHI.hintText.height / 2);
		}
		
		
		private function scrolled(evt:ScrollEvent) {
			highlightLine(hintsArray[currentHint].lineNo, hintsArray[currentHint].type);
		}
		
		
		public function resized() {
			highlightLine(hintsArray[currentHint].lineNo, hintsArray[currentHint].type);
		}	
		
		
		private function highlightLine(lineNo:int, type:String) {
			_highlighter.visible = false;
			_errorLine.visible = false;
			
			var index:int = WrappedLineUtils.getLineIndex($.codeTxt, lineNo);
			$.codeTxt.setSelection(index, index);
			
			try {
				var metrics:TextLineMetrics = $.codeTxt.getLineMetrics(WrappedLineUtils.getNativeLineNumber($.codeTxt, lineNo));
				_highlighter.x = $.codeTxt.x;
				_highlighter.y = $.codeTxt.getCharBoundaries(index).y  + $.codeTxt.y;
				_highlighter.width = metrics.width + 5;
				_highlighter.height = metrics.height;
				_highlighter.visible = true;
				
				_errorLine.y = $.codeTxt.getCharBoundaries(index).y + $.codeTxt.y;
				_errorLine.field.text = String(lineNo + 1);
				if (type == "error") {
					_errorLine.gotoAndStop(1);
				} else { 
					_errorLine.gotoAndStop(2);
				}
				_errorLine.visible = true;
				
			} catch (error:Error) { 
				//there appears to be an as3 bug that won't let me test getCharBoundaries for an error, so using try/catch
			}
		}
		
		
		private function previewFixIt(evt:MouseEvent) {
			var newHandsLocation:String;
			if (handsLocation == "mouse") newHandsLocation = "keyboard";
			else if (handsLocation == "keyboard") newHandsLocation = "mouse";
			else newHandsLocation = "";
			_insert.addOperatorPreview(_hintsCHI.hintText, "Hands to " + newHandsLocation);
			highlightLine(hintsArray[currentHint].lineNo + 1, hintsArray[currentHint].type);
		}
		
		
		private function removePreviewFixIt(evt:MouseEvent) {
			highlightLine(hintsArray[currentHint].lineNo, hintsArray[currentHint].type);
		}
		
		
		private function fixIt(evt:MouseEvent) {
			_insert.addOperatorPermament(_hintsCHI.hintText);
		}
		
		

	}
	
}
