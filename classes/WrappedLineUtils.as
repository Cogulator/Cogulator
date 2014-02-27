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
	import flash.text.TextField;
	import classes.StringUtils;
	
	public class WrappedLineUtils {
		
		/*
		Flash's lineNum() function returns the number of lines
		in a text field.  Line numbers are counted by the actual
		number of lines in the field, regardless of the number
		of carriage returns.  In a text field with multiline wrapped 
		text this creates a problem, as the line number of a given string
		of text will change depending on how much line wrapping is occuring.
		This class defines a line of text based on carriage return
		(/r) so that, regardless of how the text is wrapped, each
		line defined this way retains the same line number.
		*/
		
		
		//given an index value, return a carriage return based line count
		public static function getNumLines(field:TextField):int {
			return(field.text.match(/\r/g).length + 1);
		}
		
		
		//given an index value, return a carriage return based line number
		public static function getLineNumber(field:TextField, index:int):int {
			var txt:String = field.text.slice(0, index);
			return(txt.match(/\r/g).length + 1);
		}
		
		
		//given a carriage return based line number, returns Flash's lineNum() 
		public static function getNativeLineNumber(field:TextField, lineNo:int):int {
			return(  field.getLineIndexOfChar( getLineIndex(field, lineNo) )  );
		}
				
		
		//given a carriage return based line number, returnsnumber of characters in a line
		public static function getLineLength(field:TextField, lineNo:int):int {
			var begindex:int = getLineIndex(field, lineNo);
			var len:int = field.getParagraphLength(begindex);
			return len;
			//return(  field.getParagraphLength( getLineIndex(field, lineNo) )  );
		}
		
		
		//given a carriage return based line number, returns the index of the line start
		public static function getLineIndex(field:TextField, lineNo:int):int {
			var index:int = 0;
			for (var i:int = 0; i < lineNo; i++) {
				index = field.text.indexOf("\r", index) + 1;
			}
			return (index);
		}
		
		
		//given a carriage return based line number, returns the index of the line end
		public static function getLineEndIndex(field:TextField, lineNo:int):int {
			return( getLineIndex(field, lineNo) + getLineLength(field, lineNo) );
		}
		
	}
}
