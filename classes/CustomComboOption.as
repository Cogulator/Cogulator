package classes {
	
	import flash.display.MovieClip;
	import flash.events.MouseEvent;

	public class CustomComboOption extends MovieClip {
		
		public function CustomComboOption(option:String) {
			stop();
			
			optionField.text = option;
			optionField.mouseEnabled = false;
			
			this.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
			this.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
		}
		
		private function onMouseOver(evt:MouseEvent):void {
			gotoAndStop(2);
		}

		private function onMouseOut(evt:MouseEvent):void {
			gotoAndStop(1);
		}
	}
	
}
