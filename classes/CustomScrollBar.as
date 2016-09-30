/*******************************************************************************
 * This is the copyright work of The MITRE Corporation, and was produced for the 
 * U. S. Government under Contract Number DTFAWA-10-C-00080.
 * 
 * For further information, please contact The MITRE Corporation, Contracts Office, 
 * 7515 Colshire Drive, McLean, VA  22102-7539, (703) 983-6000.
 * 
 * Copyright 2014 The MITRE Corporation
 *
 * Approved for Public Release; Distribution Unlimited. 14-0584
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

package classes {
	
	import flash.display.MovieClip;
	import flash.events.*;
	import flash.events.MouseEvent;
	import flash.geom.Rectangle;
	import classes.ModelsSidebar;
	import flash.display.Stage;
	
	
	public class CustomScrollBar extends MovieClip {
		private var _sidebar:Object;
		private var _sidebarBackground:MovieClip;
		private var _stage:Stage;
		private var _ganttWindow:MovieClip;
		public var sideBarDefaultY:Number;
		
		public var prcntShown:Number = 1;
		
		public function CustomScrollBar(stg:Stage, gw:MovieClip, sb:Object, sbb:MovieClip, defY:Number) {
			// constructor code
			_stage = stg;
			_stage.addEventListener(Event.RESIZE, onResizeStage);
			_ganttWindow = gw;
			_sidebar = sb;
			_sidebarBackground = sbb;
			
			dragger.addEventListener(MouseEvent.MOUSE_DOWN, startDragging);
			_stage.addEventListener(MouseEvent.MOUSE_UP, stopDragging);
			_sidebar.addEventListener(MouseEvent.MOUSE_WHEEL, moveViaWheel);
			_sidebarBackground.addEventListener(MouseEvent.MOUSE_WHEEL, moveViaWheel);
			
			sideBarDefaultY = defY;
			
			this.visible = false;
			this.x = 177;
			this.y = sideBarDefaultY;
			
			dragger.y = 0;
			
			onResizeStage();
		}
		
		private function startDragging (evt:MouseEvent):void {
			bckgrnd.height = _ganttWindow.y - this.y;
			dragger.startDrag(false,new Rectangle(bckgrnd.x + 1, bckgrnd.y, 0, bckgrnd.height - evt.currentTarget.height));
			addEventListener(Event.ENTER_FRAME, slideSideBar);
		}
		
		private function stopDragging (evt:MouseEvent):void {
			dragger.stopDrag();
			removeEventListener(Event.ENTER_FRAME, slideSideBar);
		}
		
		private function moveViaWheel(evt:MouseEvent):void {
			var why:Number = dragger.y + -evt.delta * 5;
			if (why < 0) why = 0;
			else if (why > bckgrnd.height - dragger.height) why = bckgrnd.height - dragger.height;
			dragger.y = why;
			slideSideBar();
		}
		
		
		private function slideSideBar (evt:Event = null):void {
			_sidebar.y = -(dragger.y / bckgrnd.height) * _sidebar.height + sideBarDefaultY;
		} 
		
		
		private function onResizeStage(event = null):void {
			resizeScrollBarElements();
			adjustSideBar();
		}
		
		
		public function resizeScrollBarElements():void {
			bckgrnd.height = _ganttWindow.y - this.y;
			
			updateSideBarPixelsVisible();
			dragger.height = bckgrnd.height * prcntShown;
			
			if (_sidebar.visible == false) this.visible = false;
			else if (prcntShown > 1) this.visible = false;
			else this.visible = true;
		}
		
		
		public function adjustSideBar():void {
			if (this.visible == false) {
				_sidebar.y = sideBarDefaultY;
			} else {
				//ensure that there's never a gap between the bottom of the sidebar and the top of the ganttWindow
				if (_sidebar.y + _sidebar.height < _ganttWindow.y) _sidebar.y = _ganttWindow.y - _sidebar.height;
				//move the dragger to the correct position given the resized window
				var sidebarPercentageScroll = (  Math.abs(_sidebar.y - sideBarDefaultY) / _sidebar.height);
				dragger.y = bckgrnd.height * sidebarPercentageScroll;
			}
		}
		
		
		public function updateSideBarPixelsVisible():void {
			var sideBarPxlsVisible:Number = _stage.stageHeight - sideBarDefaultY;
				sideBarPxlsVisible       -= _stage.stageHeight - _ganttWindow.y;
			prcntShown = sideBarPxlsVisible / _sidebar.height;
		}
		
	}
	
}