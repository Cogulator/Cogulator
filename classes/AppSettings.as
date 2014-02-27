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
	import flash.display.MovieClip;
	import flash.display.Stage;
	import flash.text.TextField;
	import flash.text.TextFormat;
	import flash.events.Event;
	import flash.filesystem.File;
	import classes.TextLoader;
	
	
	public class AppSettings {
		
		private var _settingsPanel:MovieClip;
		private var _this:Object;
		private var _codeTxt:TextField;
		
		private var settings:File = new File(File.documentsDirectory.nativePath);
		private var filePath:String = new String();
		private var loader:TextLoader;
		
		private var settingsArray:Array = new Array();
		
		private var format:TextFormat = new TextFormat();

		public function AppSettings(sp:MovieClip, t:Object, ct:TextField) {
			// constructor code
			_settingsPanel = sp;
			_this = t;
			_codeTxt = ct;
			
			//init();
						
			_settingsPanel.visible = false; //just until settings get up and working;
		}
		
		private function init(){
			settings = settings.resolvePath("cogulator/config");
			filePath = settings.nativePath 
			
			var slash:int = filePath.indexOf("\\");
			if (slash < 0) filePath += "//settings.txt"; //mac or linux
			else filePath += "\\settings.txt";
			
			loader = new TextLoader(filePath);
			loader.addEventListener(filePath, parseSettings); //once loaded, parse the settings
		}
		
		
		private function parseSettings(evt:Event) {
			settingsArray = loader.txt.split("\r");
			setFontSize(settingsArray[0].split(":")[1]);
		}
		
		private function revealSettingsPanel(){
			//TweenLite.to(_this, 1, {x:-250});
			//add required event listeners
		}
		
		private function hideSettingsPanel(){
			//TweenLite.to(_this, 1, {x:0});
			//remove required event listeners
		}
		
		private function setFontSize(pt:int) {
			format.size = pt;
			_codeTxt.defaultTextFormat = format;
			//need to also set the autocomplete txt size and background as a function of size
		}
		
		private function setWorkingMemoryPeak(){
			
		}
		
		private function setWorkingMemoryDecay() {
			
		}

	}
	
}
