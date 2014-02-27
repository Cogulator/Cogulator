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
	import flash.display.MovieClip;
	import flash.events.MouseEvent;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.NativeDragEvent;
	import com.inruntime.utils.*;

	
	public class IndentComment extends EventDispatcher {
		
		private var $:Global = Global.getInstance();
		
		public var beginLineIndex:int;
		public var endLineIndex:int;
		public var txt:String;
		public var parts:Array;
		
		private var _cidToolbar:MovieClip;
		
		private var cursorStartX:Number;
		private var cursorLastX:Number;
		private var cursorDirection:String;
		private var indentsAdded:int;
		private var dlta:Number;

		public function IndentComment(cID:MovieClip) {
			// constructor code
			_cidToolbar = cID;
			
			_cidToolbar.commentBtn.addEventListener(MouseEvent.CLICK, comment);
			_cidToolbar.indentBtn.addEventListener(MouseEvent.CLICK, indentDedent)
			_cidToolbar.dedentBtn.addEventListener(MouseEvent.CLICK, indentDedent)
		}
		
		//called from main timeline when group of lines is selected
		public function addEventListeners():void {
			$.codeTxt.addEventListener(MouseEvent.MOUSE_DOWN, startDragToIdent);
		}
		
		public function removeEventListeners():void {
			$.codeTxt.removeEventListener(MouseEvent.MOUSE_DOWN, startDragToIdent);
			$.stage.removeEventListener(NativeDragEvent.NATIVE_DRAG_UPDATE, dragToIdent);
		}
		
		private function startDragToIdent(evt:MouseEvent):void {
			cursorStartX = $.stage.mouseX;
			cursorLastX = cursorStartX;
			dlta = 0;
			$.codeTxt.addEventListener(NativeDragEvent.NATIVE_DRAG_UPDATE, dragToIdent);
		}
		
		private function dragToIdent(evt:NativeDragEvent):void {
			if ($.stage.mouseX - cursorStartX > dlta) cursorDirection = "right";
			else cursorDirection = "left";
			
			dlta = $.stage.mouseX - cursorStartX;			
			if (Math.round(dlta/10) % 10 != indentsAdded) dragIndentDedent();
			indentsAdded = Math.round(dlta/10) % 10;
		}
		
		private function comment(evt:MouseEvent):void {
			setVariables();
			
			var char:String = "*";
			var index:int = 1;
			var adding:Boolean = false;
			
			var comments:int = 0;
						
			for (var itr:int = 0; itr < parts.length; itr++) {
				if (parts[itr].substr(0,1) == "*") comments++;
			}
			if (comments / parts.length < 0.5) adding = true;
			
			for (var i:int = 0; i < parts.length; i++) {
				if (adding && parts[i].substr(0,1) != "*") parts[i] = char + parts[i]; 
				else if (adding == false && parts[i].substr(0,1) == "*") parts[i] = parts[i].substring(index,parts[i].length);
			}
			
			reassembleText();
		}
		
		private function dragIndentDedent():void {
			var char:String = ".";
			var index:int = 2;
			
			for (var i:int = 0; i < parts.length; i++) {
				if (cursorDirection == "right") parts[i] = char + parts[i]; 
				else if (parts[i].substring(0,index) == char) parts[i] = parts[i].substring(index,parts[i].length);
			}
			
			reassembleText();
		}
		
		private function indentDedent(evt:MouseEvent):void {
			setVariables();
			
			var char:String = ".";
			var index:int = 1;
			
			for (var i:int = 0; i < parts.length; i++) {
				if (evt.currentTarget.name == "indentBtn") parts[i] = char + parts[i]; 
				else if (parts[i].substring(0,index) == char) parts[i] = parts[i].substring(index,parts[i].length);
			}
			
			reassembleText();
		}
		
		private function reassembleText():void {
			var newText:String = "";
			
			for (var iterate:int = 0; iterate < parts.length; iterate++) {
				if (iterate == parts.length - 1) newText += parts[iterate];
				else newText += parts[iterate] + "\r";
			}	
			
			var beginText:String = $.codeTxt.text.substring(0, beginLineIndex);
			var endText:String = $.codeTxt.text.substring(endLineIndex, $.codeTxt.length);
			
			$.codeTxt.text = beginText + newText + endText;
			
			$.stage.focus = $.codeTxt;
			$.codeTxt.setSelection(beginLineIndex, beginLineIndex + newText.length);
			
			endLineIndex = beginLineIndex + newText.length;
			
			dispatchEvent(new Event("In Dent We Trust"));
		}
		
		private function setVariables():void {
			beginLineIndex = $.codeTxt.getFirstCharInParagraph($.codeTxt.selectionBeginIndex);
			endLineIndex = $.codeTxt.getFirstCharInParagraph($.codeTxt.selectionEndIndex) + $.codeTxt.getParagraphLength($.codeTxt.selectionEndIndex) - 1;
			
			txt = $.codeTxt.text.substring(beginLineIndex, endLineIndex);
			parts = txt.split("\r");

		}

	}
	
}
