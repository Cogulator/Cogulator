package  classes {
	import flash.events.*;
	import flash.filesystem.*;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	
	public class TextLoader extends EventDispatcher {
		
		private var file:File;
		private var filestream:FileStream = new FileStream();
		public var txt:String = new String();
		private var temp1:Array = new Array();
		private var temp2:Array = new Array();
		public var arry:Array = new Array();
		private var pth:String;
		
		public function TextLoader(path:String) {
			// constructor code
			file = File.documentsDirectory.resolvePath(path); 
			filestream.addEventListener(Event.COMPLETE, onLoadFinished);
			filestream.openAsync(file, FileMode.READ);
			pth = path;
		}
		

		private function onLoadFinished(e:Event):void {
			//txt = e.target.data;
			//temp1 = e.target.data.split(/\n/);
			txt = String(filestream.readUTFBytes(filestream.bytesAvailable));
			temp1 = txt.split(/\n/);
			filestream.close();
			
			for each (var item in temp1) {
				temp2.length = 0;
				temp2 = item.split(" ");
				arry.push({resource: temp2[0], appelation: temp2[1], time: temp2[2], description: temp2[3]});
			}
			
			dispatchEvent( new Event(pth) );
		} 

	}
	
}
