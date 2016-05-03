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
	import flash.utils.Dictionary;
	import com.greensock.TweenLite;
	import com.inruntime.utils.*;
	
	
	public class ModelStatus {
		private var $:Global = Global.getInstance();
		private var _timeReadout:MovieClip;
		private var _exportButton:MovieClip
		public var errorsExist:Boolean;

		public function ModelStatus(tR:MovieClip) {
			// constructor code
			_timeReadout = tR;
		}
		
		public function modelUpdated():void {
			errorsExist = false;
			
			_timeReadout.refreshButton.refreshSymbol.gotoAndStop(1);
			_timeReadout.taskTimeField.alpha = 1;
			_timeReadout.taskTimeField.filters = [];
			
			TweenLite.to(_timeReadout.refreshButton.refreshSymbol, .25, {rotation:360});
			TweenLite.killTweensOf(_timeReadout.taskTimeField);
			
			if (countKeys($.errors) > 0) errorsExist = true;
		}
		
		public function lineChange():void {
			TweenLite.to(_timeReadout.taskTimeField, .5, {alpha:.3});
		}
		
		private function countKeys(dict:Dictionary):int {
			var n:int = 0;
			for (var key:* in dict) {
				//trace("found error", dict[key], "at line", key);
				n++;
			}
			//trace("model has", n, "errors");
			return n;
		}

	}
	
}
