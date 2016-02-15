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
	import flash.events.KeyboardEvent;
	import flash.ui.Keyboard;
	import flash.text.TextFieldAutoSize;
	import flash.text.TextFormatAlign;
	import flash.text.TextFormat;
	import classes.SyntaxColor;
	import com.greensock.*;
	import com.greensock.easing.*;
	import com.inruntime.utils.*;

	
	public class ModelsSidebar extends MovieClip {
		private var $:Global = Global.getInstance();

		public var modelButtons:Array = new Array();
		private var models = new File(File.documentsDirectory.nativePath);
		private var modelDirectoryContents:Array;
		private var directories:Array = new Array();
		private var directoryLabels:Array = new Array();
		private var files:Array = new Array();
		
		private var config = new File(File.documentsDirectory.nativePath);
		private var settingsFile = new File(File.documentsDirectory.nativePath);
		
		private var lineY:int = 0;
		private var labelX:int = 15;
		private var modelX:int = 25;
		
		private var code:TextLoader;
		public var cnfg:TextLoader;
		private var settingsLoader:XMLLoader;
		
		private var _saveButton:MovieClip;
		private var _newButton:MovieClip;
		private var _newModelCHI:MovieClip;
		private var _timeReadout:MovieClip;
				
		public var currentFilePath:String = new String();
		private var configFilePath:String = new String();
		private var configFileName:String = new String();
		private var settingsFilePath:String = new String();
		
		private var lato = new Lato();
		private var bold:TextFormat = new TextFormat();
		private var regular:TextFormat = new TextFormat();
				
		public function ModelsSidebar(sB:MovieClip, nB:MovieClip, nMC:MovieClip, tR:MovieClip) {
			// constructor code
			_saveButton = sB;
			_newButton = nB;
			_newModelCHI = nMC;
			_timeReadout = tR;
			
			regular.font = lato.fontName;
			regular.bold = false;
			regular.letterSpacing = 0;
			
			bold.font = lato.fontName;
			bold.bold = true;
			bold.letterSpacing = -.1; //prevents unwanted wrapping when bolding model name
						
			models = models.resolvePath("cogulator/models");
			modelDirectoryContents = models.getDirectoryListing();
			
			populateFilesArrays("models");
			
			for each (var dir in directories) {
				modelDirectoryContents.length = 0;
				modelDirectoryContents = dir.getDirectoryListing();
				populateFilesArrays(dir.name);
			}
			
			_saveButton.addEventListener(MouseEvent.CLICK, saveModelClick);
			
			settingsFile = settingsFile.resolvePath("cogulator/config");
			settingsFilePath = settingsFile.nativePath;
			var slash:int = settingsFilePath.indexOf("\\");
			if (slash < 0) settingsFilePath += "//settings.xml"; //mac or linux
			else settingsFilePath += "\\settings.xml";

			settingsLoader = new XMLLoader(settingsFilePath);
			if (settingsLoader.fileExists) {
				settingsLoader.load();
				settingsLoader.addEventListener(settingsFilePath, setupConfig);
			} else {
				createSettingsFile();
			}
			
		}
		
		private function createSettingsFile () {
			var settingsXML:XML = <models>GOMS MODELS SETTINGS</models>;
			
			var localFile = new File(File.documentsDirectory.nativePath); 
				localFile = localFile.resolvePath(settingsFilePath); 
			var localFileStream:FileStream = new FileStream();
				localFileStream.open(localFile, FileMode.WRITE);
				localFileStream.writeUTFBytes(settingsXML.toXMLString());
				localFileStream.close();
			
			settingsLoader.load();
			settingsLoader.addEventListener(settingsFilePath, setupConfig);
		}
		
		private function setupConfig (evt:Event) {
			
			config = config.resolvePath("cogulator/config");
			configFilePath = config.nativePath 
			var slash = configFilePath.indexOf("\\");
			if (slash < 0) configFilePath += "//config.txt"; //mac or linux
			else configFilePath += "\\config.txt";
			cnfg = new TextLoader(configFilePath);
			cnfg.addEventListener(configFilePath, loadConfig);
			
			generateModelsButtons();
		}
		
		private function populateFilesArrays(directory:String):void {
			var extension:String = new String();
			
			for each (var item in modelDirectoryContents) {
				extension = item.name.substring(item.name.lastIndexOf(".")+1, item.name.length);
				if (item.isDirectory) directories.push(item);
				else if (extension == "goms") files.push({dir: directory, file: item});
			}
		}
		
		private function loadConfig(evt:Event):void {
			currentFilePath = cnfg.txt;
			
			var pathArray:Array;
			var slash:int = currentFilePath.indexOf("\\");
			if (slash < 0) pathArray = currentFilePath.split("/"); //mac or linux
			else pathArray = currentFilePath.split("\\");
			
			configFileName = pathArray[pathArray.length -1];
			onFirstOpen();
		}
		
		private function generateModelsButtons():void {
			var currentDirectory = "models";
			_newButton.addEventListener(MouseEvent.CLICK, newModel);
			
			for each (var model in files) {
				if (model.dir != currentDirectory) { //if this is a new directory, create a directory label
					currentDirectory = model.dir;
					lineY += 25;
					var directory:HeadingLabel = new HeadingLabel();
						directory.labeltxt.text = model.dir; 
						directory.x = labelX;
						directory.y = lineY;
						addChild(directory);
						directoryLabels.push(directory);
					lineY += 25;
				}
				
				var modelButton:ModelButton = new ModelButton();
					modelButton.modelField.text = model.file.name.substring(0,model.file.name.length - 5);
					modelButton.modelField.autoSize = TextFieldAutoSize.CENTER;
					modelButton.filePath = model.file.nativePath;
					modelButton.x = modelX;
					modelButton.y = lineY;
					modelButton.addEventListener(MouseEvent.CLICK, onModelClick);
					modelButton.addEventListener(MouseEvent.ROLL_OVER, onMouseOver);
					modelButton.addEventListener(MouseEvent.ROLL_OUT, onMouseOut);
					modelButton.deleteButton.addEventListener(MouseEvent.CLICK, onDeleteClick);
					modelButton.deleteButton.addEventListener(MouseEvent.ROLL_OVER, onOverDelete);
					modelButton.deleteButton.addEventListener(MouseEvent.ROLL_OUT, onOutDelete);
					modelButton.hghlight.visible = false;
					modelButton.hghlight.height = modelButton.modelField.height - 2;
					modelButton.deleteButton.visible = false;
					modelButton.strikeThrough.visible = false;
				addChild(modelButton);
				modelButtons.push(modelButton);
				
				if (currentFilePath == modelButton.filePath) {
					modelButton.select.visible = true;
					modelButton.modelField.setTextFormat(bold);
				} else modelButton.select.visible = false;
				
				lineY += modelButton.modelField.height + 3;
			}
			
		}
		
		public function reGenerateModelsButtons ():void { //clear out the old before calling the generate function again
			for each (var old in modelButtons) {
				old.removeEventListener(MouseEvent.CLICK, onModelClick);
				old.removeEventListener(MouseEvent.ROLL_OVER, onMouseOver);
				old.removeEventListener(MouseEvent.ROLL_OUT, onMouseOut);
				old.deleteButton.removeEventListener(MouseEvent.CLICK, onDeleteClick);
				old.deleteButton.removeEventListener(MouseEvent.ROLL_OVER, onOverDelete);
				old.deleteButton.removeEventListener(MouseEvent.ROLL_OUT, onOutDelete);
				removeChild(old)
				old = null;
			}
			
			for each (var oldDir in directoryLabels){
				removeChild(oldDir);
				oldDir = null;
			}
			
			modelButtons.length = 0;
			directories.length = 0;
			directoryLabels.length = 0;
			files.length = 0;
			modelDirectoryContents.length = 0;
			models = null;
			models = new File(File.documentsDirectory.nativePath);
			models = models.resolvePath("cogulator/models");
			modelDirectoryContents = models.getDirectoryListing();
			
			populateFilesArrays("models");
			
			
			for each (var dir in directories) {
				modelDirectoryContents.length = 0;
				modelDirectoryContents = dir.getDirectoryListing();
				populateFilesArrays(dir.name);
			}
			
			lineY = 0;
			
			generateModelsButtons();
		}
		
		private function onOverDelete(evt:MouseEvent) {
			evt.currentTarget.parent.removeEventListener(MouseEvent.CLICK, onModelClick);
			if (evt.currentTarget.currentFrame == 1) evt.currentTarget.gotoAndStop(2);
			else if (evt.currentTarget.currentFrame == 3) evt.currentTarget.gotoAndStop(4);
		}
		
		private function onOutDelete(evt:MouseEvent) {
			evt.currentTarget.parent.addEventListener(MouseEvent.CLICK, onModelClick);
			if (evt.currentTarget.currentFrame == 2) evt.currentTarget.gotoAndStop(1);
			else if (evt.currentTarget.currentFrame == 4) evt.currentTarget.gotoAndStop(3);
		}
		
		private function onDeleteClick(evt:MouseEvent) {
			if (evt.currentTarget.currentFrame == 2) evt.currentTarget.gotoAndStop(4);
			else if (evt.currentTarget.currentFrame == 4) evt.currentTarget.gotoAndStop(2);
			
			evt.currentTarget.parent.deleteModel = !evt.currentTarget.parent.deleteModel;
			if (evt.currentTarget.parent.deleteModel) evt.currentTarget.parent.strikeThrough.visible = true;
			else evt.currentTarget.parent.strikeThrough.visible = false;
		}
		

		
		
		private function onMouseOver(evt:MouseEvent):void {
			evt.currentTarget.hghlight.visible = true;
			evt.currentTarget.deleteButton.visible = true
		}
		
		private function onMouseOut(evt:MouseEvent):void{
			evt.currentTarget.hghlight.visible = false;
			evt.currentTarget.deleteButton.visible = false
		}
		
		private function onModelClick(evt:MouseEvent) {
			saveModel(); //save the currently open model before opening the new model
			
			for each (var modelButton in modelButtons){
				modelButton.select.visible = false;
				modelButton.hghlight.visible = false;
				modelButton.modelField.setTextFormat(regular);
			}
			
			currentFilePath = evt.currentTarget.filePath;
			evt.currentTarget.hghlight.visible = true; //keep highlighted - let mouse out unhighlight
			//bold here
			evt.currentTarget.modelField.setTextFormat(bold);
			evt.currentTarget.select.visible = true;
			code = new TextLoader(currentFilePath);
			code.addEventListener(currentFilePath, onModelLoaded);
			
			lastOpenFile(); //save the path to the currently open model
			
			_timeReadout.title.autoSize = TextFieldAutoSize.LEFT;
			_timeReadout.title.text = evt.currentTarget.modelField.text;
			_timeReadout.taskTimeField.x = _timeReadout.title.x +_timeReadout.title.width;
		}
		
		private function onFirstOpen() {
			for each (var modelButton in modelButtons){
				modelButton.select.visible = false;
			}
			
			for each (var mB in modelButtons){
				if (mB.modelField.text + ".goms" == configFileName) {
					mB.select.visible = true;
					mB.modelField.setTextFormat(bold);
					_timeReadout.title.text = configFileName.substring(0, configFileName.length - 5);
				} 
			}

			code = new TextLoader(currentFilePath);
			code.addEventListener(currentFilePath, onModelLoaded);			
		}
		
		private function onModelLoaded(evt:Event):void {
			//determine if model is within 250 line limit
			$.codeTxt.text = code.txt;
			
/*			var lineLength:Array = code.txt.split("\r");
			if (lineLength.length > 250) modelTooLarge();*/
			
			var automate:Boolean = getAutomateWMsetting();
			if (automate) dispatchEvent(new Event("model_loaded_automate"));
			else dispatchEvent(new Event("model_loaded_do_not_automate"));
		}
		
		
		private function getAutomateWMsetting():Boolean {
			var autoModelWM:String = settingsLoader.xML.model.(@NAME==_timeReadout.title.text).autoWM;
			if (autoModelWM == "true") return true;
			else if (autoModelWM == "false") return false; //tells the main class to recreate the models sidebar;
			
			return true; 
		}
		
		private function modelTooLarge():void{
			MovieClip(parent).lineLimitAlert.visible = true;
			
			var largeFile:File = new File(currentFilePath);
			var toDesktop:File = File.desktopDirectory.resolvePath("file-too-large.goms");
			 
			largeFile.addEventListener(Event.COMPLETE, largeFileCopyCompleteHandler);
			largeFile.addEventListener(IOErrorEvent.IO_ERROR, largeFileMoveIOErrorEventHandler); 
			largeFile.copyToAsync(toDesktop, true);
		}
		
		private function largeFileCopyCompleteHandler(event){ 
			//show info dialogue about what happened
			MovieClip(parent).lineLimiter();
			
		} 
		
		private function largeFileMoveIOErrorEventHandler(event) { 
			trace("I/O Error.");
		}
		
		
		private function saveModelClick(evt:MouseEvent):void {
			saveModel();
			MovieClip(parent).refreshModel();
		}
		
		public function saveModel():void {
			var localFile = new File(File.documentsDirectory.nativePath); 
				localFile = localFile.resolvePath(currentFilePath); 
			var localFileStream:FileStream = new FileStream();
				localFileStream.open(localFile, FileMode.WRITE);
				localFileStream.writeMultiByte($.codeTxt.text, "utf-8");

				localFileStream.close();
			
			saveAutomateWMSetting();
		}
		
		private function saveAutomateWMSetting():void {
			var autoModelWM:String = settingsLoader.xML.model.(@NAME==_timeReadout.title.text).autoWM;
			if (autoModelWM == "true" && $.automateButton.currentFrame == 3) {
				settingsLoader.xML.model.(@NAME==_timeReadout.title.text).autoWM = "false";
			} else if (autoModelWM == "false" && $.automateButton.currentFrame == 1) {
				settingsLoader.xML.model.(@NAME==_timeReadout.title.text).autoWM = "true";
			} else if (autoModelWM == "") {
				var automate:String = "true";
				if ($.automateButton.currentFrame == 3) automate = "false";
				var newModel:XML = <model NAME={_timeReadout.title.text}><autoWM>{automate}</autoWM></model>;
				settingsLoader.xML.appendChild(newModel);
			}
			
			var localFile = new File(File.documentsDirectory.nativePath); 
				localFile = localFile.resolvePath(settingsFilePath); 
			var localFileStream:FileStream = new FileStream();
				localFileStream.open(localFile, FileMode.WRITE);
				localFileStream.writeUTFBytes(settingsLoader.xML.toXMLString()); 

				localFileStream.close();
			
			
			//do nothing if none of these conditions are met... the setting is already correct in the file
		}

		
		
		private function newModel(evt:MouseEvent):void {
			_newModelCHI.collectionField.text = "";
			_newModelCHI.modelField.text = "";
			_newModelCHI.optionalLabel.visible = true;
			_newModelCHI.visible = true;
			
			$.stage.focus = _newModelCHI.modelField;
			_newModelCHI.modelField.setSelection(0, 0);
			_newModelCHI.modelField.addEventListener(KeyboardEvent.KEY_UP, onKeyUP);
		}
		
		private function onKeyUP (evt:KeyboardEvent):void {
			//evt.currentTarget.text = evt.currentTarget.text.split(" ").join("_"); //no longer require _
			
			if (nameAlreadyExists(_newModelCHI.modelField.text) == false) {
				_newModelCHI.nameExists.visible = false;
				if (_newModelCHI.modelField.text != "") {
					_newModelCHI.goButton.visible = true;
					_newModelCHI.goButton.alpha = 0;
					TweenLite.to(_newModelCHI.goButton, .5, {alpha:1, ease:Quint.easeIn});
					_newModelCHI.collectionField.addEventListener(KeyboardEvent.KEY_UP, onEnterPress);
					_newModelCHI.modelField.addEventListener(KeyboardEvent.KEY_UP, onEnterPress);
				}
			} else {
				_newModelCHI.collectionField.removeEventListener(KeyboardEvent.KEY_UP, onEnterPress);
				_newModelCHI.modelField.removeEventListener(KeyboardEvent.KEY_UP, onEnterPress);
				_newModelCHI.goButton.visible = false;
				_newModelCHI.nameExists.visible = true;
			}
			
		}
		
		private function nameAlreadyExists(txt:String):Boolean {
			for each (var mB in modelButtons){
				if ( mB.modelField.text.toLowerCase() == txt.toLowerCase() ) return true;
			}
			return false;
		}
		
		private function onEnterPress(evt:KeyboardEvent):void{
			if (evt.keyCode == Keyboard.ENTER) createModel();
		}
		
		private function createModel():void{
			_newModelCHI.collectionField.removeEventListener(KeyboardEvent.KEY_UP, onEnterPress);
			_newModelCHI.modelField.removeEventListener(KeyboardEvent.KEY_UP, onEnterPress);
			_newModelCHI.goButton.visible = false;
				
			_newModelCHI.visible = false;
			
			//save currently open Model
			saveModel();
			
			//generate the path for the model
			var slash:int = currentFilePath.indexOf("\\");
			if (slash < 0) {
				currentFilePath = models.nativePath + "/" + _newModelCHI.collectionField.text  + "/" +  _newModelCHI.modelField.text + ".goms"; //mac or linux
				currentFilePath = currentFilePath.split("//").join("/");

			} else {
				currentFilePath = models.nativePath + "\\" + _newModelCHI.collectionField.text  + "\\" +  _newModelCHI.modelField.text + ".goms";
				currentFilePath = currentFilePath.split("\\\\").join("\\");
			}

			
			lastOpenFile(); //save this new model as the last open model
			
			//put model name in header
			_timeReadout.title.text = _newModelCHI.modelField.text;
			
			//blank the code text
			$.codeTxt.text = "";
			
			//save the new model
			saveModel();
			
  			dispatchEvent(new Event("new_model_added")); //tells the main class to recreate the models sidebar
		}
		
		public function lastOpenFile():void {
			var localFile = new File(File.applicationDirectory.nativePath);
				localFile = localFile.resolvePath(configFilePath); 
			var localFileStream:FileStream = new FileStream();
				localFileStream.open(localFile, FileMode.WRITE);
				localFileStream.writeMultiByte(currentFilePath, "utf-8");
				localFileStream.close();
		}
		
		private function replaceDoubleBackslash(str:String):String {
			var myPattern:RegExp = /\\/g;
			return(str.replace(myPattern, "\\")); 
		}
		

	}
	
}
