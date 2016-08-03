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

package {
	
	import flash.display.*;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.events.KeyboardEvent;
	import flash.events.FocusEvent;
	import flash.display.Sprite;
	import fl.events.ScrollEvent;
	import flash.geom.Point;
	import flash.geom.Rectangle;
	import flash.filesystem.File;
	import flash.ui.Keyboard;
	import flash.text.TextFieldAutoSize;
	import flash.desktop.NativeApplication;
	import com.greensock.*;
	import com.greensock.easing.*;
	//import classes.LineNumbers;
	import classes.AutoComplete;
	import classes.TextLoader;
	import classes.OperatorsSidebar;
	import classes.ModelsSidebar;
	import classes.ModelStatus;
	import classes.GanttChart;
	import classes.SyntaxColor;
	import classes.TakePicture;
	import classes.TextHighlighter;
	import classes.UndoRedo;
	import classes.FirstRun;
	import classes.IndentComment;
	import classes.HintsTool;
	import classes.AppSettings;
	import classes.CustomScrollBar;
	import classes.AppUpdater;
	import classes.ExportData;
	import com.inruntime.utils.*;
	import flash.utils.Timer;
	import flash.utils.Dictionary;
	import flash.events.TimerEvent;
	
	public class Main extends MovieClip{
		
		var errors:Dictionary = new Dictionary();
		var operatorArray:Array = new Array();

		//    - create global variables object - 
		var $:Global = Global.getInstance();
		
		//  - for sizing
		var scl:Number = 5000;
		
		//	- start up undo redo -
		var undoRedo:UndoRedo;
		var settings:AppSettings;
		
		// - for commenting
		var addRemoveCommment:IndentComment;
		
		var modelStatus:ModelStatus;
		var run:FirstRun = new FirstRun();

		// the first run function verifies all the required files exist and are in the right places
		var opsSideBar:OperatorsSidebar;
		var opsScrollBar:CustomScrollBar;
		var ops:TextLoader;
		
		//    - set up the gantt chart -
		var timeLineLblsContainer:Sprite = new Sprite();
			
		var gantt:GanttChart;
		var ganttContainer:Sprite = new Sprite();
		var ganttClosed:Boolean = true;

		var hints:HintsTool;
		
		//    - generate models sidebar - 
		var modelsSideBar:ModelsSidebar;
		var  modelsScrollBar:CustomScrollBar;
		
		var defaultTimeLineDraggerX:Number;
		
		//    - handle stage resizing - 
		var ganttGap:Number;
		var lineGap:Number;
		
		var ganttFudge:Number = 80;
		var slideSpeed:Number = .5;
		

		public function Main() {
			$.stage = this.stage;
			$.codeTxt = codeTxt;
			$.errors = errors;
			$.automateButton = ganttWindow.automateButton;
			//operatorsArray is grabbed after array is populated
			
			//stage setup - don't zoom
			stage.scaleMode = StageScaleMode.NO_SCALE;
			stage.align = StageAlign.TOP_LEFT;
				
			//    - init - 
			lineNumbers.visible = false;
			newModelCHI.visible = false;
			hintsCHI.visible = false;
			lineLimit.visible = false;
			lineLimitAlert.visible = false;
			helpImages.visible = false;
			completeMe.visible = false;
			firstRunQuickStart.visible = false;
			codeTxt.tabEnabled = false;
			line.width = 710;


			//	- check for update -
			AppUpdater.updateCheck();
			
			//  - setup Classes
			undoRedo = new UndoRedo();
			settings = new AppSettings(settingsPanel, this, codeTxt);
			addRemoveCommment = new IndentComment(cidToolbar);
			modelStatus = new ModelStatus(timeReadout);
			
			defaultTimeLineDraggerX = ganttWindow.timeLineDragger.x;
		
			//    - handle stage resizing - 
			ganttGap = stage.stageWidth - (ganttWindow.chartBckgrnd.x + ganttWindow.chartBckgrnd.width);
			lineGap = stage.stageWidth - (line.x + line.width);

			cidToolbar.infoButton.addEventListener(MouseEvent.CLICK, openHelp);
			addRemoveCommment.addEventListener("In Dent We Trust", getRefresh);
			
			//  - First Run Stuff
			run.addEventListener("ready", onReady);
			run.firstRunTest(firstRunQuickStart);
			
			//  - Gantt Chart Setup
			ganttContainer.x = ganttWindow.chartBckgrnd.x
			ganttContainer.y = ganttWindow.chartBckgrnd.y
			ganttContainer.mask = ganttWindow.ganttChartMask;
			ganttWindow.addChild(ganttContainer);
			ganttWindow.addChild(timeLineLblsContainer);
			
			hintsCHI.hintText.addEventListener(MouseEvent.CLICK, refreshModel);
			
			//    - handle data export - 
			exportButton.addEventListener(MouseEvent.CLICK, onExportClick);
		
		
			//  - switch between operators & models in the sidebar
			sidebarToggle.operators.addEventListener(MouseEvent.CLICK, onSideBarClick);
			sidebarToggle.models.addEventListener(MouseEvent.CLICK, onSideBarClick);
			
			//  - handle stage resizing
			stage.addEventListener(Event.RESIZE, onResizeStage);
			
			//  - custome keyboard commands
			stage.addEventListener(KeyboardEvent.KEY_UP, respondToCustomKeyBoardCommands);

			ganttWindow.automateButton.addEventListener(MouseEvent.CLICK, automateOnOff);
			timeReadout.refreshButton.addEventListener(MouseEvent.MOUSE_DOWN, refreshModel);
			codeTxt.addEventListener(FocusEvent.KEY_FOCUS_CHANGE, textKeyFocusChange);
			codeTxt.addEventListener(KeyboardEvent.KEY_DOWN, autoComplete);
			codeTxt.addEventListener(Event.CHANGE, onTextChange);
			completeMe.addEventListener(MouseEvent.CLICK, clickToComplete);
			stage.addEventListener(MouseEvent.CLICK, hideOnClick);
			newModelCHI.collectionField.addEventListener(FocusEvent.FOCUS_IN, focusInHandler);
			ganttWindow.ganttButton.addEventListener(MouseEvent.CLICK, slideGantt);
			ganttWindow.timeLineDragger.addEventListener(MouseEvent.MOUSE_DOWN, startDragging);
			addEventListener(MouseEvent.MOUSE_UP, stopDragging);
			ganttWindow.zoomInOutButton.zoomInButton.addEventListener(MouseEvent.CLICK, zoomGanttViaButton);
			ganttWindow.zoomInOutButton.zoomOutButton.addEventListener(MouseEvent.CLICK, zoomGanttViaButton);
			ganttWindow.addEventListener(MouseEvent.MOUSE_WHEEL, zoomGanttChart);
			ganttWindow.cameraButton.addEventListener(MouseEvent.CLICK, takePicture);
			
			stage.nativeWindow.addEventListener(Event.CLOSING, closeApplication, false, 0, true);  

		}
		

		//set help link
		function openHelp(evt:MouseEvent){
			helpImages.visible = true;
		}
		


		//set up commenting
		function getRefresh(evt:Event){
			refreshModel();
			hintsCHI.hintText.addEventListener
		}
		

		function onReady(evt:Event):void {
			//    - load the operator text file & generate operators sidebar - 
			ops = new TextLoader("cogulator/operators/operators.txt");
			ops.addEventListener("cogulator/operators/operators.txt", generateOperatorsSidebar);
		}

		
		function generateOperatorsSidebar (evt:Event):void {
			operatorArray = ops.arry; 
			operatorArray.push({resource: "cognitive", appelation: "Ignore", time: 50, description: "Removes_item_from_working_memory.", labelUse: ""});
			$.operatorArray = operatorArray;
				
			//opsSideBar = new OperatorsSidebar(lineNumbers, undoRedo);
			opsSideBar = new OperatorsSidebar(undoRedo);
			opsSideBar.y = 65;
			opsSideBar.visible = false;
			addChildAt(opsSideBar, 4);
			
			opsScrollBar = new CustomScrollBar(stage, ganttWindow, opsSideBar, sidebarbckgrnd, 35);
			addChildAt(opsScrollBar, 4);
			
			hints = new HintsTool(hintsButton, hintsCHI, errorLine, highlighter, scrollBar, opsSideBar.insert);
			//needs to be modified at some point to use refreshModel with reloading the model twice
			hintsButton.addEventListener(MouseEvent.MOUSE_DOWN, refreshModelSansHints);
			
			generateModelsSidebar();
		}


		function generateModelsSidebar():void {
			modelsSideBar = new ModelsSidebar(saveButton, newButton, newModelCHI, timeReadout);
			modelsSideBar.addEventListener("model_loaded_automate", modelLoaded);
			modelsSideBar.addEventListener("model_loaded_do_not_automate", modelLoaded);	
			modelsSideBar.addEventListener("new_model_added", reloadModels);
			modelsSideBar.y = 55;
			addChildAt(modelsSideBar,2);
			
			modelsScrollBar = new CustomScrollBar(stage, ganttWindow, modelsSideBar, sidebarbckgrnd, 55);
			addChildAt(modelsScrollBar,2);
		}

		
		function modelLoaded(evt:Event):void { //once the model is loaded
			if (evt.type == "model_loaded_automate") ganttWindow.automateButton.gotoAndStop(1);
			else ganttWindow.automateButton.gotoAndStop(3);
			hints.hideHintsCHI();
			undoRedo.init(); //initialize the undo redo functionality
			refreshModel();
			resetTimeLine();
			updateStage();
			
			modelsScrollBar.resizeScrollBarElements();	//ensure the scrollbar is showing
		}

		
		//when a new model is added, regenerate the models sidebar
		function reloadModels(evt:Event){
			modelsSideBar.reGenerateModelsButtons();
			lineNumbers.text = "";
			refreshModel();
			modelsScrollBar.resizeScrollBarElements();
			modelsScrollBar.adjustSideBar();
			stage.focus = codeTxt;
		}

		
		
		function resetTimeLine(){
			ganttWindow.timeLineDragger.x = defaultTimeLineDraggerX;
			moveChart();
		}



		function onExportClick(evt:MouseEvent):void {
			//addEventListener("refresh_complete", handleRefreshComplete);
			refreshModel();
			ExportData.export(timeReadout.title.text);
		}



		//    - sidebar toggle - 
		function onSideBarClick (evt:MouseEvent):void {
			if (sidebarToggle.currentFrame == 2) {
				opsSideBar.visible = true;
				if (opsScrollBar.prcntShown < 1) opsScrollBar.visible = true;
				modelsSideBar.visible = false;
				modelsScrollBar.visible = false;
			} else if (sidebarToggle.currentFrame == 4) {
				opsSideBar.visible = false;
				opsScrollBar.visible = false;
				modelsSideBar.visible = true;
				if (modelsScrollBar.prcntShown < 1) modelsScrollBar.visible = true;
			}
		}



		function onResizeStage(evt:Event):void {
			updateStage();
			if(hintsCHI.visible) hints.resized();
		}

		function updateStage():void {
			
			//    - resize the line
			line.width = stage.stageWidth - line.x - lineGap;
			
			//    - move the task time readout
			var timeReadoutX:Number = line.x + (line.width / 2 - (timeReadout.width + hintsButton.width) / 2);
			if (timeReadoutX < exportButton.x + 50) timeReadout.x = exportButton.x + 50;
			else timeReadout.x = timeReadoutX;
			
			//    - update the hints button position
			hintsButton.x = timeReadout.x + timeReadout.taskTimeField.x + timeReadout.taskTimeField.width + 10;
			
			
			//    - move the cidToobar
			if (line.x + line.width - cidToolbar.width > timeReadout.x + timeReadout.width + 50) cidToolbar.x = line.x + line.width - cidToolbar.width;
			else cidToolbar.x = timeReadout.x + timeReadout.width + 50;
				
			//    - resize the sidebar -
			sidebarbckgrnd.height = stage.stageHeight;
			
			//    - resize the gantt chart -
			ganttWindow.chartBckgrnd.width = stage.stageWidth - ganttWindow.chartBckgrnd.x - ganttGap;
			ganttWindow.ganttChartMask.width = stage.stageWidth - ganttWindow.chartBckgrnd.x - ganttGap;
			ganttWindow.mainTimeLine.width = stage.stageWidth - ganttWindow.chartBckgrnd.x - ganttGap;
			
			ganttWindow.moreArrow.x  = stage.stageWidth - ganttGap;
			ganttWindow.avgWorkingMemoryTxt.x  = ganttWindow.chartBckgrnd.width - 50;
			ganttWindow.zoomInOutButton.x  = stage.stageWidth - ganttGap + 10;
			newGantt(true);
			
			//    - move the gantt chart -
			if (ganttClosed == true) ganttWindow.y = stage.stageHeight;
			else ganttWindow.y = stage.stageHeight - ganttWindow.height + ganttFudge;
			
			//    - resize the code text box -
			codeTxt.height = ganttWindow.y - codeTxt.y;
			codeTxt.width = stage.stageWidth - 250;
			
			//    - size the line number textfield to code text;
			//lineNumbers.height = codeTxt.height;
			//timer.stop(); 
			//timer.start();
				
			//    - resize the scroll bar for the code text box -
			scrollBar.height = codeTxt.height + 26;
			scrollBar.x = stage.stageWidth - scrollBar.width - 5;
			scrollBar.update();
			
			//    - resize the help images window (info button)
			helpImages.background.height = stage.stageHeight;
			helpImages.background.width = stage.stageWidth;
			helpImages.imageContainer.x = stage.stageWidth / 2 - helpImages.imageContainer.width / 2;
			helpImages.imageContainer.y = stage.stageHeight / 2 - helpImages.imageContainer.height / 2;
		}




		// on maxize minize it seems the line numbering happens prior to the word wrapping in the field finalizing
		// this delay ensures the line numbers happen after word wrapping completeg
		/*var timer:Timer = new Timer(10, 1);
		function lineNumberTimerEvent(evt:TimerEvent) {
			LineNumbers.numberTheLines(lineNumbers, codeTxt);
		}
		timer.addEventListener(TimerEvent.TIMER_COMPLETE, lineNumberTimerEvent);



		//connect code text scroll action to linenumbers
		function scrollLineNumbers (evt:Event) {
			lineNumbers.scrollV = codeTxt.scrollV;
		}
		codeTxt.addEventListener(ScrollEvent.SCROLL, scrollLineNumbers);*/


		//		- special keyboard commands including cntrl events
		function respondToCustomKeyBoardCommands (evt:KeyboardEvent):void {
			if (evt.ctrlKey) {
				switch ( evt.keyCode ) {
					case Keyboard.S : //if control+s for save 
						saveButton.gotoAndPlay(3);
						modelsSideBar.saveModel();
						break;
					case Keyboard.V :
					case Keyboard.R :
						refreshModel();
						break;
					case 189 : //replace underscores with spaces
						var str:String = codeTxt.text.substring(codeTxt.selectionBeginIndex, codeTxt.selectionEndIndex);
							str = str.replace(/_/gi, " ");
						var begin:String = codeTxt.text.substring(0, codeTxt.selectionBeginIndex)
						var end:String = codeTxt.text.substring(codeTxt.selectionEndIndex, codeTxt.text.length)
						codeTxt.text = begin + str + end;
						break;
				}
			} else if (evt.keyCode == Keyboard.ENTER) {
				refreshModel();
			} else if (evt.keyCode == Keyboard.ESCAPE) {
				completeMe.visible = false;
				helpImages.visible = false;
				hints.hideHintsCHI();
				SyntaxColor.solarizeSelectedLine();
				modelStatus.lineChange();
			} 
		}
		
				



		//		- update when automate is turned on/off
		function automateOnOff(evt:MouseEvent):void{
			if (evt.currentTarget.currentFrame == 2) {
				evt.currentTarget.gotoAndStop(4);
			} else if (evt.currentTarget.currentFrame == 4) {
				evt.currentTarget.gotoAndStop(2);
			}
			newGantt(true);
		}
		




		//    - refresh the model
		function refreshModel(event:MouseEvent = null):void {
			newGantt(true); //has to be second because goal errors are found and colorized from here
			modelStatus.modelUpdated(); //has to be last - syntaxcolor updates error list
			updateTaskTimeField(); //field depends on results of the rest
			hints.generateHints(); //update the hints based on the new info
			dispatchEvent(new Event("refresh_complete"));	
		}
		



		function refreshModelSansHints(event:MouseEvent = null):void {
			newGantt(true); //has to be second because goal errors are found and colorized from here
			modelStatus.modelUpdated(); //has to be last - syntaxcolor updates error list
			updateTaskTimeField(); //field depends on results of the rest
		}



		//    prevent tabs in the code field from changing focus
		function textKeyFocusChange(e:FocusEvent):void {
			e.preventDefault();
		}
		




		//    autoComplete code Text
		function autoComplete(evt:KeyboardEvent){
			if (completeMe.visible && evt.keyCode == Keyboard.ENTER) {
				evt.preventDefault();
				completeMe.visible = false;
				codeTxt.replaceText(codeTxt.caretIndex, codeTxt.caretIndex, completeMe.field.text + " ");
				codeTxt.setSelection(codeTxt.caretIndex + completeMe.field.length, codeTxt.caretIndex + completeMe.field.length);
				var errorFixed:Boolean = SyntaxColor.solarizeSelectedLine();
				if (errorFixed) refreshModel(); //if an existing error is elimated in the course of typing, refresh the model
				else modelStatus.lineChange();
			}
		}
		



		//    - monitor changes to text for autocomplete and syntax coloring 
		function onTextChange(evt:Event):void {
			//lineLimiter();
			//LineNumbers.numberTheLines(lineNumbers, codeTxt);
			
			var errorFixed:Boolean = SyntaxColor.solarizeSelectedLine();
			if (errorFixed) refreshModel(); //if an existing error is elimated in the course of typing, refresh the model
			else modelStatus.lineChange();
			
			var caretXY:Point = getCaretXY();
			var addedText:String = AutoComplete.autoCompleteCode(codeTxt, operatorArray);
			
			if (addedText.replace(" ", "") != "") {
				completeMe.field.text = addedText;
				completeMe.x = caretXY.x;
				completeMe.y = caretXY.y;
				completeMe.field.autoSize = TextFieldAutoSize.LEFT;
				completeMe.bckgrnd.width = completeMe.field.width;
				completeMe.visible = true;
			} else completeMe.visible = false;
		}
		

		function lineLimiter() {
			if (codeTxt.numLines > 250) {
				var i:int = codeTxt.getLineOffset(250);
				codeTxt.text = codeTxt.text.substring(0, i);
				lineLimit.visible = true;
			} else {
				lineLimit.visible = false;
			}
		}

		function clickToComplete(evt:MouseEvent):void{
			stage.focus = codeTxt;
			completeMe.visible = false;
			codeTxt.replaceText(codeTxt.caretIndex, codeTxt.caretIndex, completeMe.field.text);
			codeTxt.setSelection(codeTxt.caretIndex + completeMe.field.length, codeTxt.caretIndex + completeMe.field.length);
			SyntaxColor.solarizeSelectedLine();
			modelStatus.lineChange();
		}
		

		function hideOnClick(evt:MouseEvent):void {
			//pressing esc also hides the autocomplete
			completeMe.visible = false;
			SyntaxColor.solarizeSelectedLine();
		}
		

		function getCaretXY():Point {
			var rect:Rectangle = codeTxt.getCharBoundaries(codeTxt.caretIndex - 1);
			if(rect == null) return (new Point(codeTxt.x, codeTxt.y));
			else return (new Point (codeTxt.x + rect.x + rect.width, codeTxt.y + rect.y - 2));
		}




		//    - stage focus for tab management
		
		function focusInHandler(e:FocusEvent):void {
			if (e.currentTarget.name == "labelField") {
				newModelCHI.visible = false;
			} else if (e.currentTarget.name == "collectionField") {
				newModelCHI.collectionField.tabIndex = 1;
				newModelCHI.modelField.tabIndex = 2;
			}
		}



		//		- Gantt Chart Management
		function newGantt(drawNewTimeLine:Boolean):void {
			while ( timeLineLblsContainer.numChildren > 0 ) timeLineLblsContainer.removeChildAt(0)
			if (gantt) {
				ganttContainer.removeChild(gantt);
				gantt = null;
			}
			gantt = new GanttChart(ganttWindow, scl, drawNewTimeLine, timeLineLblsContainer);
			
			ganttContainer.addChild(gantt);
			$.gantt = gantt; //for use with the hints tool
			
			//should not be necessary.  I think this is flash rendering issue as it's not just the chart lines, but the background too...
			ganttWindow.ganttChartMask.width = ganttWindow.chartBckgrnd.width + 1;
		}

		function updateTaskTimeField():void {
			if (isNaN(gantt.maxEndTime)) timeReadout.taskTimeField.text = " "; 
			else if (modelStatus.errorsExist) timeReadout.taskTimeField.text = "   ...";
			else timeReadout.taskTimeField.text = ": " + String(Math.round(gantt.maxEndTime/100)/10) + " s";
			
			timeReadout.title.autoSize = TextFieldAutoSize.LEFT;
			timeReadout.taskTimeField.autoSize = TextFieldAutoSize.LEFT;
			timeReadout.taskTimeField.x = timeReadout.title.x + timeReadout.title.width;
			
			timeReadout.timeUnderline.x = timeReadout.taskTimeField.x + 10;
			timeReadout.timeUnderline.width = timeReadout.taskTimeField.width - 10;
			
			hintsButton.x = timeReadout.x + timeReadout.taskTimeField.x + timeReadout.taskTimeField.width + 10;
			hintsCHI.x = hintsButton.x;
		}



		function slideGantt(evt:MouseEvent):void {
			if (ganttClosed) {
				TweenLite.to(ganttWindow, slideSpeed, {y:stage.stageHeight - ganttWindow.height + ganttFudge, onComplete:onFinishTween});
				TweenLite.to(codeTxt, slideSpeed, {height:stage.stageHeight - ganttWindow.height + ganttFudge - codeTxt.y});
				TweenLite.to(scrollBar, slideSpeed, {height:stage.stageHeight - ganttWindow.height + ganttFudge - codeTxt.y + 26});
				TweenLite.to(modelsSideBar, slideSpeed, {y:sidebarMovement(modelsScrollBar, modelsScrollBar.sideBarDefaultY)});
				TweenLite.to(modelsScrollBar.dragger, slideSpeed, {y:-sidebarMovement(modelsScrollBar, modelsScrollBar.sideBarDefaultY) + modelsScrollBar.sideBarDefaultY});
			} else {
				TweenLite.to(ganttWindow, slideSpeed, {y:stage.stageHeight, onComplete:onFinishTween});
				TweenLite.to(codeTxt, slideSpeed, {height:stage.stageHeight - codeTxt.y});
				TweenLite.to(scrollBar, slideSpeed, {height:stage.stageHeight - codeTxt.y + 26});
				TweenLite.to(modelsSideBar, slideSpeed, {y:sidebarMovement(modelsScrollBar, modelsScrollBar.sideBarDefaultY)});
				TweenLite.to(modelsScrollBar.dragger, slideSpeed, {y:-sidebarMovement(modelsScrollBar, modelsScrollBar.sideBarDefaultY) + modelsScrollBar.sideBarDefaultY});
				TweenLite.to(opsSideBar, slideSpeed, {y:sidebarMovement(opsScrollBar, opsScrollBar.sideBarDefaultY)});
				TweenLite.to(opsScrollBar.dragger, slideSpeed, {y:-sidebarMovement(opsScrollBar, opsScrollBar.sideBarDefaultY) + opsScrollBar.sideBarDefaultY});
			}
			
			ganttClosed = !ganttClosed;
			
			function onFinishTween():void {
				TweenLite.to(ganttWindow.ganttButton, .3, {rotation:ganttWindow.ganttButton.rotation + 180});
				
				opsScrollBar.resizeScrollBarElements();
				opsScrollBar.adjustSideBar();
				if (opsScrollBar.prcntShown < 1 && sidebarToggle.currentFrame == 2) opsScrollBar.visible = true;
				
				modelsScrollBar.resizeScrollBarElements();
				modelsScrollBar.adjustSideBar();
				if (modelsScrollBar.prcntShown < 1 && sidebarToggle.currentFrame == 4) modelsScrollBar.visible = true;
				
				scrollBar.update();
			}
		}

		function sidebarMovement(sidebar:Object, defaultY:Number):Number {
			if (sidebar.y < defaultY) {
				return (defaultY - sidebar.y);
			} else {
				return defaultY;
			}
		}


		function startDragging (evt:MouseEvent):void {
			evt.currentTarget.startDrag(false,new Rectangle(ganttWindow.mainTimeLine.x,
															 ganttWindow.mainTimeLine.y - ganttWindow.mainTimeLine.height / 2 + 1,
															 ganttWindow.mainTimeLine.width - evt.currentTarget.width,
															 0));
			addEventListener(Event.ENTER_FRAME, slideGanttChart);
		}

		function stopDragging (evt:MouseEvent):void {
			evt.currentTarget.stopDrag();
			removeEventListener(Event.ENTER_FRAME, slideGanttChart);
		}

		function slideGanttChart(evt:Event):void {
			//move the gantt chart relative to the slider
			moveChart();
		}



		function zoomGanttViaButton(evt:MouseEvent) {
			ganttContainer.removeChild(gantt);
			gantt = null;
			
			var strtScl = scl;
			if(evt.currentTarget.name == "zoomInButton") scl = scl / 1.5;
			else scl = scl * 1.5
			if (scl < 500) scl = strtScl;
			else if (scl > 30000) scl = strtScl;
			
			newGantt(true);
			
			zoomWithinBoundary();
		}


		function zoomGanttChart(evt:MouseEvent):void {
			ganttContainer.removeChild(gantt);
			gantt = null;
			
			var strtScl = scl;
			if(evt.delta > 0) scl = scl / 1.5;
			else scl = scl * 1.5
			if (scl < 500) scl = strtScl;
			else if (scl > 30000) scl = strtScl;

			newGantt(true);
			
			zoomWithinBoundary();
		}

		function zoomWithinBoundary():void {
			var maxWidth:Number = (ganttWindow.mainTimeLine.x + ganttWindow.mainTimeLine.width) - ganttWindow.timeLineDragger.x
			var actualWidth:Number = ganttWindow.timeLineDragger.width;
			//if the zoom level will place the slider outside the timeline boundaries, move the chart accordingly
			if (actualWidth > maxWidth){
				var adjustement:Number = actualWidth - maxWidth;
				ganttWindow.timeLineDragger.x -= adjustement;
			}
			moveChart(); //moves chart if necessary and determines arrow visiblity
		}

		function moveChart():void {
			var refPt:Number = ganttWindow.mainTimeLine.x;
			var refWdth:Number = ganttWindow.mainTimeLine.width;
			var ganttWidth:Number = gantt.msTimeLineWidth + 5;
			var prctMvd:Number = (ganttWindow.timeLineDragger.x - refPt) / refWdth;
			var ganttPxls2Move:Number = ganttWidth * prctMvd;
			ganttContainer.x = refPt - ganttPxls2Move;
			
			setArrowVisiblity(refPt, refWdth);
		}

		function setArrowVisiblity(refPt:Number, refWdth:Number):void {
				//set the more arrow as visible or not based on movement
			if (ganttWindow.timeLineDragger.x + ganttWindow.timeLineDragger.width >= refPt + refWdth - 5) ganttWindow.moreArrow.visible = false;
			else ganttWindow.moreArrow.visible = true;
		}

		function takePicture(evt:MouseEvent):void {
			TweenLite.to(ganttWindow.cameraButton.shutter, .5, {x:9, onComplete:reverse});
			function reverse() {
				TweenLite.to(ganttWindow.cameraButton.shutter, .5, {x:21});
			}
			TakePicture.takePic(ganttWindow.CpmLabels, gantt, ganttWindow.chartBckgrnd.height);
		}
		

		//		- save on close			
		function closeApplication(evt:Event):void {      
			evt.preventDefault();
			modelsSideBar.saveModel();
			deleteModels();
			
			var opened:Array = NativeApplication.nativeApplication.openedWindows;
			for (var i:int = 0; i < opened.length; i++) {
				opened[i].close();
			}
		}

		function deleteModels():void {
			var file:File;
			for each (var model in modelsSideBar.modelButtons) {
				if (model.deleteModel) {
					//if model is marked for deletion and current configuration setting, update the config setting with first model that isn't marked for deletion
					if (model.filePath == modelsSideBar.currentFilePath) updateConfigFile();
					file = File.documentsDirectory; 
					file = file.resolvePath(model.filePath);
					file.moveToTrash();
				}
			}
		}
		 
		function updateConfigFile(){
			//make sure that the config file path saved in the models side bar stuff points to a model that isn't being deleted
			for each (var model in modelsSideBar.modelButtons) {
				if (model.deleteModel == false) {
					modelsSideBar.currentFilePath = model.filePath;
					modelsSideBar.lastOpenFile();
					break;
				}
			}
		}


	}
	
}
