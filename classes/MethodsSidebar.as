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
	import flash.events.IOErrorEvent;
	import flash.filesystem.File;
	import flash.filesystem.FileMode;
	import flash.filesystem.FileStream;
	import flash.display.MovieClip;
	import flash.events.MouseEvent;
	import flash.text.TextFieldAutoSize;
	import flash.text.TextFormatAlign;
	import com.greensock.*;
	import com.greensock.easing.*;
	import com.inruntime.utils.*;
	import classes.AddOperatorText;

	
	public class MethodsSidebar extends MovieClip {
		private var $:Global = Global.getInstance();

		public var methodButtons:Array = new Array();
		public var methods = new File(File.documentsDirectory.nativePath);
		private var methodsDirectoryContents:Array;
		private var directories:Array = new Array();
		private var directoryLabels:Array = new Array();
		private var files:Array = new Array();
		
		private var config = new File(File.documentsDirectory.nativePath);
		
		private var lineY:int = 10;
		private var labelX:int = 15;
		private var methodX:int = 25;
		
		private var steps:TextLoader;
		private var _undoRedo:UndoRedo;
		private var _main:Main;
		private var insert:AddOperatorText = new AddOperatorText();
		
		public var currentFilePath:String = new String();
		private var configFilePath:String = new String();
		private var configFileName:String = new String();
		private var currentDirectory:String = "methods";
		
		public var textSelected:String = ""
		
		public function MethodsSidebar(uR:UndoRedo, main:Main) {
			_undoRedo = uR
			_main = main;
					
			methods = methods.resolvePath("cogulator/methods");
			if (!methods.isDirectory) {				
				var custom = new File(File.documentsDirectory.nativePath);
					custom = custom.resolvePath("cogulator/methods/Custom");
					custom.createDirectory(); //creates the method and custom directories

				addDefaultMethods();
			}
			methodsDirectoryContents = methods.getDirectoryListing();
			
			populateFilesArrays("methods");
			for each (var dir in directories) {
				methodsDirectoryContents.length = 0;
				methodsDirectoryContents = dir.getDirectoryListing();
				populateFilesArrays(dir.name);
			}
			
			pullNextButtonInfo(); //starts interative process of adding button for each file
		}

		private function populateFilesArrays(directory:String):void {
			var extension:String = new String();
			
			for each (var item in methodsDirectoryContents) {
				extension = item.name.substring(item.name.lastIndexOf(".")+1, item.name.length);
				if (item.isDirectory) directories.push(item);
				else if (extension == "goms") files.push({dir: directory, file: item});
			}
		}
		
		var itr:int = 0;
		private function pullNextButtonInfo():void {
			var method = files[itr];
			if (method.dir != currentDirectory) { //if this is a new directory, create a directory label
				currentDirectory = method.dir;
				lineY += 25;
				var directory:HeadingLabel = new HeadingLabel();
					directory.labeltxt.text = method.dir; 
					directory.x = labelX;
					directory.y = lineY;
					addChild(directory);
					directoryLabels.push(directory);
			}
			
			if (itr != 0) lineY += 25;
			
			steps = new TextLoader(method.file.nativePath);
			steps.addEventListener(method.file.nativePath, generateButtonOnLoad);
			steps.addEventListener("¡error!", onMethodLoadError);
		}
		
		private function generateButtonOnLoad(evt:Event):void {
			var method = files[itr];
			var methodButton:MethodButton = new MethodButton();
				methodButton.label.text = method.file.name.substring(0,method.file.name.length - 5);
				methodButton.label.autoSize = TextFieldAutoSize.LEFT;
				methodButton.info.method.text = methodButton.label.text;
				methodButton.info.description.text = steps.txt;
				methodButton.filePath = method.file.nativePath;
				methodButton.x = methodX;
				methodButton.y = lineY;
				methodButton.strikeThrough.visible = false;
				methodButton.hotspot.addEventListener(MouseEvent.CLICK, onMethodClick);
				methodButton.hotspot.addEventListener(MouseEvent.MOUSE_OVER, onMethodHover);
			addChild(methodButton);
			methodButtons.push(methodButton);
			
			itr++;
			if (itr < files.length) pullNextButtonInfo();
		}
			
		
		public function reGenerateButtons():void { //clear out the old before calling the generate function again
			for each (var old in methodButtons) {
				removeChild(old)
				old = null;
			}
			
			for each (var oldDir in directoryLabels){
				removeChild(oldDir);
				oldDir = null;
			}
			
			methodButtons.length = 0;
			directories.length = 0;
			directoryLabels.length = 0;
			files.length = 0;
			methodsDirectoryContents.length = 0;
			currentDirectory = "";
			
			methods = null;
			methods = new File(File.documentsDirectory.nativePath);
			methods = methods.resolvePath("cogulator/methods");
			methodsDirectoryContents = methods.getDirectoryListing();
			
			populateFilesArrays("methods");
			
			for each (var dir in directories) {
				methodsDirectoryContents.length = 0;
				methodsDirectoryContents = dir.getDirectoryListing();
				populateFilesArrays(dir.name);
			}
			
			lineY = 0;
			pullNextButtonInfo();
		}
		
		private function onMethodClick(evt:MouseEvent) {
			insert.addOperatorPermament(evt.currentTarget);
			_undoRedo.listenForNewText(); //add to undo redo stack
			_main.refreshModel();
		}
		
		private function onMethodHover(evt:MouseEvent) {
			var methodButton = evt.currentTarget.parent;
			insert.addOperatorPreview(methodButton, formatMethod(methodButton.info.description.text));
		}
		
		private function onMethodLoadError(evt:Event):void {
			trace("I hear the model didn't load");
			dispatchEvent(new Event("method_did_not_load"));
		}
		
		private function addDefaultMethods() {
			
			var defaultMethods:Array = getDefaultMethods();
			for each (var method in defaultMethods) {
				var filename = method.filename;
				var steps = method.steps;
				
				//generate the path for the model
				var filePath:String = "";
				var slash:int = filePath.indexOf("\\");
				if (slash < 0) {
					filePath = methods.nativePath + "/" + filename + ".goms"; //mac or linux
					filePath = filePath.split("//").join("/");

				} else {
					filePath = methods.nativePath + "\\" +  filename + ".goms";
					filePath = filePath.split("\\\\").join("\\");
				}
				
				var localFile = new File(File.documentsDirectory.nativePath); 
					localFile = localFile.resolvePath(filePath); 
				var localFileStream:FileStream = new FileStream();
					
				try {
					localFileStream.open(localFile, FileMode.WRITE);
					localFileStream.writeMultiByte(steps, "utf-8");
				} catch (error:Error) {
					trace("try/catch fired in MethodsSidebar", error.message);
					dispatchEvent( new Event("¡save error!") ); //Main.as listens for this and displays error if needed
				}

				localFileStream.close();
			}
		}
		
		private function getDefaultMethods():Array {
			var pointAndClick:String = "Goal: Point and Click \n. Look at <target> \n. Point to <target> \n. Cognitive_processor verify cursor over <target> \n. Click <target> \n. Ignore <target> \n"
			var fileSaveAs:String = "Goal: File Save As \n.Goal: Select File Button \n..Look at <file-button> \n..Point to <file-button> \n..Cognitive_processor verify cursor over <file-button> \n..Click <file-button> \n..Ignore <file-button> \n.Goal: Select Save As Button \n..Look at <save-as> \n..Point to <save-as> \n..Cognitive_processor verify cursor over <save-as> \n..Click <save-as> \n..Ignore <save-as> \n.Goal: Enter File Name \n..Think of <file-name> \n..Look at <file name field> \n..Hands to keyboard \n..Type <file-name> \n..Cognitive_processor verify <file-name> is correct \n..Keystroke Enter  \n..Ignore  <file name field> \n"
			var copyAndPaste:String ="Goal: Copy and Paste \n.Goal: Start of Selection \n..Look at <start-target> \n..Point to <start-target> \n..Cognitive_processor  verify cursor over <start-target> \n..Click down on <start-target> (150 milliseconds) *half of a click  \n..Ignore <start-target> \n.Goal: End of Selection \n..Look at <end-target> \n..Point to <end-target> \n..Cognitive_processor cursor over <end-target> \n..Click up on <end-target> (150 milliseconds) *half of a click  \n..Ignore <end-target> \n.Goal: Copy Keystrokes \n..Hands to Keyboard \n..Keystroke CONTROL \n..Keystroke C \n.Goal: Point to Destination \n* Assuming hand was left on mouse while selecting CTRL+C \n..Look at <destination-target> \n..Point to <destination-target> \n..Cognitive_processor <destination-target> \n..Click on <destination-target>  \n..Ignore <destination-target> \n.Cognitive_processor text pasted correctly \n"
			var screenTouch:String = "Goal:  Touch Screen Target \n.Look at <target> \n.Point to <target> \n.Cognitive_processor verify finger is over <target> \n.Touch target \n. Ignore <target> \n";
			var screenSwipe:String = "Goal:  Swipe & Search * Touch screen \n.Store looking for <Fred> \n. Goal: Swipe \n.. Look at <target> \n.. Point to <target> \n.. Cognitive_processor verify finger is over <target> \n.. Swipe <target> \n.. Ignore <target> \n.Search for <Fred> \n. Goal: Swipe \n.. Look at <target> \n.. Point to <target> \n.. Cognitive_processor verify finger is over <target> \n.. Swipe <target> \n.. Ignore <target> \n.Search for <Fred> * assume found after two swipes \n"
			var perceiveInfo:String = "Goal: Perceive Info *CPM-GOMS implementation \n.Attend <info> \n.Initiate eye movement \n.Saccade to <info> * (290 ms) if something like a 6 letter word \n.Perceptual_processor perceive <info> \n.Cognitive_processor verify <info>  \n"
			var slowPoint:String = "Goal: Slow Point and Click \n.Goal: Move Cursor \n..Initiate move <cursor> to <target> \n..Point to <target> (550 ms) \n.. Also: Attend to Target \n...Attend to <target> \n...Initiate gaze to <target> \n...Saccade to <target> \n...Attend to <cursor> at <target>   \n..Perceptual_processor perceive <cursor> at <target>   \n..Cognitive_processor verify <cursor> at <target> \n.Goal: Click \n..Initiate mouse down \n..Click (100 ms) \n"
			var fastPoint:String = "Goal: Fast Point and Click \n.Goal: Move Cursor \n..Initiate move <cursor> to <target> \n..Point to <target> (550 ms) \n.. Also: Attend to Target \n...Attend to <target> \n...Initiate gaze to <target> \n...Saccade to <target> \n...Look at <target> (100 ms)  \n...Cognitive_processor verify cursor over <target> (100 ms)  \n.Goal: Click \n..Initiate mouse down \n..Click (100 ms) \n "
			var hearAndRespond:String = "Goal: Hear and Respond \n .Hear Hello. How are you? \n .Perceptual_processor  perceive silence \n .Say I'm find, how about you?  \n"
			var defaultMethods:Array = new Array();			
				defaultMethods.push({"filename": "Point_and_Click", "steps": pointAndClick});
				defaultMethods.push({"filename": "Slow_Click_CPM", "steps": slowPoint});
				defaultMethods.push({"filename": "Fast_Click_CPM", "steps": fastPoint});
				defaultMethods.push({"filename": "Perceive_Info_CPM", "steps": perceiveInfo});
				defaultMethods.push({"filename": "File_Save_As", "steps": fileSaveAs});
				defaultMethods.push({"filename": "Copy_And_Paste", "steps": copyAndPaste});
				defaultMethods.push({"filename": "Point_and_Touch", "steps": screenTouch});
				defaultMethods.push({"filename": "Search_and_Swipe", "steps": screenSwipe});
				defaultMethods.push({"filename": "Hear_and_Respond", "steps": hearAndRespond});
			return defaultMethods;
		}
		
		
		private function formatMethod(text:String):String {
			var lines = text.split("\r");
			var txt = "";
			for each (var line in lines) txt += line + "\n";
			return txt;
		}

		private function replaceDoubleBackslash(str:String):String {
			var myPattern:RegExp = /\\/g;
			return(str.replace(myPattern, "\\")); 
		}
	

	}
	
}
