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
	import flash.text.TextField;
    import flash.text.TextFormat;
    import flash.text.TextFieldAutoSize;
	import flash.text.TextFormatAlign;
    import flash.display.Graphics;
    import flash.display.Shape;
    import flash.display.Sprite;
	import flash.events.MouseEvent;
	import flash.utils.Dictionary;
	import flash.filters.*;
	import classes.WorkingMemory;
	import classes.TimeObject;
	import classes.Step;
	import classes.TextHighlighter;
	import classes.SyntaxColor;
	import classes.GomsProcessor;
	import com.inruntime.utils.*;
	
	public class GanttChart extends MovieClip {
		private var $:Global = Global.getInstance();
		
		private var codeText:String;
		private var rawgoms:Array;
		private var workingMemory:WorkingMemory = new WorkingMemory();
				
		public var scl:Number; // = 5000;
		
		private var cycleTime:Number;
		
		//variables set by GomsProcessor
		public var maxEndTime:Number; // = 0;
		private var thrdOrdr:Array; //an order of threads for gantt chart time line annotation
		private var threadAvailability:Dictionary; //= new HashMap<String, TimeObject>();
		public var intersteps:Array; //interleaved steps
		private var allmthds:Array;
		private var cntrlmthds:Array; //list of methods in the control loop for overview timeline
		
		private var lato = new Lato();
		
		private var _ganttWindow:MovieClip;
		
		private var _error:MovieClip;
		
		private var drawNewTimeLine:Boolean;
		private var _timeLineLblsContainer:Sprite;
		
		public var msTimeLineWidth:Number;
		
		private var grotesqueSmall:TextFormat = new TextFormat();
		private var grotesqueMed:TextFormat = new TextFormat();
		private var grotesqueLrg:TextFormat = new TextFormat();
		
		// gantt chart width
		private var chrtWdth:Number; //pixels
		
		//set up color palette from Solorized
		private var colorPalette:Array = new Array (0x859900, 0xCB4B16, 0xDC322F, 0x6C71C4, 0x2AA198);  // Alternate syntax
		private var threadColor:Dictionary = new Dictionary();
		
		//lookup table for the position of the resource on the y axis of the gantt chart (set in the visualize methd)
		private var resourceY = new Dictionary();
		

		public function GanttChart(gW:MovieClip, s:Number, dNT:Boolean, tLLC:Sprite) {
			
			// constructor code
			_ganttWindow = gW;
			codeText = $.codeTxt.text;
			scl = s;
			drawNewTimeLine = dNT;
			_timeLineLblsContainer = tLLC;
			
			// fonts
			grotesqueSmall.size = 12;
			grotesqueSmall.font = lato.fontName;
			grotesqueSmall.color = 0x62686A;
			
			grotesqueMed.size = 13;
			grotesqueMed.font = lato.fontName;
			grotesqueMed.color = 0x62686A;
			
			grotesqueLrg.size = 13;
			grotesqueLrg.font = lato.fontName;
			grotesqueLrg.color = 0x62686A;
			
			initiate();
		}
		
		private function initiate() {
			try {
				var vars:Array = GomsProcessor.processGOMS();
					maxEndTime = vars[0];
					thrdOrdr = vars[1]; 
					threadAvailability = vars[2];
					intersteps = vars[3];
					allmthds = vars[4];
					cntrlmthds = vars[5];
				visualize(0);
			} catch (error:Error) {
				trace("try/catch fired");
			}
		}
		
		
		
		// ---------------------- //
		// --- VISUALIZIATION --- //
		// ---------------------- //
		
		
		public function visualize(transX:int){
			
			//draw gantt Chart
			drawganttChart(transX);
			
			//draw total time scale
			drawTimeOverview(transX);
			
			//draw chart labels
			drawLabels();
		}
		
		
		// ------------------- //
		// -- Thread Labels -- //
		// ------------------- //
		private function drawLabels(){			
			//thred labels
			var lineY:Number = resourceY["hands"] + labelDeltaY + 40 + thrdOrdr.length * 15; //hands is the lowest line in the chart
			for (var i:int = 0; i < thrdOrdr.length; i++) {
				var t:String = thrdOrdr[i];
				var tF:TextField = new TextField();
					tF.defaultTextFormat = grotesqueMed;
					tF.text = t;
					tF.width = 150;
					tF.x = - 155;
					tF.y = lineY - 12 - i * 15;
				addChild(tF);
			}
		}
			
		
		
		// ----------------- //
		// -- Gantt Chart -- //
		// ----------------- //
		
		private var bH:Number;
		private var lineDeltaY:int = 10; //line and label y adjustment
		private var oprtrDeltaY:int = -10;
		private var labelDeltaY:int = 10;
		
		//could save a loop by doing the gantt chart bit in the processing stage, but not a big deal right now
		private function drawganttChart(transX:int) { //scl is the total amount of time shown in gantt chart section in milliseconds
		
			chrtWdth = _ganttWindow.chartBckgrnd.width;
			var sclFctr:Number = chrtWdth / scl; //pixels per milliseconds
			
			var stepX1:Number; //position on x axis
			var stepX2:Number; //end of line
			var stepY:Number; //position on y axis
			
			//set the color for each thread
			var it:int = 0;
			threadColor["base"] =  0x363A3B; //base is always this dark blue
			
			for (var ky:String in threadAvailability) {
				var thred:String = ky;
				if (ky != "base") {
					threadColor[ky] = colorPalette[it];
					it++;
				}
				if (it > colorPalette.length) it = 0;
			}
			
			//set the y position for each resource
			resourceY["hear"] = 15;
			resourceY["see"] = resourceY["hear"] + 50;
			resourceY["cognitive"] = resourceY["see"] + 50;
			resourceY["speech"] = resourceY["cognitive"] + 50;
			resourceY["hands"] = resourceY["speech"] + 50;
			
			//draw gantt chart with working memory in place where you eventually put ms timeline
			for (var i:int = 0; i <intersteps.length; i++) {
				var step:Step = intersteps[i];
				
				stepX1 = step.srtTime * sclFctr;
				stepX2 = step.endTime * sclFctr;
				stepY = resourceY[step.resource];
				
				var colour:uint = threadColor[step.thred];
				
				//add operator time...
				var opTime:TextField = new TextField();
					opTime.defaultTextFormat = grotesqueMed;
					opTime.autoSize = TextFieldAutoSize.LEFT;
					opTime.text = " " + int(step.time);
					opTime.x = stepX1;
					opTime.y = stepY + oprtrDeltaY; 
				if (opTime.width < stepX2 - stepX1) addChild(opTime);
				
				//draw operator line...
				//...first need to determine if the next step is above or below current step for line connecitng
				//get previous step in same thrd...
				var prvstepY:Number;
				var nxtstepY:Number;
				
				var prvstep:Step = findStep(i, step.thred, -1);
				if (prvstep == null) prvstepY = stepY;
				else prvstepY = resourceY[prvstep.resource];
				
				//..and the next step in same thrd...
				var nxtstep:Step = findStep(i, step.thred, 1);
				if (nxtstep == null) nxtstepY = stepY;
				else nxtstepY = resourceY[nxtstep.resource];
				
				var uplft:int, dwnlft:int, uprght:int, dwnrght:int;
				if (stepY == prvstepY) {
					uplft = 5;
					dwnlft = 5;
				} else if (stepY < prvstepY) {
					uplft = 5;
					dwnlft = 35;
				} else {
					uplft = 35;
					dwnlft = 5;
				}
				
				if (stepY == nxtstepY) {
					uprght = 5;
					dwnrght = 5;
				} else if (stepY < nxtstepY) {
					uprght = 5;
					dwnrght = int(nxtstepY - stepY);
				} else {
					uprght = int(stepY - nxtstepY);
					dwnrght = 5;
				}
				
				var line:Shape = new Shape();
					line.graphics.lineStyle(1, colour, 1, false, "normal", "none", "null", 3);
					connector
				
				line.graphics.moveTo(stepX1, stepY + lineDeltaY); 
				line.graphics.lineTo(stepX2, stepY + lineDeltaY);
				
				var connector:Shape = new Shape();
					connector.graphics.lineStyle(1, colour);
				
				connector.graphics.moveTo(stepX1, stepY + lineDeltaY - uplft); //left cap
				connector.graphics.lineTo(stepX1, stepY + lineDeltaY + dwnlft);
				
				connector.graphics.moveTo(stepX2, stepY + lineDeltaY - uprght); 
				connector.graphics.lineTo(stepX2, stepY + lineDeltaY + dwnrght); //right cap
				
				addChild(line);
				addChild(connector);
				
				
				//add operator and label
				var lblTxt:String =  " " + StringUtils.capitaliseFirstLetter(step.operator) + " " + StringUtils.capitaliseFirstLetter(step.label);
				var opLbl:TextField = new TextField();
					opLbl.mouseEnabled = false;
					opLbl.defaultTextFormat = grotesqueMed;
					opLbl.autoSize = TextFieldAutoSize.LEFT;
					opLbl.text = lblTxt;
				var avlblRtio:Number = (stepX2 - stepX1) / opLbl.width;
				opLbl.text = "....."
				if (lblTxt.length < 4 || opLbl.width > stepX2 - stepX1) lblTxt = "";
				else if (avlblRtio < 1) lblTxt = lblTxt.substring(0, int(  ( lblTxt.length - 3 ) * avlblRtio )  ) + "..."; 
				opLbl.text = lblTxt;
				
				//text field is placed in container so that you can get hand cursor when hovering over field
				var opLblContainer:Sprite = new Sprite();
					opLblContainer.buttonMode = true;
					opLblContainer.x = stepX1;
					opLblContainer.y = stepY + labelDeltaY;
					opLblContainer.name = String(step.lineNo); //for textHighlighter
					opLblContainer.addEventListener(MouseEvent.CLICK, textHighlighter);
					opLblContainer.addChild(opLbl);
					addChild(opLblContainer);
				
				//save max end time
				if (step.endTime > maxEndTime)  maxEndTime = step.endTime;
			}
			
			addWorkingMemoryToChartWithAverage(_ganttWindow.chartBckgrnd.height - 45, sclFctr);
			
			//draw gantt chart timeline
			var lineX1:Number = 0;
			var lineX2:Number;
			var lineY:Number = _ganttWindow.chartBckgrnd.height - 45;
			
			lineX2 = maxEndTime * sclFctr;
			
			var timeLine:Shape = new Shape();
				timeLine.graphics.lineStyle(1, 0x363A3B, .25);
			
			timeLine.graphics.moveTo(lineX2, lineY - 5); //right cap
			timeLine.graphics.lineTo(lineX2, lineY + 5);
			
			timeLine.graphics.moveTo(lineX1, lineY); //timeline
			timeLine.graphics.lineTo(lineX2, lineY);
			
			timeLine.graphics.moveTo(lineX1, lineY - 5); //left cap
			timeLine.graphics.lineTo(lineX1, lineY + 5);
			
			addChild(timeLine);
			
			msTimeLineWidth = lineX2 - lineX1; //for use on the stage
			
			var epoch:int = int(scl)/2;
			
			var markers:int = int(maxEndTime/epoch); //one marker every 2500 ms
			for (var k:int = 1; k <= markers; k++) { //draw a line every 2500 ms;
				var markerLine:Shape = new Shape();
					markerLine.graphics.lineStyle(1, 0x363A3B, .25);
			
				if (maxEndTime - epoch * k > epoch / 2) {
					markerLine.graphics.moveTo(lineX1 + (epoch * k * sclFctr), lineY - 5); //right cap
					markerLine.graphics.lineTo(lineX1 + (epoch * k * sclFctr), lineY + 5);
					addChild(markerLine);
					
					var axisTime:TextField = new TextField();
						axisTime.defaultTextFormat = grotesqueSmall;
						axisTime.autoSize = TextFieldAutoSize.CENTER;
						axisTime.text = String(epoch * k);
						axisTime.x = lineX1 + (epoch * k * sclFctr) - (axisTime.width/2);
						axisTime.y = lineY;
					addChild(axisTime);
				}
			}
			
			var zero:TextField = new TextField();
				zero.defaultTextFormat = grotesqueSmall;
				zero.autoSize = TextFieldAutoSize.CENTER;
				zero.text = "0";
				zero.x = lineX1;
				zero.y = lineY;
			addChild(zero);
			
			var maxTime:TextField = new TextField();
				maxTime.defaultTextFormat = grotesqueSmall;
				maxTime.autoSize = TextFieldAutoSize.CENTER;
				maxTime.text = String(int(maxEndTime));
				maxTime.x = lineX2 - maxTime.width;
				maxTime.y = lineY;
			addChild(maxTime);
			
			//add methods reference to milliseconds timeline
			var mthdX:Number = 0;
			for (var l:int = 0; l < allmthds.length; l++) {
				var mthd:String = allmthds[l];
				
				//find the method in the intersteps array list
				for (var itr:int = 0; itr < intersteps.length; itr++) {
					var thisStep:Step = intersteps[itr];
					
					if (mthd == thisStep.goal){
					//when you find a match, find the thread for that method
					
						for (var itrtr:int = 0; itrtr < thrdOrdr.length; itrtr++) {
							if (thrdOrdr[itrtr] == thisStep.thred){
								mthdX = lineX1 + (thisStep.srtTime * sclFctr);
								
								var parts:Array = mthd.split('_');
								var mthdTxt:String;
								
								if (parts.length > 2) mthdTxt = StringUtils.capitaliseFirstLetter(parts[0]) + " " + StringUtils.capitaliseFirstLetter(parts[1]) + "...";
								else if (parts.length == 2) mthdTxt = StringUtils.capitaliseFirstLetter(parts[0]) + " " + StringUtils.capitaliseFirstLetter(parts[1]);
								else mthdTxt = StringUtils.capitaliseFirstLetter(parts[0]);
								
								//find the next method that is in the same thread so you can figure out if there is enough room to write the text
								var nxtStrtTm:Number = maxEndTime + 5000;
								for (var itrerate:int = itr + 1; itrerate < intersteps.length; itrerate++) {
									var nextstep:Step = intersteps[itrerate];
									if ( thisStep.thred == nextstep.thred && thisStep.goal != nextstep.goal) {
										nxtStrtTm = nextstep.srtTime;
										break;
									}
								}
				
								var nxtX:Number = lineX1 + (nxtStrtTm * sclFctr);
								var mthdLbl:TextField = new TextField();
									mthdLbl.defaultTextFormat = grotesqueSmall;
									mthdLbl.autoSize = TextFieldAutoSize.CENTER;
									mthdLbl.text = mthdTxt;
									mthdLbl.x = mthdX;
									mthdLbl.y = lineY - 20 - itrtr * 15;
									mthdLbl.filters = [new GlowFilter(0xF8F8F8, .75, 3, 3, 6, 2)] //color, alpha, blurX, blurY, strength
								if (mthdLbl.width < nxtX - mthdX) addChild(mthdLbl);
								
								var lblLine:Shape = new Shape();
									lblLine.graphics.lineStyle(1, 0x363A3B, .25);
								
								lblLine.graphics.moveTo(mthdX, lineY - 5 - itrtr * 18);
								lblLine.graphics.lineTo(mthdX, lineY + 5);
								addChild(lblLine);
								break;
				
							}
						}
						break;
					}
				}
			}
			

		}
		
		
		private function addWorkingMemoryToChartWithAverage(baselineY:Number, scl:Number):void {	
			var fiftys:int = maxEndTime / 50; //show wm in 50ms cycles
			var hght:int = 4;
			var rectangle:Shape = new Shape;
			var stepX:Number;
			
			var timeChunkInMemoryInSeconds:Number;
			var lastRecallProbability:Number;
			var updatedRecallProbability:Number;
			
			var color:uint;
			var transparency:Number;
					
			var i:int = 0;
			var step:Step = intersteps[0];
			var overload:Boolean;
			var currentTime:Number = 0;
			
			var totalChunks = 0;
			
			for (var stacks:int = 0; stacks < fiftys; stacks++) { //for each 50 ms cycle over the length of the task time ...
				//the current time in milliseconds
				currentTime = stacks * 50;
				overload = false;
				
				//if there are any steps that are initiated during this 50 ms cycle, add them to working memory
				//     note - this is imperfect right now - during multitasking if two operators want to add to wm at the same time, the base thread will sometimes get pushed for a few cycles before it's added
				while (i < intersteps.length && step.endTime <= currentTime) {
					overload = pushChunk(step); //pushes the chunk to memory and tells you if you overloaded memory as a result
					i++
					step = intersteps[i];
				}
												
				//determine the x for this 50 ms cycle
				stepX = currentTime * scl;
				
				//with working memory updated, plot working memory for this 50 ms cycle
				for (var slot:int = 0; slot < workingMemory.memory.length; slot++) { //... add a rectangle for each chunk
					//determine how long the chunk has been memory
					timeChunkInMemoryInSeconds = (currentTime - workingMemory.memory[slot].addedAt) / 1000;
					lastRecallProbability = workingMemory.memory[slot].probabilityOfRecall;
					updatedRecallProbability = workingMemory.updateProbabilityOfRecall(slot, timeChunkInMemoryInSeconds);
													
					transparency = 1 - ( (1 - updatedRecallProbability) * 2 );
					
					//if this memory is still traceable, add a regular rectangle
					if (lastRecallProbability >= .5) {
						if (updatedRecallProbability >= .5) {
							color = workingMemory.memory[slot].color;
							rectangle.graphics.beginFill(color, transparency)
							totalChunks++;
							
						} else {
							rectangle.graphics.beginFill(0xFFFFFF, transparency);
						}
						rectangle.graphics.drawRect( stepX,
							 baselineY - (hght * slot) - (slot + hght), 
							 50 * scl - 1, 
							 hght - 1 ); 
						rectangle.graphics.endFill();
					}
				}
				
				if (overload) {
					var p:Popped = new Popped();
						p.x = stepX;
						p.y = baselineY - (hght * 7) - (7 + hght);
					addChild(p);
				}
			}
			
			addChild(rectangle);
			_ganttWindow.avgWorkingMemoryTxt.text = "Average WM chunks: " + (int(totalChunks/fiftys*10)/10);
		}
		
		private function pushChunk(step:Step):Boolean {
			var overload:Boolean;
			if (_ganttWindow.automateButton.currentFrame < 3) {
				if (step.operator == "store" || step.operator == "recall" ||
					step.operator == "look" || step.operator == "search" || 
					step.operator == "perceptual_processor" || step.operator == "hear" ||
					step.operator == "think") {
					
					overload = workingMemory.updateMemory("push", step.label, step.endTime);
					return overload;
				}
			} else {
				if (step.operator == "store") {
					overload = workingMemory.updateMemory("push", step.label, step.endTime);
					return overload;
				}
			}
			return false;
		}
		
		
		private function findStep(i:int, thrd:String, drctn:int):Step {
			var itr:int = i;
			var itrstep:Step;
			
			do {
				itr += drctn;
				if (itr < 0 || itr >= intersteps.length) {
					return null;
				}
				itrstep = intersteps[itr];
			} while (itrstep.thred != thrd);
			
			return itrstep;
		}
		
		private function allowTranslate (transX:Number, _scl:Number):Boolean {
		  // determine how many seconds the translate factor moves the chart using millseconds per pixel
		  var prtFctr:Number   = _scl / chrtWdth; //millseconds per pixel
		  var startTime:Number = -transX * prtFctr; //how much time has shifted on the gantt chart based on the translation magnitude
		  var endTime:Number   = _scl + startTime;
		  
		  if (startTime < 0 || startTime > maxEndTime) return false;
		  else return true;
		}
		
		//when zooming, ensure the time at the far left of the gantt chart stays in place
		private function zoomTranslate (transX:Number, newScale:Number):int { 
		
			//determine what the time displayed in the furthest left of the gantt chart is
			var prtFctr:Number   = scl / chrtWdth; //millseconds per pixel
			var startTime:Number = -transX * prtFctr; //what is the time futherest left in the gantt chart
			
			//determine what the time will be if using the new scale
			prtFctr = newScale / chrtWdth; //millseconds per pixel
			var badStartTime:Number = -transX * prtFctr;
			
			//determine how many pixels you need to translate to adjust for the time difference
			var timeDif:Number = badStartTime - startTime;
			var adjFctr:Number = chrtWdth / newScale; //pixels per millsecond
			var adj:Number = timeDif * adjFctr;
			
			return int(adj);
		}
		
		
		private function textHighlighter (evt:MouseEvent):void {
			TextHighlighter.highlightByLineNo(int(evt.currentTarget.name))
		}
		
		
		
		// ----------------------- //
		// -- Overview Timeline -- //
		// ----------------------- //
		private function drawTimeOverview(transX:Number){
			
			var chrtWdth:Number = _ganttWindow.chartBckgrnd.width;

			var sclFctr:Number = chrtWdth / maxEndTime; //pixels per milliseconds
			
			var lineX1:Number = _ganttWindow.mainTimeLine.x;
			var lineX2:Number = lineX1 + chrtWdth;
			var lineY:Number =  _ganttWindow.mainTimeLine.y - 10;
					
			if (drawNewTimeLine == true) {
				var zero:TextField = new TextField();
					zero.defaultTextFormat = grotesqueLrg;
					zero.text = "0";
					zero.x = _ganttWindow.mainTimeLine.x - 5;
					zero.y = _ganttWindow.mainTimeLine.y + 5;									
				_timeLineLblsContainer.addChild(zero);
				
				var maxTime:TextField = new TextField();
					maxTime.defaultTextFormat = grotesqueLrg;
					maxTime.text = String(Math.round(maxEndTime/100)/10) + " s";
					maxTime.x = _ganttWindow.mainTimeLine.x + _ganttWindow.mainTimeLine.width - 10;
					maxTime.y = _ganttWindow.mainTimeLine.y - 25;
				_timeLineLblsContainer.addChild(maxTime);				
				
				//add methods from the control loop for reference
				var mthdX:Number = 0;
				for (var i:int = 0; i < cntrlmthds.length; i++) {
					var mthd:String = cntrlmthds[i];
					
					//find the method in the intersteps array list
					for (var itr:int = 0; itr <intersteps.length; itr++) {
						var step:Step = intersteps[itr];
										
						//when you find a match...
						if ( mthd == step.goal && mthdX < lineX1 + (step.srtTime * sclFctr) ) { //time test in case there are methods with same name
				
							mthdX = lineX1 + (step.srtTime * sclFctr);
							var parts:Array = mthd.split('_');
							var mthdTxt:String = "";   
							
							for each (var pieces in parts) mthdTxt += StringUtils.capitaliseFirstLetter(pieces) + " ";
				
							//... find the next control method start time so you can figure out if there is enough room to write the text
							var nxtStrtTm:Number = maxEndTime + 5000;
							if (i +  1 < cntrlmthds.length ) {
								var nxtmthd:String = cntrlmthds[i + 1];
								for (var itrerate:int = itr + 1; itrerate < intersteps.length; itrerate++) {
									var nextstep:Step = intersteps[itrerate];
									if ( nextstep.goal == nxtmthd ) {
										nxtStrtTm = nextstep.srtTime;
										break;
									}
								}
							}
				
							var nxtX:Number = lineX1 + (nxtStrtTm * sclFctr);
							var mthdLbl:TextField = new TextField();
								mthdLbl.mouseEnabled = false;
								mthdLbl.defaultTextFormat = grotesqueLrg;
								mthdLbl.text = mthdTxt;
								mthdLbl.autoSize = TextFieldAutoSize.LEFT;
								mthdLbl.x = mthdX;
								mthdLbl.y =  lineY - 17;
							
							if (mthdLbl.x + mthdLbl.width > maxTime.x && mthdLbl.width < nxtX - mthdX) { //if extends past end of timeline
								var endRtio:Number = ( (maxTime.x - mthdX) / mthdLbl.width ) - .2;
								mthdLbl.text = mthdTxt.substring(0, mthdTxt.length * endRtio) + "...";
							} else if (mthdLbl.width >= nxtX - mthdX) { //elf if extends past next label
								var lblRtio:Number = ( (nxtX - mthdX) / mthdLbl.width ) - .2;
								mthdLbl.text = mthdTxt.substring(0, mthdTxt.length * lblRtio) + "...";
							}
							_timeLineLblsContainer.addChild(mthdLbl);
					
							if (i != 0) {
								var mthdTime:TextField = new TextField();
									mthdTime.mouseEnabled = false;
									mthdTime.defaultTextFormat = grotesqueLrg;
									mthdTime.autoSize = TextFieldAutoSize.CENTER;
									mthdTime.text = " " + StringUtils.oneSigDig(step.srtTime) + " "; //make sure text not cut off
									mthdTime.x = mthdX - (mthdTime.width/2);
									mthdTime.y =  lineY + 15;
								_timeLineLblsContainer.addChild(mthdTime);
							}
							
							var labelLine:Shape = new Shape();
								labelLine.graphics.lineStyle(1, 0x363A3B);
							
							labelLine.graphics.moveTo(mthdX, _ganttWindow.mainTimeLine.y - 7); 
							labelLine.graphics.lineTo(mthdX, _ganttWindow.mainTimeLine.y + 7);
							_timeLineLblsContainer.addChild(labelLine);
							break;
						}
					}
				}
			}
			
			//determine how many seconds the translate factor accounts for in the gantt chart  
			var prtFctr:Number = scl / chrtWdth; //millseconds per pixel
			var prtTime:Number = transX * prtFctr; //how much time has shifted on the gantt chart based on the translation magnitude
			
			//highlight gantt chart time shown
			var cvrt:Number;
			if (scl > maxEndTime) cvrt = maxEndTime * sclFctr;
			else cvrt = scl * sclFctr;
			
			_ganttWindow.timeLineDragger.width = cvrt;
			
		}

	}
}
