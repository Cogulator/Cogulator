package  classes {
	import flash.events.*;
	import flash.filesystem.*;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	
	public class XMLLoader extends EventDispatcher {
		
		private var file:File;
		private var filestream:FileStream = new FileStream();
		public var xML:XML = new XML();
		private var pth:String;
		public var fileExists:Boolean;
		
		public function XMLLoader(path:String) {
			// constructor code
			pth = path;
			file = File.documentsDirectory.resolvePath(path);
			if (file.exists) fileExists = true;
			else fileExists = false;
		}
		
		public function load():void {
			filestream.addEventListener(Event.COMPLETE, onLoadFinished);
			filestream.openAsync(file, FileMode.READ);
			
		}

		private function onLoadFinished(e:Event):void {
			xML = XML(filestream.readUTFBytes(filestream.bytesAvailable));
			filestream.close();
			dispatchEvent( new Event(pth) );
		} 

	}
	
}