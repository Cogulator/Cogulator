package classes.actiontoGOMS {
	
	import flash.display.MovieClip;
	import flash.display.SimpleButton;
	import flash.events.*;
	import flash.ui.Keyboard;
	import flash.utils.Timer;
	import com.inruntime.utils.*;
	import classes.actiontoGOMS.InteractiveIphone;
	import classes.actiontoGOMS.InteractiveDesktop;
	import classes.actiontoGOMS.Interactions;
	import classes.actiontoGOMS.HandLocation;
	import classes.actiontoGOMS.Device;
	import classes.SyntaxColor;
	import classes.SolarizedPalette;
	import classes.FittsLaw;
	import flash.geom.Point;
	import flash.display.Shape;
	import flash.text.TextField;
	import com.greensock.TweenMax;
	

	
	public class MagicModels extends MovieClip {
		
		private var $:Global = Global.getInstance();
		private var handLocation = HandLocation.MOUSE;
		private var desktopResolution:Point = new Point(1366, 768);
		private var desktopLocalResolution:Point = new Point(360, 224);
		private var phoneResolution:Point = new Point(1366, 768);
		private var phoneLocalResolution:Point = new Point(360, 224);
		private var fitts = new FittsLaw();
		private var displayMarkings:Array = new Array();
		private var actionCount:int = 0;
		private var speechRecMode = "none";
		private var speechRecTween:TweenMax;
		
		public var mac:InteractiveDesktop = new InteractiveDesktop();
		public var phone:InteractiveIphone = new InteractiveIphone();
		public var checkButton:SimpleButton;
		public var modelTF:TextField;
		public var selectedDevice:Object;
	
		
		public function MagicModels() {
			container.typeSelector.addEventListener("desktop translator selected", desktopSelected);
			container.typeSelector.addEventListener("iphone translator selected", iPhoneSelected);
			
			addEventListeners();
			desktopSelected();
		}
		
		private function reset() {
			actionCount = 0;
			lastAction = "";
			mouseMoving = false;
			pointXY = null
			gridStartPoint = null;
			gridEndPoint = null;
		}
		
		private function desktopSelected(evt:Event = null) {			
			if (phone.stage) removeChild(phone);
			reset();
			
			mac.x = $.stage.stageWidth / 2 - 393;
			mac.y = $.stage.stageHeight / 2 - 215;
			
			mac.checkButton.visible = false;
			mac.undoButton.visible = false;
			addChild(mac);
			
			checkButton = mac.checkButton;
			modelTF = mac.logWindow.logTxt;
			selectedDevice = mac;
		}
		
		private function iPhoneSelected(evt:Event) {
			if (mac.stage) removeChild(mac);
			reset();
			
			phone.x = $.stage.stageWidth / 2 - 292;
			phone.y = $.stage.stageHeight / 2 - 140;
			
			phone.checkButton.visible = false;
			phone.undoButton.visible = false;
			phone.speechRecGuide.visible = false;
			addChild(phone);
			
			phone.homeButton.addEventListener(MouseEvent.MOUSE_DOWN, onHomeDown);
			phone.speechRecGuide.field.text = "";
			checkButton = phone.checkButton;
			modelTF = phone.logWindow.logTxt;
			selectedDevice = phone;
		}
		
		private function addEventListeners():void {
			this.addEventListener(Event.ADDED_TO_STAGE, addedToStageHandler);
			
			mac.grid.addEventListener(MouseEvent.MOUSE_MOVE, pointHandler);
			mac.grid.addEventListener(MouseEvent.MOUSE_OUT, mouseOutHandler);
			mac.grid.addEventListener(MouseEvent.CLICK, clickHandler);
			
			mac.addEventListener(MouseEvent.MOUSE_MOVE, dsktopMouseMoveHandler);
			mac.addEventListener(MouseEvent.MOUSE_OUT, dsktopMouseOutHandler);
			mac.dragBar.addEventListener(MouseEvent.MOUSE_DOWN, dsktopStartDragging);
			mac.addEventListener(MouseEvent.MOUSE_UP, dsktopStopDragging);
			mac.undoButton.addEventListener(MouseEvent.CLICK, handleUndo);
						
			phone.grid.addEventListener(MouseEvent.MOUSE_DOWN, touchDownHandler);
			phone.grid.addEventListener(MouseEvent.MOUSE_UP, touchUpHandler);
			phone.undoButton.addEventListener(MouseEvent.CLICK, handleUndo);
		}
		
		private function addedToStageHandler(evt:Event):void {
			//listen for keyboard events
			this.stage.addEventListener(KeyboardEvent.KEY_DOWN, keyDownHandler);
			
			//size to take up the entire stage
			background.width = stage.stageWidth;
			background.height = stage.stageHeight;
			
			container.x = stage.stageWidth / 2 - container.width / 2;
			container.y = stage.stageHeight / 2 - container.height / 2;
			
			mac.x = stage.stageWidth / 2 - 393;
			mac.y = stage.stageHeight / 2 - 215;
			
			phone.x = stage.stageWidth / 2 - 292;
			phone.y = stage.stageHeight / 2 - 140;
		}
		
		
// ----------   INTEPRET DESKTOP ACTIONS		
		private var lastAction:String;
		private var mouseMoving:Boolean = false;
		private var pointXY:Point;
		private var mouseTimer:Timer = new Timer(2000);
		
		private function desktopActionToCode(action:String, data:String, startPoint:Point = null, endPoint:Point = null, drawPoint:Point = null):void {
			mac.checkButton.visible = true;
			mac.undoButton.visible = true;
			
			var logActions = "";
			
			if (handLocation == HandLocation.MOUSE && (action == Interactions.TYPE || action == Interactions.KEYSTROKE)) {
				if (mac.logWindow.logTxt.length > 0) logActions += "\n ";
				logActions += "\nHands to keyboard";
				handLocation = HandLocation.KEYBOARD;
			} else if (handLocation == HandLocation.KEYBOARD && action != Interactions.TYPE && action != Interactions.KEYSTROKE) {
				if (mac.logWindow.logTxt.length > 0) logActions += "\n ";
				logActions += "\nHands to mouse";
				handLocation = HandLocation.MOUSE;
			}
			
			
			var travelTime = 0.0;
			if (action == Interactions.POINT) {
				if (mac.logWindow.logTxt.length > 0) logActions += "\n ";
				logActions += "\nLook at <" + actionCount.toString() + ">";
				travelTime = fitts.pointAndClick(resolvedDistance(startPoint, endPoint, Device.DESKTOP));
				logActions += "\nPoint to <" + actionCount.toString() + "> (" + travelTime.toString() + " milliseconds) *Fitts Law Point Estimate";
				logActions += "\nCognitive_processor verify cursor over <" + actionCount.toString() + ">";
				logActions += "\nIgnore <" + actionCount.toString() + ">";
				markDesktopAction(action, startPoint, endPoint, mac.logWindow.logTxt.text);
			} else if (action == Interactions.CLICK) {
				if (mac.logWindow.logTxt.length > 0) logActions += "\n ";
				logActions += "\nCognitive_processor verify cursor over <" + actionCount.toString() + ">";
				logActions += "\nClick on <" + actionCount.toString() + ">";
				logActions += "\nIgnore <" + actionCount.toString() + ">";
				markDesktopAction(action, startPoint, endPoint, mac.logWindow.logTxt.text);
			} else if (action == Interactions.POINTANDCLICK) {
				if (mac.logWindow.logTxt.length > 0) logActions += "\n ";
				logActions += "\nLook at <" + actionCount.toString() + ">";
				travelTime = fitts.pointAndClick(resolvedDistance(startPoint, endPoint, Device.DESKTOP));
				logActions += "\nPoint to <" + actionCount.toString() + "> (" + travelTime.toString() + " milliseconds) *Fitts Law Point Estimate";
				logActions += "\nCognitive_processor verify cursor over <" + actionCount.toString() + ">";				
				logActions += "\nClick on <" +  actionCount.toString() + ">";
				logActions += "\nIgnore <" + actionCount.toString() + ">";
				markDesktopAction(action, startPoint, endPoint, mac.logWindow.logTxt.text);
			} else if (action == Interactions.DRAGFROM) {
				if (mac.logWindow.logTxt.length > 0) logActions += "\n ";
				logActions += "\nLook at <" + actionCount.toString() + ">";
				travelTime = fitts.pointAndClick(resolvedDistance(startPoint, endPoint, Device.DESKTOP));
				logActions += "\nPoint to <" + actionCount.toString() + "> (" + travelTime.toString() + " milliseconds) *Fitts Law Point Estimate";
				logActions += "\nCognitive_processor verify cursor over <" + actionCount.toString() + ">";
				logActions += "\nClick on <" + actionCount.toString()  + ">";
				logActions += "\nIgnore <" + actionCount.toString() + ">";
				markDesktopAction(action, startPoint, endPoint, mac.logWindow.logTxt.text, drawPoint);
			} else if (action == Interactions.DRAGTO) {
				if (mac.logWindow.logTxt.length > 0) logActions += "\n ";
				logActions += "\nLook at <" + actionCount.toString() + ">";
				travelTime = fitts.dragAndDrop(resolvedDistance(startPoint, endPoint, Device.DESKTOP));
				logActions += "\nPoint to <" + actionCount.toString() + "> (" + travelTime.toString() + " milliseconds) *Fitts Law Drag Estimate";
				logActions += "\nCognitive_processor verify cursor over <" + actionCount.toString() + ">";;				
				logActions += "\nClick on <" + actionCount.toString() + ">";
				logActions += "\nIgnore <" + actionCount.toString() + ">";
				markDesktopAction(action, startPoint, endPoint, mac.logWindow.logTxt.text, drawPoint);
			} else if (action == Interactions.TYPE) {
				if (lastAction != Interactions.TYPE) logActions += "\n " + "\nType ";
				logActions += data;
			} else if (action == Interactions.KEYSTROKE) {
				logActions += "\nCognitive_processor verify correct";
				logActions += "\nKeystroke ";
				logActions += data;
			} else if (action == Interactions.HOVER) {
				logActions += "\nPoint";
			}
						
			mac.logWindow.logTxt.appendText(logActions);
			mac.logWindow.logTxt.scrollV = mac.logWindow.logTxt.maxScrollV; //scroll to bottom
			SyntaxColor.solarizeAll(mac.logWindow.logTxt);
			
			lastAction = action
		}
		
		
		// - MARK DEVICE ACTION
		private function markDesktopAction(action:String, startPoint:Point, endPoint:Point, logTxt:String, drawPoint:Point = null) {
			var shapes:Array;
			var line:Shape;
			var click:ClickMark;
			var dragBarMark:DragBarMark;
			
			if (action == Interactions.CLICK) {
				click = new ClickMark();
				click.mouseEnabled = false;
				click.label.mouseEnabled = false;
				click.x = endPoint.x;
				click.y = endPoint.y;
				click.label.text = actionCount.toString();
				mac.grid.addChild(click);
				
				shapes = new Array(click);
				displayMarkings.push({"shapes": shapes, "txt": logTxt});
				
			} else if (action == Interactions.POINT) {
				line = new Shape();
				line.graphics.lineStyle(1,SolarizedPalette.blue);
				line.graphics.moveTo(startPoint.x, startPoint.y); 
				line.graphics.lineTo(endPoint.x, endPoint.y);
				mac.grid.addChild(line);
				
				shapes = new Array(line);
				displayMarkings.push({"shapes": shapes, "txt": logTxt});
				
			} else if (action == Interactions.POINTANDCLICK) {
				line = new Shape();
				line.graphics.lineStyle(1,SolarizedPalette.blue);
				line.graphics.moveTo(startPoint.x, startPoint.y); 
				line.graphics.lineTo(endPoint.x, endPoint.y);
				mac.grid.addChild(line);
				
				click = new ClickMark();
				click.mouseEnabled = false;
				click.label.mouseEnabled = false;
				click.x = endPoint.x;
				click.y = endPoint.y;
				click.label.text = actionCount.toString();
				mac.grid.addChild(click);
				
				shapes = new Array(line, click);
				displayMarkings.push({"shapes": shapes, "txt": logTxt});
				
			} else if (action == Interactions.DRAGFROM) {
				dragBarMark = new DragBarMark();
				dragBarMark.mouseEnabled = false;
				dragBarMark.x = endPoint.x; 
				dragBarMark.y = endPoint.y;
				mac.grid.addChild(dragBarMark);
								
				shapes = new Array(dragBarMark);
				displayMarkings.push({"shapes": shapes, "txt": logTxt});
			
			} else if (action == Interactions.DRAGTO) {
				dragBarMark = new DragBarMark();
				dragBarMark.mouseEnabled = false;
				dragBarMark.x = drawPoint.x; 
				dragBarMark.y = drawPoint.y;
				mac.grid.addChild(dragBarMark);
				
				shapes = new Array(dragBarMark);
				displayMarkings.push({"shapes": shapes, "txt": logTxt});
			}
			
			actionCount++;
		}
		
		private function pointHandler(evt:MouseEvent):void {
			if (!mouseMoving) {
				mouseMoving = true;
				pointXY = new Point(evt.localX, evt.localY);
				mouseTimer.addEventListener(TimerEvent.TIMER, hoverHandler);
			}
			
			mouseTimer.reset();
			mouseTimer.start();
		}
		
		private function clickHandler(evt:MouseEvent):void {
			mouseMoving = false;
			mouseTimer.reset();
			mouseTimer.removeEventListener(TimerEvent.TIMER, hoverHandler);
					
			var endPointXY = new Point(evt.localX, evt.localY);
			if (pointXY != null && (pointXY.x != endPointXY.x || pointXY.y != endPointXY.y)) {
				desktopActionToCode(Interactions.POINTANDCLICK, "", pointXY, endPointXY);
			} else {
				desktopActionToCode(Interactions.CLICK, "", pointXY, endPointXY);
			}
			
			pointXY = new Point(evt.localX, evt.localY);
		}
		
		private function hoverHandler(evt:TimerEvent):void {
			mouseTimer.removeEventListener(TimerEvent.TIMER, hoverHandler);
			mouseMoving = false;
		}
		
		private function mouseOutHandler(evt:MouseEvent):void {
			mouseMoving = false;
			mouseTimer.reset();
			mouseTimer.removeEventListener(TimerEvent.TIMER, hoverHandler);
		}
		
		private function keyDownHandler(evt:KeyboardEvent):void {
			if (selectedDevice == mac) {
				mouseMoving = false;
				mouseTimer.reset();
				mouseTimer.removeEventListener(TimerEvent.TIMER, hoverHandler);
				
				if (evt.keyCode == Keyboard.ENTER) {
					desktopActionToCode(Interactions.KEYSTROKE, "ENTER");
				} else {
					var character:String = String.fromCharCode(evt.charCode);
					desktopActionToCode(Interactions.TYPE, character);
				}
			} else {
				if (speechRecMode != "none") {
					if (evt.keyCode == Keyboard.ESCAPE) {
						cycleSpeechRecMode(true); //turn off speech rec mode
					} else if (evt.keyCode == Keyboard.ENTER) {
						cycleSpeechRecMode();
					} else {
						var chrtr:String = String.fromCharCode(evt.charCode);
						if (speechRecMode == "say") iphoneActionToCode(Interactions.SPEECHRECSAY, chrtr);
						else if (speechRecMode == "hear") iphoneActionToCode(Interactions.SPEECHRECHEAR, chrtr);
					}
				} else {
					var char:String = String.fromCharCode(evt.charCode);
					iphoneActionToCode(Interactions.TAP, char);
				}
			}
		}
		
		var lockX:Number = mac.dragBar.x;
		var lockMinY:Number = mac.dragBar.y;
		var lockMaxY:Number = 225 - mac.dragBar.height - 1;
		private function dsktopMouseMoveHandler(evt:MouseEvent):void {
			//keep drag on x axis
			if (mac.dragBar.x != lockX) mac.dragBar.x = lockX;
			if (mac.dragBar.y < lockMinY) mac.dragBar.y = lockMinY;
			if (mac.dragBar.y > lockMaxY) mac.dragBar.y = lockMaxY;
			
			if (mac.dragBar.y != lockMinY) mac.grid.y = -mac.dragBar.y * 5;
		}
		
		private function dsktopMouseOutHandler(evt:MouseEvent):void {
			dsktopStopDragging(evt);
		}
		
		var dragY:Number = mac.dragBar.y;
		var dragging:Boolean = false;
		private function dsktopStartDragging(evt:MouseEvent):void {
			dragging = true;
			
			var startPointXY = new Point(mac.dragBar.x, dragY);
			dragY = mac.dragBar.y;
			var endPointXY = new Point(mac.dragBar.x, dragBarYToGridY(dragY));
			
			if (pointXY != null && pointXY.y != endPointXY.y) {
				desktopActionToCode(Interactions.POINT, "", pointXY, endPointXY);
			}
			
			desktopActionToCode(Interactions.DRAGFROM, "", startPointXY, endPointXY);
			
			mac.dragBar.startDrag();
			pointXY = endPointXY;
		}
		
		private function dsktopStopDragging(evt:MouseEvent):void {
			if (dragging && dragY != mac.dragBar.y) {
				
				var startPnt:Point = new Point(mac.dragBar.x, dragY);
				var endPnt:Point = new Point(mac.dragBar.x, mac.dragBar.y);
				var drawXY = new Point( mac.dragBar.x, dragBarYToGridY(mac.dragBar.y) );
				desktopActionToCode(Interactions.DRAGTO, "", startPnt, endPnt, drawXY);
				
				pointXY = new Point(evt.localX, evt.localY);
			}
			dragging = false;
			mac.dragBar.stopDrag();
		}
		
		
// --------------------- INTEPRET IPHONE ACTIONS ---------------------------
		var gridStartPoint:Point;
		var gridEndPoint:Point;
		private function touchDownHandler(evt:MouseEvent):void {
			gridStartPoint = new Point(phone.grid.x, phone.grid.y);
			phone.addEventListener(MouseEvent.MOUSE_MOVE, touchMoveHandler);
			evt.target.startDrag();
		}
		
		private function touchUpHandler(evt:MouseEvent):void {
			gridEndPoint = new Point(phone.grid.x, phone.grid.y);
			var drawPoint = new Point(evt.localX, evt.localY);
			if (wasSwipe()) iphoneActionToCode(Interactions.SWIPE, "", gridStartPoint, gridEndPoint, drawPoint);
			else iphoneActionToCode(Interactions.TOUCH, "", gridStartPoint, gridEndPoint, drawPoint);
			
			evt.target.stopDrag();
			phone.removeEventListener(MouseEvent.MOUSE_MOVE, touchMoveHandler);
		}
		
		private function touchMoveHandler(evt:MouseEvent):void {
			phone.grid.x = 0; 
			if (phone.grid.y <= -phone.grid.height + 225) phone.grid.y = -phone.grid.height + 225;
			else if (phone.grid.y >= 0) phone.grid.y = 0;
		}
		
		private function wasSwipe():Boolean {
			var d = distance(gridStartPoint, gridEndPoint);
			if (d > 10) return true;
			return false;
		}
		
		var homeTimer:Timer = new Timer(1000);
		private function onHomeDown(evt:MouseEvent):void {
			homeTimer.reset();
			homeTimer.addEventListener(TimerEvent.TIMER, homeTimerHandler);
			homeTimer.start();
			phone.homeButton.addEventListener(MouseEvent.MOUSE_UP, onHomeUp);
		}
		
		private function onHomeUp(evt:MouseEvent):void {
			homeTimer.reset();
			phone.homeButton.removeEventListener(MouseEvent.MOUSE_UP, onHomeUp);
			iphoneActionToCode(Interactions.HOME, "", null, null);
		}
		
		private function homeTimerHandler(evt:TimerEvent):void {
			phone.homeButton.removeEventListener(MouseEvent.MOUSE_UP, onHomeUp);
			homeTimer.removeEventListener(TimerEvent.TIMER, homeTimerHandler);
			homeTimer.reset();
			cycleSpeechRecMode();
		}
		
		private function cycleSpeechRecMode(end:Boolean = false):void {
			if (end || phone.speechRecGuide.field.text == "Type system aural response, if any. Press ENTER when done. ESC to exit.") {
				if (speechRecTween != null) speechRecTween.kill();
				speechRecMode = "none";
				phone.speechRecGuide.field.text = "";
				phone.speechRecGuide.visible = false;
				lastAction = "";
			} else if (phone.speechRecGuide.field.text == "") {
				speechRecMode = "say";
				phone.speechRecGuide.field.text = "Type speech rec command. Press ENTER when done. ESC to exit."
				if (speechRecTween != null) speechRecTween.kill();
				speechRecTween = new TweenMax(phone.speechRecGuide.field, 1, {alpha:0.5, repeat:1, yoyo:true});
				phone.speechRecGuide.visible = true;
			} else if (phone.speechRecGuide.field.text == "Type speech rec command. Press ENTER when done. ESC to exit.") {
				speechRecMode = "hear";
				phone.speechRecGuide.field.text = "Type system aural response, if any. Press ENTER when done. ESC to exit."
				if (speechRecTween != null) speechRecTween.kill();
				speechRecTween = new TweenMax(phone.speechRecGuide.field, 1, {alpha:0.5, repeat:1, yoyo:true})
				phone.speechRecGuide.visible = true;
			} 
		}
		
		private function iphoneActionToCode(action:String, data:String, startPoint:Point = null, endPoint:Point = null, drawPoint:Point = null):void {
			phone.checkButton.visible = true;
			phone.undoButton.visible = true;
			
			var logActions = "";
						
			var travelTime = 0.0;
			if (action == Interactions.TOUCH) {
				if (phone.logWindow.logTxt.length > 0) logActions += "\n ";
				logActions += "\nLook at <" + actionCount.toString() + ">";
				logActions += "\nCognitive_processor verify <" + actionCount.toString() + ">";				
				logActions += "\nTouch <" + actionCount.toString() + ">";
				logActions += "\nIgnore <" + actionCount.toString() + ">";
				markPhoneAction(action, startPoint, endPoint, phone.logWindow.logTxt.text, drawPoint);
			} else if (action == Interactions.SWIPE) {
				if (phone.logWindow.logTxt.length > 0) logActions += "\n ";
				logActions += "\nLook at <" + actionCount.toString() + ">";
				logActions += "\nCognitive_processor <" + actionCount.toString() + ">";	
				logActions += "\nTouch <" + actionCount.toString() + ">";
				logActions += "\nSwipe on <" + actionCount.toString() + ">";
				logActions += "\nIgnore <" + actionCount.toString() + ">";
				markPhoneAction(action, startPoint, endPoint, phone.logWindow.logTxt.text, drawPoint);
			} else if (action == Interactions.TAP) {
				if (lastAction != Interactions.TAP) logActions += "\n " + "\nTap ";
				logActions += data;
			} else if (action == Interactions.HOME) {
				if (phone.logWindow.logTxt.length > 0) logActions += "\n ";
				logActions += "\nLook at <Home " + actionCount.toString() + ">";
				logActions += "\nCognitive_processor <Home " + actionCount.toString() + ">";	
				logActions += "\nTouch <Home " + actionCount.toString() + ">";
				logActions += "\nClick <Home " + actionCount.toString() + ">";
				logActions += "\nIgnore <Home " + actionCount.toString() + ">";
				markPhoneAction(action, startPoint, endPoint, phone.logWindow.logTxt.text, drawPoint);
			} else if (action == Interactions.SPEECHRECSAY) {
				if (lastAction != Interactions.SPEECHRECSAY) {
					if (phone.logWindow.logTxt.length > 0) logActions += "\n ";
					logActions += "\nLook at <Home " + actionCount.toString() + ">";
					logActions += "\nCognitive_processor verify <Home " + actionCount.toString() + ">";	
					logActions += "\nTouch <Home " + actionCount.toString() + ">";
					logActions += "\nClick and hold <Home " + actionCount.toString() + ">";
					logActions += "\nIgnore <Home " + actionCount.toString() + ">";
					logActions += "\nWait for speech rec to start (1 seconds)";
					logActions += "\nHear <start sound> (2 syllables)";
					logActions += "\nIgnore <start sound>";
					logActions += "\nSay ";
					markPhoneAction(action, startPoint, endPoint, phone.logWindow.logTxt.text, drawPoint);
				}
				logActions += data;
			} else if (action == Interactions.SPEECHRECHEAR) {
				if (lastAction != Interactions.SPEECHRECHEAR) {
					logActions += "\nWait for system response (250 ms)";
					logActions += "\nHear ";
				}
				logActions += data;
			} 
						
			phone.logWindow.logTxt.appendText(logActions);
			phone.logWindow.logTxt.scrollV = phone.logWindow.logTxt.maxScrollV; //scroll to bottom
			SyntaxColor.solarizeAll(phone.logWindow.logTxt);
			
			lastAction = action
		}
		
		
		// - MARK DEVICE ACTION
		private function markPhoneAction(action:String, startPoint:Point, endPoint:Point, logTxt:String, drawPoint:Point = null) {
			var shapes:Array;
			var line:Shape;
			var click:ClickMark;
			var swipe:SwipeMark;
			var home:HomeMark;
			
			if (action == Interactions.TOUCH) {
				click = new ClickMark();
				click.mouseEnabled = false;
				click.label.mouseEnabled = false;
				click.x = drawPoint.x;
				click.y = drawPoint.y;
				click.label.text = actionCount.toString();
				phone.grid.addChild(click);
				
				shapes = new Array(click);
				displayMarkings.push({"shapes": shapes, "txt": logTxt});
				
			} else if (action == Interactions.SWIPE) {
				swipe = new SwipeMark();
				swipe.mouseEnabled = false;
				swipe.label.mouseEnabled = false;
				swipe.x = drawPoint.x;
				swipe.y = drawPoint.y;
				swipe.label.text = actionCount.toString();
				phone.grid.addChild(swipe);
				
				shapes = new Array(swipe);
				displayMarkings.push({"shapes": shapes, "txt": logTxt});
				
			}  else if (action == Interactions.HOME || action == Interactions.SPEECHRECSAY) {
				home = new HomeMark();
				home.mouseEnabled = false;
				home.label.mouseEnabled = false;
				home.x = phone.homeButton.x;
				home.y = phone.homeButton.y;
				home.label.text = actionCount.toString();
				phone.addChild(home);
				
				shapes = new Array(home);
				displayMarkings.push({"shapes": shapes, "txt": logTxt});
			}
			
			actionCount++;
		}
		
		
		
		
		
// - GENERAL USE
		private function handleUndo(evt:MouseEvent):void {
			if (displayMarkings.length > 0) {
				var markingsAndText = displayMarkings.pop();
				var shapes:Array = markingsAndText.shapes;
				var text:String = markingsAndText.txt;
				
				for each (var item in shapes) {
					if (item is HomeMark) phone.removeChild(item);	
					else selectedDevice.grid.removeChild(item);		
				}				
				selectedDevice.logWindow.logTxt.text = text;
				SyntaxColor.solarizeAll(selectedDevice.logWindow.logTxt);
			} 
			
			if (displayMarkings.length == 0) {
				selectedDevice.undoButton.visible = false;
				selectedDevice.checkButton.visible = false;
			}
			
			cycleSpeechRecMode(true);
		}
		
		private function handleRedo(evt:MouseEvent):void {
			
		}
		
		private function resolvedDistance(startPoint:Point, endPoint:Point, device:String):Number {
			var mappedStartPnt = resolutionConversion(startPoint, device);
			var mappedEndPnt = resolutionConversion(endPoint, device);
			return distance(mappedStartPnt, mappedEndPnt);
		}
		
		private function distance(point1:Point, point2:Point):Number {
			var dx:Number = point1.x - point2.x;
			var dy:Number = point1.y - point2.y;
			return Math.sqrt(dx * dx + dy * dy);
		}
		
		private function resolutionConversion(point:Point, device:String):Point {
			var toResolution = desktopResolution;
			var fromResolution = desktopLocalResolution;
			if (device == Device.IPHONE) {
				toResolution = phoneResolution;
				fromResolution = phoneLocalResolution;
			}
			
			var ex = rescale(fromResolution.x, toResolution.x, point.x);
			var why = rescale(fromResolution.y, toResolution.y, point.y);
			
			return new Point(ex, why);
		}
		
		private function rescale(fromScaleMax, toScaleMax, value):Number {
			return ((value / fromScaleMax) * toScaleMax);
		}
		
		private function dragBarYToGridY(dragBarY:Number):Number {
			return dragBarY * 6;
		}
		
	}
	
	
}
