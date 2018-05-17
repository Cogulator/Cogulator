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



class GanttManager {
	constructor() {
		//addlisteners for slide up/down
		$('#not_gantt_container').addClass('full_height');
		$( '#gantt_button' ).click( function () {
			if( $('#gantt_container').css('bottom') == '-450px'){
				$('#gantt_container').animate({bottom:'0px'},"slow", function() {
					$('#not_gantt_container').addClass('partial_height').removeClass('full_height');
					$( '#gantt_button_text' ).addClass('rotate_180').removeClass('rotate_0');
				 });
				$('#gantt_button').animate({bottom:'450px'}, "slow");
			} else {
				$('#not_gantt_container').addClass('full_height').removeClass('partial_height');
				$('#gantt_container').animate({bottom:'-450px'}, "slow", function() {
					$( '#gantt_button_text' ).addClass('rotate_0').removeClass('rotate_180');
				});
				$('#gantt_button').animate({bottom:'0px'}, "slow");
				
			}
		});
	}
}
G.ganttManager = new GanttManager();



var ganttSketch = function(s) {
	var wdth = $( '#gantt_chart' ).width();
	var hght = $( '#gantt_chart' ).height();
	
	//screenshots
	var screenShot;
	var screenShotSavedX = 0;
	
	//fonts
	var fontRegular;
	var fontLight;
	var fontBold;
	var fontItalic;
	
	//images
	var cpmLabel;
	
	//scale & time
	var scale = 5000; //ms
	let cycleTime = 50; //ms
	var totalTaskTime = 0; //ms
	
	//chart
	let marginTop = 20;
	let marginBottom = 80;
	let marginLeft = 180;
	let marginRight = 40;
	let tickHeight = 5;
	let rowHeight = 50;
	let aboveLine = tickHeight * -2;
	let belowLine = tickHeight * 4;
	let palette = ['#333','#DC322F', '#2AA198', '#6C71C4','#859900', '#CB4B16'];  // Alternate syntax
	
	//timeline
	var timeLineWidth = wdth - marginLeft - marginRight;
	let timeLineY = hght - (marginBottom / 2);
	
	//scrollbar
	var scrollBarX = marginLeft;
	let scrollBarY = timeLineY - tickHeight;
	var scrollBarWidth = 50;
	let scrollBarHeight = tickHeight * 2;
	var dragging = false;
	var dragOffset = 0;
	
	//zoom buttons
	let zoomWdth = 23;
	let zoomHght = 50;
	var zoomX = wdth - (marginRight / 2) - (zoomWdth / 2);
	let zoomY = marginTop;
	
	//camera image
	let camWdth = 40;
	let camHght = 20;
	let camCrnrRadius = 5;
	let flashWdth = (camWdth - camCrnrRadius * 2) / 3;
	let camStartX = marginLeft - 10;
	let camStartY = hght - marginBottom - 10;
	
	//colors
	let style = getComputedStyle(document.body);
	let	backGroundClr = style.getPropertyValue('--main-bg-color');
	let	stripeClr = style.getPropertyValue('--gantt-stripe-color');
	let	borderClr = '#CCC';
	let fontAndScaleClr = '#363A3B';
	
	//loop control: things get laggy while looping, so only loop when focus is on gantt container
	$( "#gantt_container" ).hover(
		function() { //on over
			s.loop();
		}, function() {
			s.noLoop();
		}
	);
	
	//loop control: one loop to update chart, in case not already looping
	$( document ).on( "Subjective_Workload_Processed", function(evt, taskTimeMS) {
		s.draw();
	});
	
	//load fonts
	s.preload = function() {
  		fontRegular = s.loadFont('./style/fonts/Lato-Regular.ttf');
		fontLight = s.loadFont('./style/fonts/Lato-Light.ttf');
		fontBold = s.loadFont('./style/fonts/Lato-Bold.ttf');
		fontItalic = s.loadFont('./style/fonts/Lato-Italic.ttf');
		cpmLabel = s.loadImage('./images/CPM.png');
	}
	
	
	s.setup = function() {
		s.createCanvas(wdth, hght);
		s.noLoop();
		screenShot = new ScreenShotManager(document.getElementsByClassName("p5Canvas")[0]);
	}
	
	
	s.draw = function() {
		//the p5 renderer is evidently not quite ready on initial load. Try catch prevents 
		try {
    		s.drawBackground();
			totalTaskTime = G.gomsProcessor.totalTaskTime;
			if (totalTaskTime != null && totalTaskTime != undefined && totalTaskTime != Infinity) {
				if (dragging) scrollBarX = s.mouseX + dragOffset;
				if (!screenShot.active) scrollBarX = s.constrain(scrollBarX, marginLeft, marginLeft + timeLineWidth - scrollBarWidth);
				s.drawTimeline();
				s.drawChart();
				s.drawChartMasking();
				s.drawGanttChartLabel();
				s.drawZoomButtons();
				s.drawCamera();
				
				if (screenShot.ready) screenShot.save();
				s.handleScreenShot();
			}
		} catch(err) {}
	}
	
	
	s.drawBackground = function() {
		//erase the canvas
		s.fill(backGroundClr);
		s.noStroke();
		s.rect(0,0,wdth,hght);
		
		let bgdWidth = wdth - marginLeft - marginRight;
		let bgHeight = hght - marginTop - marginBottom;
		
		//rect that holds the scrolling chart
		s.rect(marginLeft,marginTop,bgdWidth,bgHeight);
		
		//zebra stripes
		s.fill(stripeClr);
		s.rect(marginLeft,marginTop,bgdWidth,rowHeight);
		s.rect(marginLeft,marginTop + (rowHeight * 2),bgdWidth,rowHeight);
		s.rect(marginLeft,marginTop + (rowHeight * 4),bgdWidth,rowHeight);
		
		s.stroke(borderClr);
		s.noFill();
		s.rect(marginLeft,marginTop,bgdWidth,bgHeight);
	}
	
	
	s.drawZoomButtons = function() {
		zoomX = wdth - (marginRight / 2) - (zoomWdth / 2);
	
	//outline
		s.noFill();
		s.stroke(fontAndScaleClr);
		s.rect(zoomX, zoomY, zoomWdth, zoomHght, zoomWdth);
	
	//dividing line
		let lineX1 = zoomX;
		let lineX2 = zoomX + zoomWdth;
		let lineY = zoomY + (zoomHght / 2);
		s.line(lineX1, lineY, lineX2, lineY);
	
	//button labels
		s.textAlign(s.CENTER);
		s.textSize(14);
		let textX = zoomX + (zoomWdth / 2);
		let textYAdj = (zoomHght / 4);
		s.text("+", textX, lineY - textYAdj + 5);
		s.text("-", textX, lineY + textYAdj + 5);
	}
	
	
	s.drawTimeline = function () {
		s.textAlign(s.LEFT);
		timeLineWidth = wdth - marginLeft - marginRight;
		
	//timeline
		s.stroke(fontAndScaleClr);
		s.line(marginLeft, timeLineY, marginLeft + timeLineWidth, timeLineY); //line
		s.line(marginLeft, timeLineY - tickHeight, marginLeft, timeLineY + tickHeight); //tick
		s.line(marginLeft + timeLineWidth, timeLineY - tickHeight, marginLeft + timeLineWidth, timeLineY + tickHeight); //tick
		
	//units label
		s.noStroke();
		s.fill(fontAndScaleClr);
		s.textFont(fontItalic);
		s.textSize(11);
		s.text("seconds", marginLeft + (timeLineWidth / 2), hght - 10);
		
	//scrollbar
		let pixelsPerSecond = timeLineWidth / (totalTaskTime / 1000); 
		scrollBarWidth = Math.min(timeLineWidth, pixelsPerSecond * (scale / 1000)); //tasktime is in milliseconds
		s.rect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);
		
	//start & end time
		s.textFont(fontRegular);
		s.textSize(14);
		let centerText = 3;
		
		s.noStroke();
		s.text("0", marginLeft - centerText, timeLineY + belowLine);
		s.text(Math.round(totalTaskTime / 100) / 10, marginLeft + timeLineWidth - centerText, timeLineY + aboveLine);
		
	//methods & times
		let methodsToAnnotate = G.gomsProcessor.intersteps.filter( function( step ) { //first pass
			return step.indentCount == 1; 
		});
		
		var indexes = [];
		for (var i = 0; i < methodsToAnnotate.length; i++) { //second, remove methods that aren't unique
			let method = methodsToAnnotate[i]; //this is actually a step, but all we care about is the method
			if (indexes.includes(method.goalIndex)) {
				methodsToAnnotate.splice(i, 1);
				i--;
			} else {
				indexes.push(method.goalIndex);
			}
		}
		
		for (var i = 0; i < methodsToAnnotate.length; i++) {
			let method = methodsToAnnotate[i]; //this is actually a step, but all we care about is the method
			let methodX = s.timeLineX(method.startTime);
			
			var spaceAvailable = 0; //number of pixels between this item and the next
			if (i == methodsToAnnotate.length - 1) spaceAvailable = marginLeft + timeLineWidth - methodX - 25; //25 to add a buffer
			else spaceAvailable  = s.timeLineX(methodsToAnnotate[i + 1].startTime) - methodX - 25;
			
			let nameLabel = s.fitTextToSpace(method.goal, spaceAvailable);
			if (nameLabel != "") {
				//add name label and time
				s.noStroke();
				s.text(nameLabel, methodX - centerText, timeLineY + aboveLine);
				s.text(Math.round(method.startTime / 100) / 10, methodX - centerText, timeLineY + belowLine);
				s.stroke(fontAndScaleClr);
				s.line(methodX, timeLineY - tickHeight, methodX, timeLineY + tickHeight); //tick
			}
		}
	}
	
	
	s.drawChart = function () {
		let windowStartTime = s.scrollXtoTime(scrollBarX); //ms
		
		s.drawGantt(windowStartTime);
		s.drawMemory(windowStartTime);
		s.msTimeline(windowStartTime); //millisecond timeline inside Gantt Chart
		s.drawSubjectiveWorkload(windowStartTime);
		//draw the millsecond timeline
	}
	
	
	s.drawChartMasking = function () {
		let bgdWidth = wdth - marginLeft - marginRight;
		let bgHeight = hght - marginTop - marginBottom;
		
		//left side pseudo mask
		s.noStroke();
		s.fill(backGroundClr);
		s.rect(0, marginTop, marginLeft,bgHeight);
		
		//right side pseudo mask
		s.rect(marginLeft + bgdWidth, marginTop, marginRight, bgHeight);
		
		//draw chart border
		s.stroke(borderClr);
		s.noFill();
		s.rect(marginLeft,marginTop,bgdWidth,bgHeight);
	}
	
	
	s.drawGanttChartLabel = function() {
		s.image(cpmLabel,25,marginTop + 10);
	}
	
	
	s.drawGantt = function(windowStartTime) {
		s.textAlign(s.LEFT);
		
		//loop through each thread
		var colorIndex = 0;
		for (var key in G.gomsProcessor.thrdOrdr) {
			let threadSteps = G.gomsProcessor.intersteps.filter( function( step ) {
				let thread = G.gomsProcessor.thrdOrdr[key]
				return step.thread == thread; 
			});
			
			let threadClr = palette[colorIndex];

			//loop through each step
			for (var i = 0; i < threadSteps.length; i++) {
				let step = threadSteps[i];
				var startTime = step.startTime;
				var endTime = step.endTime;
				
				//draw the line
				let stepX1 = s.ganttTimeToX(startTime, windowStartTime);
				let stepX2 = s.ganttTimeToX(endTime, windowStartTime);
				let stepY = s.resourceY(step.resource);
				
				s.stroke(threadClr);
				s.line(stepX1, stepY, stepX2, stepY);
				
				//draw the initial tick
				if (i == 0) s.line(stepX1, stepY - tickHeight, stepX1, stepY + tickHeight);
				
				//draw the connecting line
				if (i < threadSteps.length - 1) {
					let nextStep = threadSteps[i + 1]; 
					let nextY = s.resourceY(nextStep.resource);

					if (stepY == nextY) 	s.line(stepX2, stepY - tickHeight, stepX2, stepY + tickHeight);
					else if (stepY < nextY) s.line(stepX2, stepY - tickHeight, stepX2, nextY + tickHeight);
					else 					s.line(stepX2, stepY + tickHeight, stepX2, nextY - tickHeight);
				} else {
					s.line(stepX2, stepY - tickHeight, stepX2, stepY + tickHeight);
				}
				
				//add the label
				s.noStroke();
				if (s.textWidth(step.time) < stepX2 - stepX1 - 20) s.text(step.time, stepX1 + tickHeight, stepY - 3);
				let operatorLabel = s.fitTextToSpace(step.operator, stepX2 - stepX1 - 15)
				if (operatorLabel != "") s.text(operatorLabel, stepX1 + tickHeight, stepY + 15);
				
			}
			
			colorIndex++;
			if (colorIndex > palette.length - 1) colorIndex = 0;
		}
	}
	
	
	s.drawMemory = function(windowStartTime) {
		let memory = G.memory.workingmemory;
		let timeLineY = marginTop + (rowHeight * 6);
		let chunkHeight = tickHeight;
		let chunkWidth = cycleTime * (timeLineWidth / scale); //cycle time * pixelsPerMS
		
		s.stroke(backGroundClr);
		
		for (var i = 0; i < memory.length; i++) {
			let stack = memory[i];
			let stackTime = i * cycleTime;
			let stackX = s.ganttTimeToX(stackTime, windowStartTime);
			
			for (var j = 0; j < stack.length; j++) {
				let chunk = stack[j];
				let chunkY = timeLineY - (j * chunkHeight) - chunkHeight; 
				let chunkClr = s.colorAlpha(chunk.color, s.map(chunk.probabilityOfRecall,0.5,1,0,1));
				s.fill(chunkClr);
				s.rect(stackX, chunkY, chunkWidth, chunkHeight);
			}
		}
	}
	
	
	s.msTimeline = function(windowStartTime) {
		let windowEndTime = windowStartTime + scale // milliseconds
		let timeLineY = marginTop + (rowHeight * 6);
		
		s.textAlign(s.CENTER);
		s.textSize(12);
		s.fill(fontAndScaleClr);
		s.stroke(fontAndScaleClr);
		
		//basic line
		s.line(marginLeft, timeLineY, marginLeft + timeLineWidth, timeLineY);
		
		//line ticks - one every half the scale
		let interval = Math.floor(scale / 2);
		let ticks = Math.floor(totalTaskTime / interval);
		for (var i = 1; i < ticks; i++) {
			let tickX = s.ganttTimeToX(i * interval, windowStartTime);
			s.stroke(fontAndScaleClr);
			s.line(tickX, timeLineY - tickHeight, tickX, timeLineY + tickHeight);
			s.noStroke();
			s.text(i * interval, tickX, timeLineY + belowLine);
		}
		
		//annotate methods for each thread
		var colorIndex = 0;
		s.textAlign(s.LEFT);
		for (var key in G.gomsProcessor.thrdOrdr) {
			if (parseInt(key) > 2) continue; // right now only handle 3 threads, indexed at 0
			
			let threadSteps = G.gomsProcessor.intersteps.filter( function( step ) {
				let thread = G.gomsProcessor.thrdOrdr[key]
				return step.thread == thread; 
			});
			
			let threadClr = palette[colorIndex];
					
			var methodsToAnnotate = [];
			var indexes = [];
			for (var j = 0; j < threadSteps.length; j++) { //second, remove methods that aren't unique
				let method = threadSteps[j]; //this is actually a step, but all we care about is the method
				if (!indexes.includes(method.goalIndex)) {
					methodsToAnnotate.push({name:method.goal, startTime:method.startTime, threadNum: parseInt(key)});
					indexes.push(method.goalIndex);
				}
			}
			
			//determine if the thread label will fit
			for (var j = 0; j < methodsToAnnotate.length; j++) {
				let method = methodsToAnnotate[j]; 
				let methodX = s.ganttTimeToX(method.startTime, windowStartTime);

				var spaceAvailable = 10000; //number of pixels between this item and the next
				if (j < methodsToAnnotate.length - 1) spaceAvailable = s.ganttTimeToX(methodsToAnnotate[j + 1].startTime, windowStartTime) - methodX - 15;

				let nameLabel = s.fitTextToSpace(method.name, spaceAvailable);
				if (nameLabel != "") {
					//method label
					let labelY = timeLineY + (aboveLine * (method.threadNum + 1)); //first thread is zero
					s.stroke('#FFF');
					s.strokeWeight(2);
					s.fill(threadClr);
					s.text(nameLabel, methodX, labelY);
					
					//connector to timeline
					s.strokeWeight(1);
					s.stroke(threadClr);
					s.line(methodX, labelY, methodX, timeLineY + tickHeight);
					
				}
			}
			
			colorIndex++;
			if (colorIndex > palette.length - 1) colorIndex = 0;
		}
		
		//label
	}
		
	
	s.drawSubjectiveWorkload = function (windowStartTime) {
		let workload = G.workload.workload; //{stack: chunk.stack, load: load}
		let dotSize = 2;

		for (var i = 0; i < workload.length; i++) {
			let load = workload[i];
			let time = load.stack * cycleTime;
			var loadX = s.ganttTimeToX(time, windowStartTime);
			var loadY = marginTop + (rowHeight * 5) - tickHeight;
			
			for (var j = 0; j < load.load; j++) {
				var xAdjust = 0;
				if (j % 2 == 1) xAdjust = 4;
				else loadY += 4;
				
				s.fill('#333');
				s.ellipse(loadX + xAdjust, loadY, dotSize);
			}
		}
		
	}
	
	
	s.drawCamera = function() {
		//CAMERA BODY
		s.beginShape();
			//bottom right corner
			s.vertex(camStartX, camStartY); 
		
			//curve
			var pnt1X = camStartX;
			var pnt1Y = camStartY;
			var pnt2X = pnt1X - camCrnrRadius;
			var pnt2Y = pnt1Y + camCrnrRadius;
			var anchrX  = pnt1X;
			var anchrY = pnt2Y;
			s.bezierVertex(pnt1X, pnt1Y, anchrX, anchrY, pnt2X, pnt2Y);

			//bottom left corner
			pnt1X -=  (camWdth - (camCrnrRadius * 2));
			pnt1Y = pnt2Y;
			s.vertex(pnt1X, pnt1Y);

			//curve
			pnt2X = pnt1X - camCrnrRadius;
			pnt2Y = pnt1Y - camCrnrRadius;
			anchrX  = pnt2X;
			anchrY = pnt1Y;
			s.bezierVertex(pnt1X, pnt1Y, anchrX, anchrY, pnt2X, pnt2Y);
		
			//top left  corner
			pnt1X = pnt2X;
			pnt1Y = pnt2Y - (camHght - (camCrnrRadius * 2));
			s.vertex(pnt1X, pnt1Y);
		
			//curve
			pnt2X = pnt1X + camCrnrRadius;
			pnt2Y = pnt1Y - camCrnrRadius;
			anchrX  = pnt1X;
			anchrY = pnt2Y;
			s.bezierVertex(pnt1X, pnt1Y, anchrX, anchrY, pnt2X, pnt2Y);

			//left point of flash start
			pnt1X = pnt2X + flashWdth - camCrnrRadius;
			pnt1Y = pnt2Y;
			s.vertex(pnt1X, pnt1Y);
		
			//curve up to top of flash left
			pnt2X = pnt1X + camCrnrRadius;
			pnt2Y = pnt1Y - camCrnrRadius;
			anchrX  = pnt1X;
			anchrY = pnt2Y;
			s.bezierVertex(pnt1X, pnt1Y, anchrX, anchrY, pnt2X, pnt2Y);
		
			//right top of flash
			pnt1X = pnt2X + flashWdth - camCrnrRadius;
			pnt1Y = pnt2Y;
			s.vertex(pnt1X, pnt1Y);
		
			//curve down to bottom of flash right
			pnt2X = pnt1X + camCrnrRadius;
			pnt2Y = pnt1Y + camCrnrRadius;
			anchrX  = pnt2X;
			anchrY = pnt1Y;
			s.bezierVertex(pnt1X, pnt1Y, anchrX, anchrY, pnt2X, pnt2Y);
		
			//right top of camera
			pnt1X = pnt2X + flashWdth - camCrnrRadius;
			pnt1Y = pnt2Y;
			s.vertex(pnt1X, pnt1Y);
		
			//finish camera body top right curve
			pnt2X = pnt1X + camCrnrRadius;
			pnt2Y = pnt1Y + camCrnrRadius;
			anchrX  = pnt2X;
			anchrY = pnt1Y;
			s.bezierVertex(pnt1X, pnt1Y, anchrX, anchrY, pnt2X, pnt2Y);
		s.endShape(s.CLOSE);
				
		//CAMERA BUTTON
		s.beginShape();
			let bttnHght = 2;
			let bttnCrnRadius = 1;

			//bottom left corner
			pnt1X = camStartX - camWdth + camCrnrRadius * 2;
			pnt1Y = camStartY - camHght + camCrnrRadius;
			s.vertex(pnt1X, pnt1Y);
		
			//top left corner
			pnt1Y = pnt1Y - bttnHght;
			s.vertex(pnt1X, pnt1Y);
		
			//curve to finish top left corner
			pnt2X = pnt1X + bttnCrnRadius;
			pnt2Y = pnt1Y - bttnCrnRadius;
			anchrX = pnt1X;
			anchrY = pnt2Y;
			s.bezierVertex(pnt1X, pnt1Y, anchrX, anchrY, pnt2X, pnt2Y);
		
			//top right corner
			pnt1X = pnt2X + bttnHght;
			pnt1Y = pnt2Y;
			s.vertex(pnt1X, pnt1Y);
		
			//curve to finish top right corner
			pnt2X = pnt1X + bttnCrnRadius;
			pnt2Y = pnt1Y + bttnCrnRadius;
			anchrX = pnt2X;
			anchrY = pnt1Y;
			s.bezierVertex(pnt1X, pnt1Y, anchrX, anchrY, pnt2X, pnt2Y);
		
			//finish at bottom right corner
			pnt1X = pnt2X;
			pnt1Y = pnt1Y + bttnHght + bttnCrnRadius;
			s.vertex(pnt1X, pnt1Y);
		s.endShape(s.CLOSE);
		
		//LINES
		let lineX1 = camStartX - camWdth + camCrnrRadius;
		let lineX2 = camStartX;
		var lineY = camStartY - camHght / 9;
		s.line(lineX1, lineY, lineX2, lineY);
		var lineY = camStartY - camHght / 2;
		s.line(lineX1, lineY, lineX2, lineY);
		
		//LENS
		s.fill(backGroundClr);
		let lensX = camStartX - (camWdth / 2) + (camCrnrRadius / 2);
		let lensY = camStartY - (camHght / 2) + (camCrnrRadius);
		s.ellipse(lensX, lensY, camCrnrRadius * 3.5, camCrnrRadius * 3.5);
		
		//LABEL
		s.noStroke();
		s.fill(fontAndScaleClr);
		s.textAlign(s.LEFT);
		s.textSize(10);
		s.text("screenshot", camStartX - camWdth - 5, camStartY + 15);
		
		
	}
	
	
	s.fitTextToSpace = function (text, space) {
		if (space <= 0) return "";
		
		var subText = text;
		while (s.textWidth(subText) > space) subText = subText.substring(0, subText.length - 1);
		
		if (subText == "") return "";
		if (text != subText) return subText + "...";
		return text;
	}
	
		
	s.timeLineX = function (time) {
		let pixelsPerSecond = timeLineWidth / (totalTaskTime / 1000); 
		return marginLeft + ((time / 1000) * pixelsPerSecond); //time comes in ms
	}
	
	
	s.ganttTimeToX = function (time, windowStartTime) {
		let zeroOutTime = time - windowStartTime;
		let pixelsPerMS = timeLineWidth / scale;
		return marginLeft + (zeroOutTime * pixelsPerMS); //x when scroll bar is at time zero
	}
	
	
	s.scrollXtoTime = function (ex) {
		let msPerPixel = totalTaskTime / timeLineWidth;
		return (ex - marginLeft) * msPerPixel;
	}
	
	
	s.scrollTimeToX = function (time) {
		let pixelsPerMS = timeLineWidth / totalTaskTime;
		return (time * pixelsPerMS) + marginLeft;
	}
	
	
	s.resourceY = function (resource) {
		switch(resource) {
			case "hear":
				return marginTop + (rowHeight/2);
			case "see":
				return marginTop + (rowHeight) + (rowHeight/2);
			case "cognitive":
				return marginTop + (rowHeight * 2) + (rowHeight/2);
			case "speech":
				return marginTop + (rowHeight * 3) + (rowHeight/2);
			case "hands":
				return marginTop + (rowHeight * 4) + (rowHeight/2);
			default:
				return 0;
		}
	}
	
	
	s.colorAlpha = function (aColor, alpha) {
	  var c = s.color(aColor);
	  return s.color('rgba(' +  [s.red(c), s.green(c), s.blue(c), alpha].join(',') + ')');
	}
	
	
	s.mousePressed = function() {	
		// detect click on slider		  
		if (s.mouseX >= scrollBarX && s.mouseX <= scrollBarX + scrollBarWidth && s.mouseY >= scrollBarY  && s.mouseY <= scrollBarY + scrollBarHeight) {		    
			dragging = true;
			dragOffset = scrollBarX - s.mouseX;
		}
		
		// detect click on zoom button area
		else if (s.mouseX >= zoomX && s.mouseX <= zoomX + zoomWdth) {
			let topY = zoomY;
			let middleY = zoomY + (zoomHght / 2);
			let bottomY = zoomY + zoomHght;
			
			// detect click on zoom in (+) button
			if (s.mouseY >= zoomY  && s.mouseY <= middleY) {
				scale = Math.max(5000, scale - 5000);
			}
			
			// detect click on zoom out (-) button
			else if (s.mouseY >= middleY  && s.mouseY <= bottomY) {
				scale = Math.min(60000, scale + 5000);
			}
		}
		
		//detect click on camera for screenshot
		else if (s.mouseX <= camStartX && s.mouseX >= camStartX - camWdth && s.mouseY <= camStartY  && s.mouseY >= camStartY - camHght) {
			s.takeScreenShot();
		}
	}		

		
	s.mouseReleased = function() {		  
		dragging = false;		
	}
	
	
	s.takeScreenShot = function() {	
		//scroll into position
		screenShotSavedX = scrollBarX;
		scrollBarX = marginLeft; //for starting at beginning next cycle
		
		let srcX = marginLeft + 1;
		let srcY = marginTop
		let srcWidth = wdth - marginLeft - marginRight - 1; //get rid of border
		let srcHeight = hght - marginTop - marginBottom;
		
		//cover the camera icon up for 1 cycle for picture
		s.fill(backGroundClr);
		s.noStroke();
		s.rect(camStartX - camWdth - 1, camStartY - camHght - 1, camWdth + camCrnrRadius * 2, camHght + camCrnrRadius * 2);
		
		//create new screen shot
		screenShot.new(srcX, srcY, srcWidth, srcHeight, scale, totalTaskTime);
	}
	
	
	s.handleScreenShot = function () {
		if (screenShot.active && !screenShot.ready) {
			screenShot.addTo(); //compose the screen shot
			scrollBarX = s.scrollTimeToX(screenShot.sourceTime); //move the scroll bar ahead
		}
		
		if (screenShot.ready) {
			scrollBarX = screenShotSavedX;
		}
	}
	
	
	s.windowResized = function() {
		wdth = $( '#gantt_chart' ).width();
  		s.resizeCanvas( wdth, $('#gantt_chart').height() );
	}
	
}


var ganttChart = new p5(ganttSketch, 'gantt_chart');
