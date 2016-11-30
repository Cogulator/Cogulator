package classes {
	
	import flash.display.MovieClip;
	import flash.events.KeyboardEvent;
	import flash.ui.Keyboard;
	import classes.CustomComboBox;
	import flash.events.MouseEvent;
	import flash.events.FocusEvent;
	import flash.filesystem.File;
	import flash.filesystem.FileMode;
	import flash.filesystem.FileStream;
	import com.greensock.*;
	import com.greensock.easing.*;
	import flash.events.Event;
	
	
	public class NewOperatorCHI extends MovieClip {
		
		private var _operatorArray:Array;
		private var _main:Main;
		private var resourceCombo:CustomComboBox;
		private var operatorsFile:File;
		private var fileStream:FileStream = new FileStream();
		
		
		public function NewOperatorCHI(operatorArray:Array, main:Main) {
			_operatorArray = operatorArray;
			_main = main;
			
			resourceCombo = new CustomComboBox(new Array("cognitive","speech","hear","see","hands"));
			resourceCombo.x = 180;
			resourceCombo.y = 120;
			addChild(resourceCombo);
			
			nameField.tabIndex = 1;
			timeField.tabIndex = 2;
			descriptionField.tabIndex = 3;
			
			timeField.restrict = "0-9";
			
			addEventListener(KeyboardEvent.KEY_UP, onKeyUP);
			addEventListener(MouseEvent.CLICK, onClick);
						
			operatorsFile = File.documentsDirectory.resolvePath("cogulator/operators/operators.txt"); 
			
			initiliaze();
		}
		
		//  -- add the operator to operator list and close window
		private function addOperator() {
			var description = descriptionField.text.split(" ").join("_");
				description = description.replace(/[\r\n]+/gim,'');			
			var operatorLine = resourceCombo.selectedField.text + " " + nameField.text + " " + timeField.text + " " + description;
			
			fileStream.open(operatorsFile, FileMode.APPEND);
			fileStream.writeUTFBytes("\r\n" + operatorLine + "\r\n"); //imperfect solution to the problem of possibly adding a new operator to a file that doesn't not end with a carriage return.  Results in uncessary spaces between operator lines.
			fileStream.close();
			
			initiliaze(); //reset window values after writing
			_main.regenerateOperatorsSidebar(); //regene
			_main.onNewOperatorXClick(); //closes the window using code in main class
		}
		
		
		
		//  -- resets field as needed
		private function initiliaze() { 
			nameExists.visible = false;
			goButton.visible = false;
			
			nameRequired.visible = true;
			timeRequired.visible = true;
			typeRequired.visible = true;
			
			nameField.text = "";
			resourceCombo.selectedField.text = "...";
			timeField.text = "";
			descriptionField.text = "";
			
		}
		

		private function onKeyUP (evt:KeyboardEvent):void {
			if (evt.target.name == "nameField") {
				nameField.text = nameField.text.split(" ").join("_");
				if ( nameAlreadyExists(nameField.text) ) {
					nameExists.visible = true;
				} else {
					nameExists.visible = false;
					if (nameField.length > 0) {
						nameRequired.visible = false;
					} else {
						nameRequired.visible = true;
					}
				}
			} else if (evt.target.name == "timeField") {
				if (timeField.length > 0) {
					timeRequired.visible = false;
				} else {
					timeRequired.visible = true;
				}
			}
			
			setGoButton();
			
			if (evt.keyCode == Keyboard.ENTER && goButton.visible) {
				addOperator();
			} 
		}
		
		private function onClick(evt:MouseEvent):void {
			if (resourceCombo.selectedField.text == "...") {
				typeRequired.visible = true;
			} else {
				typeRequired.visible = false;
			}
			setGoButton();
		}
		
		private function setGoButton() {
			if (!nameExists.visible && !nameRequired.visible && !typeRequired.visible && !timeRequired.visible) {
				if (!goButton.visible) {
					goButton.visible = true;
					goButton.alpha = 0;
					TweenLite.to(goButton, .5, {alpha:1, ease:Quint.easeIn});
				}
			} else {
				goButton.visible = false;
			}
		}
		
		private function nameAlreadyExists(txt:String):Boolean {
			for each (var operator in _operatorArray){
				if ( operator.appelation.toLowerCase() == txt.toLowerCase() ) return true;
			}
			return false;
		}
		
		
	}
	
}
