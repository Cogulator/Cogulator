package classes {
	
	import flash.events.*;
	import flash.filesystem.File;
	import flash.filesystem.FileMode;
	import flash.filesystem.FileStream;
	import flash.display.MovieClip;
	import classes.SettingsFileManager;
	import flash.geom.Point;
	
	public class WindowManager {
		
		private var _screenResolution:Object;
		private var _windowSize:Object = {width: 960, height: 800};
		private var _windowPosition:Object = {x: 50, y: 50};
		private var _settings:SettingsFileManager;

		public function WindowManager(settings:SettingsFileManager, screenResolution:Object) {
			_settings = settings;
			_screenResolution = screenResolution;

			//handle window size
			if  (_settings.xml.window_size.width < 250) { //if not previously set or less than 250
				_settings.xml.window_size.width = _windowSize.width;
				_settings.xml.window_size.height = _windowSize.height;
			} else {
				_windowSize = {width: _settings.xml.window_size.width, height: _settings.xml.window_size.height};
			}
			
			//handle window position
			if (resetWindowPosition()) {
				_settings.xml.window_position.x = _windowPosition.x;
				_settings.xml.window_position.y = _windowPosition.y;
			} else {
				_windowPosition = {x: _settings.xml.window_position.x, y: _settings.xml.window_position.y};
			}
        }
		
		public function set windowSize(widthAndHeight:Object):void {
			//breaking this up to ensure it's not passed as a reference
			_windowSize.width = widthAndHeight.width;
			_windowSize.height = widthAndHeight.height;
		}
		
		public function get windowSize():Object {
			return _windowSize;
		}
		
		
		public function set windowPosition(position:Object):void {
			//breaking this up to ensure it's not passed as a reference
			_windowPosition.x = position.x;
			_windowPosition.y = position.y;
		}
		
		public function get windowPosition():Object {
			return _windowPosition;
		}
		
		public function saveWindowInformation() {
			_settings.xml.window_size.width = _windowSize.width;
			_settings.xml.window_size.height = _windowSize.height;
			_settings.xml.window_position.x = _windowPosition.x;
			_settings.xml.window_position.y = _windowPosition.y;
		}
		
		private function resetWindowPosition():Boolean {
			if (_settings.xml.window_position.x < 10 || 
			_settings.xml.window_position.y < 10 ||
			_settings.xml.window_position.x > _screenResolution.width - 100 ||
			_settings.xml.window_position.y > _screenResolution.height - 100) {
				return true;
			} else {
				return false;
			}
		}

	}
	
}
