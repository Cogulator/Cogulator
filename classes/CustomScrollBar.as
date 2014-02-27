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
						
			_sidebar.addEventListener(MouseEvent.ROLL_OVER, manageFrameEventListener);
			_sidebar.addEventListener(MouseEvent.CLICK, manageFrameEventListener);
			_sidebarBackground.addEventListener(MouseEvent.ROLL_OVER, manageFrameEventListener);
			_sidebarBackground.addEventListener(MouseEvent.ROLL_OUT, manageFrameEventListener);

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
		}
		
		private function manageFrameEventListener(evt:MouseEvent):void {
			//this seems fairly crappy.  the way this is structure now, the event is tied to the sidebar background & background
			//so you get lots of on/off firing as you scroll/move mouse over the area.  but, it seems to work none-the-less
			if (evt.type == "rollOver" || evt.type == "click") addEventListener(Event.ENTER_FRAME, slideSideBar);
			else if (evt.buttonDown == false) removeEventListener(Event.ENTER_FRAME, slideSideBar);
		}
		
		private function slideSideBar (evt:Event):void {
			var draggerRelativePosition:Number = (dragger.y + bckgrnd.y) / bckgrnd.height;
			_sidebar.y = (_sidebar.height * -draggerRelativePosition) + sideBarDefaultY;
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
			/*Resizing causes issues for the scrollbar when the dragger is not at the top position.  Essentially, the dragger
			  bounding box doesn't get updated during the resize and the position of the dragger and the sidebar start to disagree, so to speak.
			  This heavy handed code basically identifies where it thinks the sidebar should be position based on the position of the dragger.
			  The sidebar is then moved to the expected position.  AFterwards, we adjust the dragger position.  Again, to account for the fact that
			  the dragger bounding box isn't being updated during the stage resize*/
			} else { 
				var draggerRelativePos:Number = (dragger.y + bckgrnd.y) / bckgrnd.height; //dragbar position				
				updateSideBarPixelsVisible(); //determine how many pixels of the sidebar is being shown & change the number of pixels into a percentage of total sidebar pixels
				var adjustFactor:Number = draggerRelativePos + prcntShown;       //determine the difference between expected an acutal positoin.  If greater than 1, we know there's some space between the bottom of the sidebar and the the bottom of the stage
				if (adjustFactor <= 1) adjustFactor = 0; //if less than one, there's no space between the bottom of sidebar and bottom of stage so we don't care
				else adjustFactor = adjustFactor - 1;    //if greater than one, we take the amount over one to use for the adjustment factor
				_sidebar.y = (_sidebar.height * ( -draggerRelativePos + adjustFactor) ) + sideBarDefaultY;  //move the sidebar
				//dragger is moved in the opposite direction of the sidebar, by the same number of pixels
				dragger.y += ( (_sidebar.height * ( -draggerRelativePos) ) + sideBarDefaultY ) - ( (_sidebar.height * ( -draggerRelativePos + adjustFactor) ) + sideBarDefaultY );
			}
		}
		
		
		public function updateSideBarPixelsVisible():void {
			var sideBarPxlsVisible:Number = _stage.stageHeight - sideBarDefaultY;
				sideBarPxlsVisible       -= _stage.stageHeight - _ganttWindow.y;
			prcntShown = sideBarPxlsVisible / _sidebar.height;
		}
		
	}
	
}