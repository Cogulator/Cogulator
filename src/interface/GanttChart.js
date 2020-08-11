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
				//show
				if ( $( window ).height() < 950 ) G.magicModels.hide();
				$('#gantt_container').animate({bottom:'0px'},"slow", function() {
					$('#not_gantt_container').addClass('partial_height').removeClass('full_height');
					$( '#gantt_button_text' ).addClass('rotate_180').removeClass('rotate_0');
				 });
				$('#gantt_button').animate({bottom:'450px'}, "slow");
				//hide
			} else {
				$('#not_gantt_container').addClass('full_height').removeClass('partial_height');
				$('#gantt_container').animate({bottom:'-450px'}, "slow", function() {
					$( '#gantt_button_text' ).addClass('rotate_0').removeClass('rotate_180');
				});
				$('#gantt_button').animate({bottom:'0px'}, "slow");
				
			}
		});
	}

	openChart() {
		if( $('#gantt_container').css('bottom') == '-450px'){
			//show
			if ( $( window ).height() < 950 ) G.magicModels.hide();
			$('#gantt_container').animate({bottom:'0px'},"slow", function() {
				$('#not_gantt_container').addClass('partial_height').removeClass('full_height');
				$( '#gantt_button_text' ).addClass('rotate_180').removeClass('rotate_0');
			 });
			$('#gantt_button').animate({bottom:'450px'}, "slow");
		}
	}
	
	//used by MagicModels to close Gantt if not enough room
	close() {
		if( $('#gantt_container').css('bottom') != '-450px'){
			$('#not_gantt_container').addClass('full_height').removeClass('partial_height');
			$('#gantt_container').animate({bottom:'-450px'}, "slow", function() {
				$( '#gantt_button_text' ).addClass('rotate_0').removeClass('rotate_180');
			});
			$('#gantt_button').animate({bottom:'0px'}, "slow");
		}
	}
}
    
G.ganttManager = new GanttManager();



function GanttRect (name, id, x, y, w, h) {
	this.name = name;
	this.id = id;
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;

    this.contains = function (x, y) {
        return this.x <= x && x <= this.x + this.width &&
               this.y <= y && y <= this.y + this.height;
    }
}


var ganttSketch = function(s) {
    var wdth = $( '#gantt_chart' ).width();
    var hght = $( '#gantt_chart' ).height();

    var hoverChunk = undefined;

    //screenshots
    var screenShot;
    var screenShotSavedX = 0;

    //fonts
    var fontRegular;
    var fontLight;
    var fontBold;
    var fontItalic;

    //images
    var cpmLabelDark;
    var cpmLabelLight;

    //scale & time
    var scaleTarget = 5000 //ms
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

    //chunk info pane
    let chunkInfoPaneX = marginLeft + 6;
    let chunkInfoPaneY = timeLineY - (marginBottom/2) + 4;
    let chunkInfoPaneWidth = 770;
    let chunkInfoPaneHeight = 20;

    //colors
    var style = getComputedStyle(document.body);
    var	backGroundClr = style.getPropertyValue('--main-bg-color');
    var	stripeClr = style.getPropertyValue('--gantt-stripe-color');
    var	borderClr =  style.getPropertyValue('--gantt-border-color');
    var fontAndScaleClr = style.getPropertyValue('--model-button-txt-color'); 
    var chunkInfoPaneBackground = style.getPropertyValue('--main-bg-color');
    var shadowClr = style.getPropertyValue('--gantt-text-shadow-color'); 
    var palette = [fontAndScaleClr,'#DC322F', '#2AA198', '#6C71C4','#859900', '#CB4B16'];  // Alternate syntax

    //loop control: things get laggy while looping, so only loop when focus is on gantt container
    let mouseOverGantt = false;
    $( "#gantt_container" ).hover(
        function() { //on over
            mouseOverGantt = true;
            // s.loopOn();
        }, function() {
            mouseOverGantt = false;
            s.loopOff //this can be on mouseout once we're sure it's working
        }
    );

    $( document ).on( "Dark_Mode_Change", function() {
        style = getComputedStyle(document.body);
        backGroundClr = style.getPropertyValue('--main-bg-color');
        stripeClr = style.getPropertyValue('--gantt-stripe-color');
        borderClr =  style.getPropertyValue('--gantt-border-color');
        fontAndScaleClr = style.getPropertyValue('--model-button-txt-color'); 
        chunkInfoPaneBackground = style.getPropertyValue('--main-bg-color');
        shadowClr = style.getPropertyValue('--gantt-text-shadow-color'); 
        palette = [fontAndScaleClr,'#DC322F', '#2AA198', '#6C71C4','#859900', '#CB4B16'];  // Alternate syntax

        s.draw();
    });

    let looping = false;
    let timer;
    $( "#gantt_container" ).mousedown(function() {
        s.loopOn();
    });
    $( "#gantt_container" ).mouseup(function() {
        timer = window.setTimeout(s.loopOff, 5000);
    });

    $( document ).on( "GANTT_OPEN", function(evt, time) {
        G.ganttManager.openChart();
        scrollBarX = s.scrollTimeToX(time);
        s.draw();
    });

    //loop control: one loop to update chart, in case not already looping
    $( document ).on( "Subjective_Workload_Processed", function(evt, taskTimeMS) {
        s.draw();
    });

    s.loopOn = function() {
        window.clearTimeout(timer)
        if (!looping) {
            s.loop();
            looping = true;
        }
    }

    s.loopOff = function() {
        looping = false;
        s.noLoop()
    }

    //load fonts
    s.preload = function() {
        fontRegular = s.loadFont('./style/fonts/Lato-Regular.ttf');
        fontLight = s.loadFont('./style/fonts/Lato-Light.ttf');
        fontBold = s.loadFont('./style/fonts/Lato-Bold.ttf');
        fontItalic = s.loadFont('./style/fonts/Lato-Italic.ttf');
        
        cpmLabelDark = s.loadImage('./images/CPM_Dark.png');
        cpmLabelLight = s.loadImage('./images/CPM.png');
    }


    s.setup = function() {
        s.createCanvas(wdth, hght);
        s.noLoop();
        screenShot = new ScreenShotManager(document.getElementsByClassName("p5Canvas")[0]);
    }


    s.draw = function() {
        //the p5 renderer is evidently not quite ready on initial load. Try catch prevents 
        try {
            s.setScale();			
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

                s.drawChunkInfoPane();
            }
        } catch(err) {}
    }

    s.setScale = function() {
        if (scale < scaleTarget) scale += 1000;
        if (scale > scaleTarget) scale -= 1000;
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
        s.text(Math.round(totalTaskTime / 100) / 10, marginLeft + timeLineWidth - centerText, timeLineY + belowLine);

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
        G.windowStartTime = windowStartTime;

        s.calculateWorkload();
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
        if (G.darkLightManager.isDark) s.image(cpmLabelDark,25,marginTop + 10);
        else                           s.image(cpmLabelLight,25,marginTop + 10);
        
    }


    s.drawGantt = function(windowStartTime) {
        s.textAlign(s.LEFT);

        G.ganttLines = [];

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
                s.fill(fontAndScaleClr);

                let step = threadSteps[i];
                var startTime = step.startTime;
                var endTime = step.endTime;

                if (step.operator == "wait") continue;

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

                    if (nextStep.operator != "wait") {
                        let nextY = s.resourceY(nextStep.resource);

                        if (stepY == nextY) 	s.line(stepX2, stepY - tickHeight, stepX2, stepY + tickHeight);
                        else if (stepY < nextY) s.line(stepX2, stepY - tickHeight, stepX2, nextY + tickHeight);
                        else 					s.line(stepX2, stepY + tickHeight, stepX2, nextY - tickHeight);
                    }
                } else {
                    s.line(stepX2, stepY - tickHeight, stepX2, stepY + tickHeight);
                }

                let ganttRect = undefined;

                //add the label
                s.noStroke();
                if (s.textWidth(step.time) < stepX2 - stepX1 - 20) {
                    s.text(step.time, stepX1 + tickHeight, stepY - 3);
                    ganttRect = new GanttRect(step, "", 0, 0, 0, 0);
                    ganttRect.x = stepX1;
                    ganttRect.y = stepY - 18;
                } 

                let operatorLabel = s.fitTextToSpace(step.operator, stepX2 - stepX1 - 15)
                if (operatorLabel != "") {
                    s.text(operatorLabel, stepX1 + tickHeight, stepY + 15);

                    if (ganttRect != undefined) {
                        let gWidth = step.time;
                        ganttRect.width = stepX2 - stepX1;
                        ganttRect.height = (stepY + 15) - ganttRect.y + 5;
                        G.ganttLines.push(ganttRect);

                        //highlight the rect if the user's mouse is currently over it
                        if (ganttRect.contains(s.mouseX, s.mouseY)) {
                            //s.fill(0,0,0,25);
                            if (G.darkLightManager.isDark) s.fill(255,255,255,25);
                            else                           s.fill(0,0,0,25);
                            s.rect(stepX1, ganttRect.y, ganttRect.width, ganttRect.height, 5);
                        }
                    }
                }

            }

            colorIndex++;
            if (colorIndex > palette.length - 1) colorIndex = 0;
        }
    }

    s.calculateWorkload = function() {
        let memory = G.memory.workingmemory;

        for (var i = 0; i < memory.length; i++) {

            let stack = memory[i];
            let workload = 0.0;

            for (var j = 0; j < stack.length; j++) {
                let chunk = stack[j];

                let load = parseFloat(G.workload.getWorkload(chunk.activation));
                chunk.workload = load;

                if (!isNaN(load)) {
                    if(load > workload) workload = load;
                }
            }

        }
    }

    s.drawMemory = function(windowStartTime) {
        let memory = G.memory.workingmemory;
        let timeLineY = marginTop + (rowHeight * 6);
        let chunkHeight = tickHeight;
        let chunkWidth = cycleTime * (timeLineWidth / scale); //cycle time * pixelsPerMS

        s.stroke(backGroundClr);

        //gantt chart edges
        let ganttLeftEdge = marginLeft + 1;
        let ganttWidth = wdth - marginLeft - marginRight - 1; //get rid of border

        G.memoryChunks = [];

        for (var i = 0; i < memory.length; i++) {
            let stack = memory[i];
            let stackTime = i * cycleTime;
            let stackX = s.ganttTimeToX(stackTime, windowStartTime);

            if(stackX < (ganttLeftEdge - 10)) continue;
            if(stackX > (ganttLeftEdge + ganttWidth)) break;

            let time = i * 50;

            for (var j = 0; j < stack.length; j++) {
                let chunk = stack[j];
                let chunkY = timeLineY - (j * chunkHeight) - chunkHeight; 
                let chunkClr = s.colorAlpha(chunk.color, s.map(chunk.probabilityOfRecall,0.5,1,0,1));
                s.fill(chunkClr);
                s.rect(stackX, chunkY, chunkWidth, chunkHeight);

                chunk.time = time;
                G.memoryChunks.push(new GanttRect(chunk, i + "-" + j, stackX, chunkY, chunkWidth, chunkHeight));
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
                    s.stroke(shadowClr);
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
        s.stroke(fontAndScaleClr);
        s.fill(fontAndScaleClr);

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
                scaleTarget = Math.max(1000, scale - 5000);
            }

            // detect click on zoom out (-) button
            else if (s.mouseY >= middleY  && s.mouseY <= bottomY) {
                scaleTarget = Math.min(60000, scale + 5000);
            }
        }

        //detect click on camera for screenshot
        else if (s.mouseX <= camStartX && s.mouseX >= camStartX - camWdth && s.mouseY <= camStartY  && s.mouseY >= camStartY - camHght) {
            s.takeScreenShot();
        }
    }		


    s.mouseReleased = function() {		  
        dragging = false;
        s.loopOff();

        for (var i = 0; i < G.ganttLines.length; i++) {
            if (G.ganttLines[i].contains(s.mouseX, s.mouseY)) {
                //the step is stored in the chunk member here
                G.quillManager.selectLine(G.ganttLines[i].name.lineNo);
                break;
            }
        }

        for (var i = 0; i < G.memoryChunks.length; i++) {
            if(G.memoryChunks[i].contains(s.mouseX, s.mouseY)) {
                G.quillManager.selectLine(G.memoryChunks[i].name.lineNumber);
                break;
            }
        }
    }

    s.mouseMoved = function () {
        if (mouseOverGantt) {
            hoverChunk = undefined;
            if (G.memoryChunks) {
                for (var i = 0; i < G.memoryChunks.length; i++) {
                    if (G.memoryChunks[i].contains(s.mouseX, s.mouseY)) {
                        hoverChunk = G.memoryChunks[i];
                        break;
                    }

                    if (G.memoryChunks[i].x > s.mouseX) break;
                }
            }

            s.drawChunkInfoPane();
            s.draw();
        }
    }


    s.mouseWheel = function(evt) {
        if (mouseOverGantt) {
            s.loopOn();
            timer = window.setTimeout(s.loopOff, 1000);

            if (evt.delta < 0) scaleTarget = Math.max(1000, scale - 5000);
            else 			   scaleTarget = Math.min(60000, scale + 5000);
        }
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

    s.drawChunkInfoPane = function () {
        if (hoverChunk == undefined) return;

        //sizing
        let infoY = 275;
        let infoWidth = 155;
        let infoHeight = 90;

        //draw connecting line
        var ex = hoverChunk.x + hoverChunk.width / 2;
        var why = hoverChunk.y + hoverChunk.height / 2;
        s.stroke(hoverChunk.name.color);
        s.line(ex, why, ex, infoY);


        let infoX = Math.min(ex - infoWidth / 2, wdth - infoWidth - marginRight - 2);

        s.push();
        s.translate(infoX, infoY - infoHeight);

        //draw background
            s.fill(backGroundClr);
            s.rect(0, 0, infoWidth, infoHeight, 3);
            s.fill( s.colorAlpha(hoverChunk.name.color, 0.03) ); //shade background
            s.rect(0, 0, infoWidth, infoHeight, 3);

        //draw labels
            let leftX = 5;
            let rightX = infoWidth - 5;

            let rowOneY = 25;
            let rowTwoY = 55;
            let rowThreeY = 85;

            s.fill(fontAndScaleClr);
            s.noStroke();
            s.textFont(fontItalic);
            s.textSize(10);

            //left side
            s.textAlign(s.LEFT);
            s.text("chunk name", leftX, rowOneY); //row 1
            s.text("activation", leftX, rowTwoY); //row 2 left
            s.text("time in memory", leftX, rowThreeY); //row 3 left

            //right side
            s.textAlign(s.RIGHT);
            s.text("recall probability", rightX, rowTwoY);
            s.text("rehearsals", rightX, rowThreeY);

        //draw values
            let recall = Number.parseInt(Number.parseFloat(hoverChunk.name.probabilityOfRecall).toPrecision(3) * 100)
            let rehearsals = hoverChunk.name.rehearsals
            let timeInMemory = hoverChunk.name.time - hoverChunk.name.addedAt; //milliseconds
            let activation = Math.log(rehearsals/Math.sqrt(timeInMemory / 1000)); //activation 

            s.textSize(13);

            //left side
            //- chunk name
            s.textAlign(s.LEFT);
            s.fill(hoverChunk.name.color);
            s.textFont(fontBold);
            s.text(hoverChunk.name.chunkName, leftX, rowOneY - 10); 

            //- activation
            s.fill(fontAndScaleClr);
            s.textFont(fontRegular);

            if (activation != undefined) s.text(activation.toFixed(3), leftX, rowTwoY - 10); 
            else                         s.text("?", leftX, rowTwoY - 10);

            //- time in memory
            s.text(timeInMemory + "ms", leftX, rowThreeY - 10);

            //right side
            s.textAlign(s.RIGHT);
            s.text(recall + "%", rightX, rowTwoY - 10);
            s.text(hoverChunk.name.rehearsals, rightX, rowThreeY - 10);

        //draw pie chart
            s.fill(hoverChunk.name.color);
            s.arc(infoWidth - 20, 15, 20, 20, s.radians(1), s.radians(hoverChunk.name.probabilityOfRecall * 360));

        s.pop();
    }


    s.windowResized = function() {
        wdth = $( '#gantt_chart' ).width();
        s.resizeCanvas( wdth, $('#gantt_chart').height() );
    }
}

var ganttChart = new p5(ganttSketch, 'gantt_chart');;
