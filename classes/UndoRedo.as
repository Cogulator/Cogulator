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

	import flash.events.Event;
	import flash.events.KeyboardEvent;
	import flash.ui.Keyboard;
	import classes.SyntaxColor;
	import com.inruntime.utils.*;

	public class UndoRedo {
		private var $:Global = Global.getInstance();
		private var undoStack:Array;
		private var redoStack:Array;

		public function UndoRedo() {
			$.codeTxt.addEventListener(Event.CHANGE, listenForNewText);
			$.codeTxt.addEventListener(KeyboardEvent.KEY_DOWN, listenForUndoOrRedo);
		}
		
		public function init() {
			undoStack = new Array();
			redoStack = new Array();
			undoStack.push({txt: $.codeTxt.text, pos: $.codeTxt.caretIndex});
		}
		
		
		public function listenForNewText (event = null) {
			undoStack.push({txt: $.codeTxt.text, pos: $.codeTxt.caretIndex});
		}
		
		
		private function listenForUndoOrRedo (evt:KeyboardEvent):void {
			if (evt.ctrlKey) {
				switch ( evt.keyCode ) {
					case Keyboard.Z : //if control+z for undo 
						if (undoStack.length > 1) undo();
						SyntaxColor.solarizeAll();
						break;
					case Keyboard.Y : //if control+y for redo
						if (redoStack.length > 0)redo();
						SyntaxColor.solarizeAll();
						break;
				}
			}
		}
		
		
		private function undo():void {
			redoStack.push(undoStack.pop());
			$.codeTxt.text = undoStack[undoStack.length - 1].txt;
			$.codeTxt.setSelection(undoStack[undoStack.length - 1].pos, undoStack[undoStack.length - 1].pos);
		}
		
		
		private function redo():void {
			$.codeTxt.text = redoStack[redoStack.length - 1].txt;
			$.codeTxt.setSelection(redoStack[redoStack.length - 1].pos, redoStack[redoStack.length - 1].pos);
			undoStack.push(redoStack.pop());
		}
		
		
	}
	
}










