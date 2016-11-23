package classes {
	
	import flash.display.MovieClip;
	import flash.events.MouseEvent;
	import flash.filesystem.File;
	import flash.events.Event;
	
	
	public class MenuToggle extends MovieClip {
		
		public var cogulatorcollectionsEnabled = false;
		public var showCogulatorCollectionsNow = false;
		
		public function MenuToggle() {
			stop();
			
			operators.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
			operators.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
			operators.addEventListener(MouseEvent.CLICK, onMouseClick);
			
			stacheToggle.nostache.addEventListener(MouseEvent.CLICK, onStacheClick);
			stacheToggle.stache.addEventListener(MouseEvent.CLICK, onStacheClick);
			
			newOperatorButton.visible = false;
			
			stacheToggle.visible = false;
			useCogulatorCollections();
		}
		
		
		function useCogulatorCollections() {
			//determine whether to use the cogulatorcolletions button
			var cogulatorcollections = File.documentsDirectory.resolvePath("cogulator/cogulatorcollection");
			if (cogulatorcollections.isDirectory) {
				cogulatorcollectionsEnabled = true;
				if (this.currentFrame < 3) stacheToggle.visible = true;
			}
		}
	

		function onMouseOver (evt:MouseEvent):void {
			if (this.currentFrame == 1) gotoAndStop(2);
			else if (this.currentFrame == 3) gotoAndStop(4);
		}


		function onMouseOut (evt:MouseEvent):void {
			if (this.currentFrame == 2) gotoAndStop(1);
			else if (this.currentFrame == 4) gotoAndStop(3);
		}


		function onMouseClick (evt:MouseEvent):void {
			if (this.currentFrame == 2) {
				gotoAndStop(3);
				operators.removeEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
				operators.removeEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
				operators.removeEventListener(MouseEvent.CLICK, onMouseClick);
				models.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
				models.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
				models.addEventListener(MouseEvent.CLICK, onMouseClick);
				newOperatorButton.visible = true;
				stacheToggle.visible = false;
			} else if (this.currentFrame == 4) {
				gotoAndStop(1);
				models.removeEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
				models.removeEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
				models.removeEventListener(MouseEvent.CLICK, onMouseClick);
				operators.addEventListener(MouseEvent.MOUSE_OVER, onMouseOver);
				operators.addEventListener(MouseEvent.MOUSE_OUT, onMouseOut);
				operators.addEventListener(MouseEvent.CLICK, onMouseClick);
				newOperatorButton.visible = false;
				if (cogulatorcollectionsEnabled) stacheToggle.visible = true;
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
