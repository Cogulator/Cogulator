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
	import classes.WrappedLineUtils;
	import com.inruntime.utils.*;
	
	public class TextHighlighter {

		private static var $:Global = Global.getInstance();
		private static var index:int = -1;
		private static var lngth:int;
		
		public static function highlightByLineNo(lineNo:int) {
			index = WrappedLineUtils.getLineIndex($.codeTxt, lineNo);
			lngth = WrappedLineUtils.getLineLength($.codeTxt, lineNo); 
			
			$.codeTxt.setSelection(index, index + lngth);
			$.codeTxt.scrollV--; //sometimes the selection jump doesn't show the line.  this is insurance.
			$.stage.focus = $.codeTxt;
		}
		
		

	}
	
}
