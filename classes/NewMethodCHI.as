package classes {
	
	import flash.display.MovieClip;
	import flash.events.KeyboardEvent;
	import flash.ui.Keyboard;
	import flash.events.MouseEvent;
	import flash.events.FocusEvent;
	import flash.filesystem.File;
	import flash.filesystem.FileMode;
	import flash.filesystem.FileStream;
	import com.greensock.*;
	import com.greensock.easing.*;
	import flash.events.Event;
	
	
	public class NewMethodCHI extends MovieClip {
		
		private var _main:Main;
		private var _sideBar:MethodsSidebar;
		
		public function NewMethodCHI(main:Main, mSB:MethodsSidebar) {
			_main = main;
			_sideBar = mSB
			
			nameField.tabIndex = 1;
			
			addEventListener(KeyboardEvent.KEY_UP, onKeyUP);
			addEventListener(MouseEvent.CLICK, onClick);
			addEventListener(MouseEvent.MOUSE_UP, onClickRelease);
			_main.stage.addEventListener(MouseEvent.MOUSE_UP, onClickRelease);
			goButton.addEventListener(MouseEvent.CLICK, saveOnClickGo);
			
			
			initializer();
		}
		
		//  -- resets field as needed
		public function initializer() { 
			nameExists.visible = false;
			nameRequired.visible = true;
			nameField.text = "";
			stepsField.text = "";
			stepsRequired.visible = true;
			goButton.visible = false;
			stepsHelp.visible = true;
		}
		
		//  -- saveMethod
		private function saveOnClickGo(evt:MouseEvent) {
			var steps = stepsField.text;
			
			//generate the path for the method
			var filePath:String = "";
			var slash:int = filePath.indexOf("\\");
			if (slash < 0) {
				filePath = _sideBar.methods.nativePath + "/custom/" + nameField.text + ".goms"; //mac or linux
				filePath = filePath.split("//").join("/");

			} else {
				filePath = _sideBar.methods.nativePath + "\\custom\\" +  nameField.text + ".goms";
				filePath = filePath.split("\\\\").join("\\");
			}
			
			var localFile = new File(File.documentsDirectory.nativePath); 
				localFile = localFile.resolvePath(filePath); 
			var localFileStream:FileStream = new FileStream();
				
			try {
				localFileStream.open(localFile, FileMode.WRITE);
				localFileStream.writeMultiByte(steps, "utf-8");
			} catch (error:Error) {
				trace("try/catch fired", error.message);
				dispatchEvent( new Event("¡save error!") ); //Main.as listens for this and displays error if needed
			}

			localFileStream.close();
			
			_main.generateMethodsSidebar(); //regenerate the methods sidebar
			_main.onNewMethodXClick(); //closes the window using code in main class, which will also initialize
		}

		private function onClickRelease(evt:MouseEvent):void {
			var selectedText = _main.codeTxt.selectedText;
			if (selectedText.length != 0) stepsField.text = selectedText;
			if (stepsField.length > 0) {
				stepsRequired.visible = false;
				stepsHelp.visible = false;
			} else {
				stepsRequired.visible = true;
				stepsHelp.visible = true;
			}
			
			setGoButton();
		}
		
		private function onKeyUP (evt:KeyboardEvent = null):void {
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
			} else if (evt.target.name == "stepsField") {
				if (stepsField.length > 0) {
					stepsRequired.visible = false;
					stepsHelp.visible = false
				} else {
					stepsRequired.visible = true;
					stepsHelp.visible = true;
				}
			}
			
			setGoButton();
			
		}
		
		private function onClick(evt:MouseEvent):void {
			setGoButton();
		}
		
		private function setGoButton() {
			if (!nameExists.visible && !nameRequired.visible && !stepsRequired.visible) {
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
			for each (var mB in _sideBar.methodButtons){
				if ( mB.label.text.toLowerCase() == txt.toLowerCase() ) return true;
			}
			return false;
		}
	}
	
}
