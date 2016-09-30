package classes {
	
	import flash.display.MovieClip;
	import classes.CustomComboOption;
	import flash.events.MouseEvent;
	
	public class CustomComboBox extends MovieClip {
		
		var _options:Array;
		var comboOptions:Array = new Array();
		
		public function CustomComboBox(options:Array) {
			stop();
			_options = options;
			
			selectedField.mouseEnabled = false;
			selectionBackground.addEventListener(MouseEvent.CLICK, onClick);
		}
		
		private function onClick(evt:MouseEvent):void {
			if (currentFrame == 1) {
				addOptions();
			} else {
				removeOptions();
			}
		}
		
		private function addOptions() {
			gotoAndStop(2);
			
			var currentY:Number = optionsContainer.y + 1;
			for each (var option in _options) {
				var comboOption = new CustomComboOption(option);
					comboOption.x = 1;
					comboOption.y = currentY;
					comboOption.addEventListener(MouseEvent.CLICK, onOptionSelect);
				comboOptions.push(comboOption);
				addChild(comboOption);
				
				currentY += comboOption.height;
			}
			
			optionsContainer.height = currentY - optionsContainer.y + comboOptions.length;
		}
		
		private function removeOptions() {
			for each (var co in comboOptions) {
				removeChild(co);
			}
			
			comboOptions.length = 0;
			gotoAndStop(1);
		}
		
		private function onOptionSelect(evt:MouseEvent):void {
			selectedField.text = evt.currentTarget.optionField.text;
			removeOptions();
		}
		
	}
	
}
