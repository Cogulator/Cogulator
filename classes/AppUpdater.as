package classes {
	
	//https://www.youtube.com/watch?v=CXKpw1HNoUA&noredirect=1
	import air.update.ApplicationUpdaterUI;
	import air.update.events.UpdateEvent;
	import flash.events.ErrorEvent;
	
	public class AppUpdater {
		
		private static var updater:ApplicationUpdaterUI;

		public static function updateCheck() {
			// constructor code
			updater = new ApplicationUpdaterUI();
			//updater.updateURL = "http://employeeshare.mitre.org/s/sestes/transfer/updateDescriptor.2.5.xml";
			updater.updateURL = "http://cogulator.github.io/Cogulator/updateDescriptor.2.5.xml";
			updater.delay = 0;
			updater.initialize();
			updater.isCheckForUpdateVisible = false;
				
			updater.addEventListener(UpdateEvent.INITIALIZED, onUpdate);
			updater.addEventListener(ErrorEvent.ERROR, onError);
		}
		
		private static function onUpdate(evt:UpdateEvent):void {
			updater.checkNow();
		}
		
		private static function onError(evt:ErrorEvent):void {
			trace("error");
		}

	}
	
}
