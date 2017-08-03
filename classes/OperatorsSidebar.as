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
	import flash.events.MouseEvent;
	import flash.events.KeyboardEvent;
	import flash.ui.Keyboard;
	import flash.filesystem.File;
	import flash.filesystem.FileMode;
	import flash.filesystem.FileStream;
	import flash.text.TextField;
    import flash.text.TextFormat;
	import classes.AddOperatorText
	import classes.OperaterUpdater;
	import classes.UndoRedo;
	import com.inruntime.utils.*;
	
	public class OperatorsSidebar extends MovieClip{
		private var $:Global = Global.getInstance();

		private var currentAddOperatorTime:String;
		public var goalControl:Array = new Array ("Goal", "Also", "If", "EndIf", "GoTo", "CreateState", "SetState");
		private var labelX:int = 15;
		private var operatorX:int = 25;
		private var lineY:int = 10;
		private var _undoRedo:UndoRedo;
		public var insert:AddOperatorText;	
		private var _main:Main;

		//public function OperatorsSidebar(ln:TextField, uR:UndoRedo) {
		public function OperatorsSidebar(uR:UndoRedo, main:Main) {
			_undoRedo = uR
			_main = main;
			
			var update = new OperaterUpdater(); //checks to see if there new or modified operators. If so, updates the operator.txt file and backs up the old one
			insert = new AddOperatorText();
			
			var i:int = 0;
			
			//    - add the goals  - 
			var goalsLabel:HeadingLabel = new HeadingLabel();
				goalsLabel.labeltxt.text = "Goals";
				goalsLabel.x = labelX;
				goalsLabel.y = lineY;
				addChild(goalsLabel);
			
			for (i = 0; i < goalControl.length; i++) {
				//For now, only adding Goal & Also. Operator Sidebar is really for novices, so keeping the more advanced features out of it for now
				if (goalControl[i] == "Goal" || goalControl[i] == "Also") generateOperatorButton(goalControl[i], 0, "");
			}
			
			lineY += 10;
			
			//    - add the cognitive operators  - 
			var cogLabel:HeadingLabel = new HeadingLabel();
				cogLabel.labeltxt.text = "Cognitive";
				cogLabel.x = labelX;
				lineY += 20;
				cogLabel.y = lineY;
				addChild(cogLabel);
			
			
			for (i = 0; i < $.operatorArray.length; i++) {
				if ($.operatorArray[i].resource == "cognitive") generateOperatorButton($.operatorArray[i].appelation, $.operatorArray[i].time, $.operatorArray[i].description);
			}
			
			lineY += 10;
			
			
			//    - add the perceptual operators  - 
			var perceptLabel:HeadingLabel = new HeadingLabel();
				perceptLabel.labeltxt.text = "See";
				perceptLabel.x = labelX;
				lineY += 20;
				perceptLabel.y = lineY;
				addChild(perceptLabel);
			
			for (i = 0; i < $.operatorArray.length; i++) {
				if ($.operatorArray[i].resource == "see") generateOperatorButton($.operatorArray[i].appelation, $.operatorArray[i].time, $.operatorArray[i].description);
			}
			
			lineY += 10;
			
			//    - add the communication operators  - 
			var comLabel:HeadingLabel = new HeadingLabel();
				comLabel.labeltxt.text = "Hear & Speech";
				comLabel.x = labelX;
				lineY += 20;
				comLabel.y = lineY;
				addChild(comLabel);
			
			for (i = 0; i < $.operatorArray.length; i++) {
				if ($.operatorArray[i].resource == "speech" || $.operatorArray[i].resource == "hear") generateOperatorButton($.operatorArray[i].appelation, $.operatorArray[i].time, $.operatorArray[i].description);
			}
			
			lineY += 10;
			
			//    - add the motor operators  - 
			var motorLabel:HeadingLabel = new HeadingLabel();
				motorLabel.labeltxt.text = "Hands";
				motorLabel.x = labelX;
				lineY += 20;
				motorLabel.y = lineY;
				addChild(motorLabel);

			
			for (i = 0; i < $.operatorArray.length; i++) {
				if ($.operatorArray[i].resource == "hands") generateOperatorButton($.operatorArray[i].appelation, $.operatorArray[i].time, $.operatorArray[i].description);
			}
			
			lineY += 10;
			
			//    - add the wait operator  - 
			var systemLabel:HeadingLabel = new HeadingLabel();
				systemLabel.labeltxt.text = "System";
				systemLabel.x = labelX;
				lineY += 20;
				systemLabel.y = lineY;
				addChild(systemLabel);

			
			for (i = 0; i < $.operatorArray.length; i++) {
				if ($.operatorArray[i].resource == "system") generateOperatorButton($.operatorArray[i].appelation, $.operatorArray[i].time, $.operatorArray[i].description);
			}
			
		}
		
		private function generateOperatorButton (appelation:String, time:Number, description:String):void {
			lineY += 20;
			var opButton:OperatorButton = new OperatorButton();
			opButton.appelation = appelation;
			opButton.time = time;
			opButton.operatorLbl.text = appelation;
			opButton.x = operatorX;
			opButton.y = lineY;
			
			if (description != null)  description = description.replace(/_/g, " ");
			else description = "";
			
			opButton.operatorInfo.operatorName.text = appelation;
			opButton.operatorInfo.operatorTime.text = time;
			if (description != null) opButton.operatorInfo.operatorDescription.text = description;
			
			opButton.addEventListener(MouseEvent.CLICK, onOperatorClick);
			opButton.addEventListener(MouseEvent.MOUSE_OVER, onOperatorHover);			
			opButton.operatorInfoButton.addEventListener(MouseEvent.MOUSE_OVER, onOverOpInfoButton);
			opButton.operatorInfoButton.addEventListener(MouseEvent.MOUSE_OUT, onOutOpInfoButton);
			addChild(opButton);
		}
		
		private function onOperatorHover(evt:MouseEvent):void {
			insert.addOperatorPreview(evt.currentTarget, operatorText(evt.currentTarget));
		}
		
		private function onOverOpInfoButton(evt:MouseEvent):void {
			evt.currentTarget.parent.removeEventListener(MouseEvent.CLICK, onOperatorClick);
		}
		
		private function onOutOpInfoButton(evt:MouseEvent):void {
			evt.currentTarget.parent.addEventListener(MouseEvent.CLICK, onOperatorClick);
		}
		
		private function operatorText(operatorButton:Object):String {			
			if (operatorButton.appelation == "Goal"){
				return(operatorButton.appelation + ": goal_name");
			} else if (operatorButton.appelation == "Also"){
				return(operatorButton.appelation + ": also_name as new_thread");
			} else if (operatorButton.appelation == "GoTo"){
				return (operatorButton.appelation + ": goal_name");
			} else if (operatorButton.appelation == "If"){
				return (operatorButton.appelation + " state_name value");
			} else if (operatorButton.appelation == "EndIf"){
				return (operatorButton.appelation);
			} else if (operatorButton.appelation == "CreateState"){
				return (operatorButton.appelation + " state_name value");
			} else if (operatorButton.appelation == "SetState"){
				return (operatorButton.appelation + " state_name value");
			} else if (operatorButton.appelation == "Say" || operatorButton.appelation == "Hear") {
				return(operatorButton.appelation + " *be sure to include the words that are said or heard");
			} else if (operatorButton.appelation == "Type") {
				return(operatorButton.appelation + " *be sure to include the typed text");
			} else {
				return(operatorButton.appelation + " ");
			}
		}
		
		private function onOperatorClick(evt:MouseEvent):void {						
			insert.addOperatorPermament(evt.currentTarget);
			_undoRedo.listenForNewText(); //add to undo redo stack
			_main.refreshModel();
		}
		

	}
	
}
