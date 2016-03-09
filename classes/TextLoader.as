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
			txt = String(filestream.readUTFBytes(filestream.bytesAvailable));
			
			//order important
			temp1 = txt.split(/\r\n/); //remove windows line endings
			temp1 = txt.split(/\n/); //remove mac line endings
			
			filestream.close();
			
			for each (var item in temp1) {
				temp2.length = 0;
				temp2 = item.split(" ");
				if (temp2.length > 0 && temp2[0] != "") {
					if (temp2.length < 5) { //prior to version 1.3, did not include labelUse in operators file
						arry.push({resource: temp2[0], appelation: temp2[1], time: temp2[2], description: temp2[3], labelUse: ""});
					} else {
						arry.push({resource: temp2[0], appelation: temp2[1], time: temp2[2], description: temp2[3], labelUse: temp2[4]});
					}
				}
			}
			
			dispatchEvent( new Event(pth) );
		} 

	}
	
}
