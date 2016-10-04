package classes {
				
	import flash.events.*;
	import flash.filesystem.File;
	import flash.filesystem.FileMode;
	import flash.filesystem.FileStream;
	import flash.display.MovieClip;
	
	
	public class SettingsFileManager extends MovieClip {
		
		public var xml:XML;
		
		private var file = new File(File.documentsDirectory.nativePath);
		private var path:String;
		private var loader:XMLLoader;

		public function SettingsFileManager() {
			// constructor code
			load();
			
		}
		
		private function load() {
			//	- setup to retrieve last saved windows size from settings XML file
			file = file.resolvePath("cogulator/config");
			path = file.nativePath;
			var slash:int = path.indexOf("\\");
			if (slash < 0) path += "//settings.xml"; //mac or linux
			else path += "\\settings.xml";
			
			//	- retrieved lasted save window size (if exists)
			loader = new XMLLoader(path);
			if (loader.fileExists) {
				loader.load();
				loader.addEventListener(path, loadHandler);
			} else {
				createSettingsFile();
			}
			
		}
		
		
		private function loadHandler (evt:Event):void {
			xml = loader.xML;
			dispatchEvent(new Event("settings file loaded"));
		}
		
		
		private function createSettingsFile () {
			xml = <models><window_size><width>960</width><height>800</height></window_size><window_position><x>10</x><y>10</y></window_position></models>;
			saveFile();
			
			loader.load();
			loader.addEventListener(path, loadHandler);
		}
		
		
		public function saveFile() {
			file = new File(File.documentsDirectory.nativePath);
			file = file.resolvePath(path); 
			var stream:FileStream = new FileStream();
				stream.open(file, FileMode.WRITE);
				stream.writeUTFBytes(xml.toXMLString()); 
				stream.close();	
		}

	}
	
}
