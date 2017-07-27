package classes {
	
	import flash.display.MovieClip;
	import flash.events.MouseEvent;
	import flash.filesystem.File;
	import flash.events.Event;
	
	
	public class MenuToggle extends MovieClip {
		
		public var cogulatorcollectionsEnabled = false;
		public var showCogulatorCollectionsNow = false;
		
		public function MenuToggle() {		
			operators.gotoAndStop(2);
			operators.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
			operators.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
			operators.addEventListener(MouseEvent.CLICK, onMouseClick);
			
			methods.gotoAndStop(2);
			methods.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
			methods.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
			methods.addEventListener(MouseEvent.CLICK, onMouseClick);
			
			models.labelDark.text = "Models";
			operators.labelLight.text = "O's";
			methods.labelLight.text = "M's";
			
			stacheToggle.nostache.addEventListener(MouseEvent.CLICK, onStacheClick);
			stacheToggle.stache.addEventListener(MouseEvent.CLICK, onStacheClick);
			
			newOperatorButton.visible = false;
			newMethodButton.visible = false;
			newMethodButton.label.text = "method";
			newMethodButton.label.mouseEnabled = false;
			
			stacheToggle.visible = false;
			useCogulatorCollections();
		}
		
		
		function useCogulatorCollections() {
			//determine whether to use the cogulatorcolletions button
			var cogulatorcollections = File.documentsDirectory.resolvePath("cogulator/cogulatorcollection");
			if (cogulatorcollections.isDirectory) {
				cogulatorcollectionsEnabled = true;
				if (models.currentFrame == 1) stacheToggle.visible = true;
			}
		}
	

		function onMouseOver (evt:MouseEvent):void {
			evt.currentTarget.gotoAndStop(3);
		}


		function onMouseOut (evt:MouseEvent):void {
			evt.currentTarget.gotoAndStop(2);
		}


		function onMouseClick (evt:MouseEvent):void {
			evt.currentTarget.gotoAndStop(1);
			evt.currentTarget.removeEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
			evt.currentTarget.removeEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
			evt.currentTarget.removeEventListener(MouseEvent.CLICK, onMouseClick);
			
			if (evt.currentTarget.name == "models") {
				operators.gotoAndStop(2);
				operators.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
				operators.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
				operators.addEventListener(MouseEvent.CLICK, onMouseClick);
				methods.gotoAndStop(2);				
				methods.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
				methods.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
				methods.addEventListener(MouseEvent.CLICK, onMouseClick);
				newOperatorButton.visible = false;
				newMethodButton.visible = false;
				if (cogulatorcollectionsEnabled) stacheToggle.visible = true;
				models.labelDark.text = "Models";
				operators.labelLight.text = "O's";
				methods.labelLight.text = "M's";
			} else if (evt.currentTarget.name == "operators") {
				models.gotoAndStop(2);	
				models.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
				models.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
				models.addEventListener(MouseEvent.CLICK, onMouseClick);
				methods.gotoAndStop(2);	
				methods.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
				methods.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
				methods.addEventListener(MouseEvent.CLICK, onMouseClick);
				newOperatorButton.visible = true;
				stacheToggle.visible = false;
				newMethodButton.visible = false;
				models.labelLight.text = "Models";
				operators.labelDark.text = "O's";
				methods.labelLight.text = "M's";
			} else if (evt.currentTarget.name == "methods") {
				models.gotoAndStop(2);	
				models.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
				models.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
				models.addEventListener(MouseEvent.CLICK, onMouseClick);
				operators.gotoAndStop(2);	
				operators.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
				operators.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
				operators.addEventListener(MouseEvent.CLICK, onMouseClick);
				newOperatorButton.visible = false;
				stacheToggle.visible = false;
				newMethodButton.visible = true;
				models.labelLight.text = "Models";
				operators.labelLight.text = "O's";
				methods.labelDark.text = "M's";
			}
			
			dispatchEvent(new Event("sidebar toggle"));
		}
		
		
		function onStacheClick(evt:MouseEvent):void {
			if (evt.currentTarget.name == "nostache" && stacheToggle.arrow.currentFrame != 10) {
				stacheToggle.localTxt.visible = true;
				stacheToggle.stacheTxt.visible = false;
				stacheToggle.select = "nostache";
				stacheToggle.arrow.gotoAndStop(1);
				stacheToggle.arrow.play();
				showCogulatorCollectionsNow = false;
			} else if (evt.currentTarget.name != "nostache" && stacheToggle.arrow.currentFrame != 1) {
				stacheToggle.localTxt.visible = false;
				stacheToggle.stacheTxt.visible = true;
				stacheToggle.select = "stache";
				stacheToggle.arrow.gotoAndStop(10);
				stacheToggle.arrow.play();
				showCogulatorCollectionsNow = true;
			}
			
			stacheToggle.updateOutListener();
			dispatchEvent(new Event("stashe groom"));
		}
	}
	
}
