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
	import flash.events.MouseEvent;
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.text.TextLineMetrics;
	import com.inruntime.utils.*;

    public class LineSelect extends EventDispatcher {
		//public var why:Number;
		
		private var $:Global = Global.getInstance();
		
		public function LineSelect() {
			$.stage.addEventListener(MouseEvent.MOUSE_UP, clicked);
		}
		
		private function clicked(evt:MouseEvent):void {			
			var beginTheBegin:int = $.codeTxt.getFirstCharInParagraph($.codeTxt.selectionBeginIndex);
			var endOfTheBegin:int = beginTheBegin + $.codeTxt.getParagraphLength($.codeTxt.selectionBeginIndex);
				endOfTheBegin--;
			var beginOfTheEnd:int = $.codeTxt.getFirstCharInParagraph($.codeTxt.selectionEndIndex);
			var endOfTheEnd:int = beginOfTheEnd + $.codeTxt.getParagraphLength($.codeTxt.selectionEndIndex);
				endOfTheEnd--;
				
			var delta:int = (beginTheBegin - $.codeTxt.selectionBeginIndex) + (endOfTheEnd - $.codeTxt.selectionEndIndex);
			
			if (delta == 0 && beginTheBegin == beginOfTheEnd && beginTheBegin != endOfTheBegin) {
				dispatchEvent(new Event("single line")); //selected a single line
			} else if (delta == 0 && beginTheBegin != endOfTheBegin && evt.target.name != "operatorLbl") {
				//why = lineY(beginTheBegin);
				dispatchEvent(new Event("group of lines")); //selected a group of lines
			} else {
				dispatchEvent(new Event("sNaKE eYEs")); //came up empty
			}
		}
		
		
    }
}
