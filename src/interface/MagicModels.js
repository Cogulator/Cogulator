const MagicActions = {
	POINT: "point",
	HOVER: "hover",
	CLICK: "click", 
	POINTANDCLICK: "pointandclick",
	DRAGFROM: "dragfrom",
	DRAGTO: "dragto",
	TYPE: "type",
	KEYSTROKE: "keystroke",
	TOUCH: "touch",
	TAP: "tap",
	SWIPE: "swipe",
	HOME: "home",
	SPEECHRECSAY: "speechrecsay",
	SPEECHRECHEAR: "speechrechear",
	UNKNOWN: "unknown"
}


class MagicModelsManager {
	
	constructor() {
		this.selected = "desktop";
		this.visible = false;
		
		this.fitts = new FittsLaw();
		this.actions = [];
		this.speechRecMode = "none";
		this.handsPosition = "";
				
		//toggle magic models on wand click
		$( '#magic_button_container' ).click(function() {
			let visibility = $('#not_gantt_but_is_magic').css('visibility');
			if (visibility == "hidden") { //expand
				G.magicModels.show();
			} else { //collapse
				G.magicModels.hide();
			}
		});
		
		//close magic models on close button click
		$( '#close_magic_button').click(function() {
			G.magicModels.hide();
		});
		
		//on desktop select
		$('#mm_desktop_chi').click(function(){
			$('#mm_desktop_selected').html("<img src='images/mm_selector.png'>");
			$('#mm_iphone_selected').empty();
			G.magicModels.selected = "desktop";
		});
		
		//in iphone select
		$('#mm_iphone_chi').click(function(){
			$('#mm_desktop_selected').empty();
			$('#mm_iphone_selected').html("<img src='images/mm_selector.png'>");
			G.magicModels.selected = "iphone";
		});
	}
	
	
	run() {
		console.log("run");
		this.reset();
		$(document).on("keydown", G.magicModels.handleKeystroke );
	}
	
	
	pause() {
		console.log("pause")
		$(document).off("keydown", G.magicModels.handleKeystroke );
	}
	
	
	reset() {
		this.actions.length = 0;
		this.speechRecMode = "none";
		this.handsPosition = "";
	}

	
	handleKeystroke(evt) {
		if (G.magicModels.speechRecMode != "none") G.magicModels.handleSpeechRecKeystroke(evt.key);
		else 							 		   G.magicModels.handleKeyboardKeystroke(evt.key)
	}
	
	
	handleSpeechRecKeystroke(keyCode) {
		var lastAction = MagicActions.UNKNOWN;
		if (this.actions.length > 0) lastAction = this.actions[this.actions.length - 1].name;
		
		if (keyCode == "Return") { 
			if (lastAction == MagicActions.SPEECHRECHEAR) {
				//close out speech rec mode
				this.speechRecMode = "none";
			} else if (lastAction == MagicActions.SPEECHRECSAY) {
				//switch over to HEAR MODE
				this.speechRecMode = "hear";
			}
		} else {
			if (speechRecMode == "say") {
				this.add(MagicActions.SPEECHRECSAY, null, keyCode)
			} else if (speechRecMode == "hear") {
				this.add(MagicActions.SPEECHRECHEAR, null, keyCode)
			}
		}
	}
	
	
	handleKeyboardKeystroke(keyCode) {
		var lastAction = null
		if (this.actions.length > 0) lastAction = this.actions[this.actions.length - 1].name;
			
		if (keyCode == "Enter" || keyCode == "Shift") {
			if (this.selected == "desktop") this.add(MagicActions.KEYSTROKE, null, keyCode);
			else                       		this.add(MagicActions.TOUCH, null, keyCode);
		} else {
			if (this.selected == "desktop") this.add(MagicActions.TYPE, null, keyCode);
			else                      		this.add(MagicActions.TAP, null, keyCode);
		}
	}
	
	
	add(action, location = null, text = "") {
		this.actions.push({name: action, point: location});
		this.actionToGOMS(action, text);
	}
	
	
	addPointBased(action, location, distance) {
		console.log("ADD POINT BASED", action, location);
		this.actions.push({name: action, point: location});
		
		var t = 1000;
		if (action == MagicActions.POINTANDCLICK) t = this.fitts.pointAndClick(distance);
		else if (action == MagicActions.DRAGTO)   t = this.fitts.dragAndDrop(distance);
		else if (action == MagicActions.TOUCH)    t = this.fitts.pointAndTouch(distance);
		else if (action == MagicActions.SWIPE)    t = this.fitts.touchDrag(distance);
		else if (action == MagicActions.HOME)     t = this.fitts.pointAndTouch(distance);
		
		this.actionToGOMS(action, "", t);
	}
	
	
	actionToGOMS(action, text, fitts = null) {
		var actionGOMS = "";
		
		var lastAction = MagicActions.UNKNOWN;
		if (this.actions.length > 1) lastAction = this.actions[this.actions.length - 2].name;
			
		var timeModifier = "";
		if (fitts != null) timeModifier = "(" + parseInt(fitts) + " milliseconds) *Fitts Law Point Estimate";
		
		
		if (this.selected == "desktop") {
			if (this.handsPosition == "" && (action == MagicActions.TYPE || action == MagicActions.KEYSTROKE)) {
				this.handsPosition = "keyboard";
			} else if (this.handsPosition != "keyboard" && (action == MagicActions.TYPE || action == MagicActions.KEYSTROKE)) {
				this.handsPosition = "keyboard";
				actionGOMS = "Hands to keyboard \n "
			} else if (this.handsPosition != "mouse" && (action == MagicActions.POINTANDCLICK || action == MagicActions.DRAGFROM || action == MagicActions.DRAGTO)) {
				this.handsPosition = "mouse";
				actionGOMS = "Hands to mouse \n "
			}
			
			if (action == MagicActions.POINT) {
				actionGOMS += "\nLook at <" + this.actions.length + ">";
				actionGOMS += "\nPoint to <" + this.actions.length + "> " + timeModifier;
				actionGOMS += "\nCognitive_processor verify cursor over <" + this.actions.length + ">";
				actionGOMS += "\nIgnore <" + this.actions.length + ">";
			} else if (action == MagicActions.CLICK) {
				actionGOMS += "\nCognitive_processor verify cursor over <" + this.actions.length + ">";
				actionGOMS += "\nClick on <" + this.actions.length + ">";
				actionGOMS += "\nIgnore <" + this.actions.length + ">";
			} else if (action == MagicActions.POINTANDCLICK) {
				actionGOMS += "\nLook at <" + this.actions.length + ">";
				actionGOMS += "\nPoint to <" + this.actions.length + "> " + timeModifier;
				actionGOMS += "\nCognitive_processor verify cursor over <" + this.actions.length + ">";				
				actionGOMS += "\nClick on <" +  this.actions.length + ">";
				actionGOMS += "\nIgnore <" + this.actions.length + ">";
			} else if (action == MagicActions.DRAGFROM) {
				actionGOMS += "\nLook at <" + this.actions.length + ">";
				actionGOMS += "\nPoint to <" + this.actions.length + "> " + timeModifier;
				actionGOMS += "\nCognitive_processor verify cursor over <" + this.actions.length + ">";
				actionGOMS += "\nClick on <" + this.actions.length  + ">";
				actionGOMS += "\nIgnore <" + this.actions.length + ">";
			} else if (action == MagicActions.DRAGTO) {
				actionGOMS += "\nLook at <" + this.actions.length + ">";
				actionGOMS += "\nPoint to <" + this.actions.length + "> " + timeModifier;
				actionGOMS += "\nCognitive_processor verify cursor over <" + this.actions.length + ">";;				
				actionGOMS += "\nClick on <" + this.actions.length + ">";
				actionGOMS += "\nIgnore <" + this.actions.length + ">";
			} else if (action == MagicActions.TYPE) {
				if (lastAction != MagicActions.TYPE) actionGOMS += "\n " + "\nType ";
				actionGOMS += text;
			} else if (action == MagicActions.KEYSTROKE) {
				actionGOMS += "\nCognitive_processor verify correct";
				actionGOMS += "\nKeystroke ";
				actionGOMS += text;
			} 
		} 
		
		else if (this.selected == "iphone") {
			if (action == MagicActions.TOUCH) {
				actionGOMS += "\nLook at <" + this.actions.length + ">";
				actionGOMS += "\nCognitive_processor verify <" + this.actions.length + ">";				
				actionGOMS += "\nTouch <" + this.actions.length + ">";
				actionGOMS += "\nIgnore <" + this.actions.length + ">";
			} else if (action == MagicActions.SWIPE) {
				actionGOMS += "\nLook at <" + this.actions.length + ">";
				actionGOMS += "\nCognitive_processor <" + this.actions.length + ">";	
				actionGOMS += "\nTouch <" + this.actions.length + ">";
				actionGOMS += "\nSwipe on <" + this.actions.length + ">";
				actionGOMS += "\nIgnore <" + this.actions.length + ">";
			} else if (action == MagicActions.TAP) {
				if (lastAction != MagicActions.TAP) actionGOMS += "\n " + "\nTap ";
				actionGOMS += data;
			} else if (action == MagicActions.HOME) {
				actionGOMS += "\nLook at <Home " + this.actions.length + ">";
				actionGOMS += "\nCognitive_processor <Home " + this.actions.length + ">";	
				actionGOMS += "\nTouch <Home " + this.actions.length + ">";
				actionGOMS += "\nClick <Home " + this.actions.length + ">";
				actionGOMS += "\nIgnore <Home " + this.actions.length + ">";
			} else if (action == MagicActions.SPEECHRECSAY) {
				if (lastAction != MagicActions.SPEECHRECSAY) {
					actionGOMS += "\nLook at <Home " + this.actions.length + ">";
					actionGOMS += "\nCognitive_processor verify <Home " + this.actions.length + ">";	
					actionGOMS += "\nTouch <Home " + this.actions.length + ">";
					actionGOMS += "\nClick and hold <Home " + this.actions.length + ">";
					actionGOMS += "\nIgnore <Home " + this.actions.length + ">";
					actionGOMS += "\nWait for speech rec to start (1 seconds)";
					actionGOMS += "\nHear <start sound> (2 syllables)";
					actionGOMS += "\nIgnore <start sound>";
					actionGOMS += "\nSay ";
				}
				actionGOMS += text;
			} else if (action == MagicActions.SPEECHRECHEAR) {
				if (lastAction != MagicActions.SPEECHRECHEAR) {
					actionGOMS += "\nWait for system response (250 ms)";
					actionGOMS += "\nHear ";
				}
				actionGOMS += text;
			} 
		}
		
		console.log("ACTION GOMS", actionGOMS);
	}
	
	
	show() {
		$('#not_gantt_not_magic').css({ 'width': 'calc(100% - 356px'});
		$('#not_gantt_but_is_magic').css("visibility", "visible");
		$('#magic_button').html("<img src='images/magicOn.png'>");
		G.magicModels.visible = true;
		G.qutterManager.updateMarkers(); //at some point I'd rather do this by event listener in qutterManager
	}
	
	
	hide() {
		$('#not_gantt_not_magic').css('width', '100%');
		$('#not_gantt_but_is_magic').css("visibility", "hidden");
		$('#magic_button').html("<img src='images/magicOff.png'>");
		G.magicModels.visible = false;
		G.qutterManager.updateMarkers(); //at some point I'd rather do this by event listener in qutterManager
		//probably remove the sketch too...
	}

}
G.magicModels = new MagicModelsManager();




var magicModelsSketch = function(s) {
	var wdth = $( '#magic_box' ).width();
	var hght = $( '#magic_box' ).height();
	
	//selected CHI
	var selectedCHI = "desktop";
	
	//fonts
	var fontItalic;
	
	//images
	var desktop;
	var iphone;
	var currentImage;
	
	//image width/height
	let desktopWidth = 320;
	let desktopHeight = 246;
	let iphoneWidth = 154;
	let iphoneHeight = 256;
	var currentWidth = desktopWidth;
	var currentHeight = desktopHeight;
	
	//image screen width/height
	let desktopScreenWidth = 290;
	let desktopScreenHeight = 169;
	let iphoneScreenWidth = 134;
	let iphoneScreenHeight = 212;
	var currentScreenWidth = desktopScreenWidth;
	var currentScreenHeight = desktopScreenHeight;
	
	//image screen x/y
	let desktopScreenX = 15; //if image was at 0/0, top left screen X would be at 15
	let desktopScreenY = 15;
	let iphoneScreenX = 10;
	let iphoneScreenY = 10;
	var currentScreenX = desktopScreenX;
	var currentScreenY = desktopScreenY;
	
	//image positioning XY
	var currentTopLeftX = (wdth / 2) - (currentWidth / 2);
	var currentTopLeftY = (hght / 2) - (currentHeight / 2);
	var currentScreenTopLeftX = currentTopLeftX + desktopScreenX;
	var currentScreenTopLeftY = currentTopLeftY + desktopScreenY;

	//iphone home button
	let phoneHome = new Point(177, 334.5);
	let phoneHomeRadius = 10;
	
	//clear button position
	let buttonDiameter = 22;
	var clearButtonX = currentTopLeftX + currentWidth - (buttonDiameter / 2);
	var clearButtonY = currentScreenTopLeftY - (buttonDiameter * 2);
	
	//scrollbar
	let scrollBarWidth = 10;
	let scrollBarHeight = 30;
	let scrollBarX = currentScreenTopLeftX + currentScreenWidth - scrollBarWidth;
	var scrollBarY = currentScreenTopLeftY;
	var scrollBarTravel = currentScreenHeight - scrollBarHeight;
	
	var percentScreenShown = scrollBarHeight / currentScreenHeight; //percentage of total scrollable content showing
	var contentHeight = currentScreenHeight / percentScreenShown;
	var contentY = 0;
	var touchY = 0;
	var dragging = false;
	var dragOffset = 0;
	
	//colors
	let style = getComputedStyle(document.body);
	let	backGroundClr = style.getPropertyValue('--sidebar-right-bg-color');
	let	gridBckgrndClr = style.getPropertyValue('--main-bg-color');
	let buttonClr = style.getPropertyValue('--purple-color');
	let	gridLineClr = '#CCC';
	let scrollBarClr = '#999'
	let fontAndScaleClr = '#363A3B';
	
	//action tracking
	var clickStartTime = 0;
	var mouseDownXY = new Point(0,0);
	var lastMouseDownXY = mouseDownXY;
	var mouseUpXY = new Point(0,0);
	var mouseTarget = "";
	var typedText = "";
	
	//markers
	var markers = [];
	
	//loop control: things get laggy while looping, so only loop when focus is on magic box
	$( "#not_gantt_but_is_magic" ).hover(
		function() { //on over
			G.magicModels.run();
			s.loop();
		}, function() {
			G.magicModels.pause();
			s.noLoop();
		}
	);

	
	//load fonts and images
	s.preload = function() {
		fontItalic = s.loadFont('./style/fonts/Lato-Italic.ttf');
		desktop = s.loadImage('./images/desktop.png');
		iphone = s.loadImage('./images/iphone.png');
		currentImage = desktop;
	}
	
	
	s.setup = function() {
		s.createCanvas(wdth, hght);
		s.noLoop();
		s.textFont(fontItalic);
	}
	
	
	s.draw = function() {
		//the p5 renderer is evidently not quite ready on initial load. Try catch prevents 
		//try { 
			s.updateMarkers();
			s.drawBackground();
			if (selectedCHI != G.magicModels.selected) s.reset();
			s.setScrollBarY();
			s.drawGrid();
			s.drawMarkers();
			s.maskMarkers();
			s.setBackgroundImage();
			s.drawHomeMarkers();
			s.drawScrollBar();
			s.drawClearButton();
			
		//} catch(err) {}
	}
	
	
	s.updateMarkers = function() {
		if (G.magicModels.actions.length == 0) markers.length = 0;
		if (G.magicModels.actions.length > markers.length) {
			let delta = G.magicModels.actions.length - markers.length;
			for (var i = 0; i < delta; i++) {
				let index = G.magicModels.actions.length - delta - i;
				markers.push({name: G.magicModels.actions[index].name, point: G.magicModels.actions[index].point, contentY: contentY});
			}
		}
	}
	
	
	s.drawBackground = function() {
		//erase the canvas
		s.fill(backGroundClr);
		s.noStroke();
		s.rect(0,0,wdth,hght);
	}
	
	
	//clear all markers and set parameters for G.magicModels selected CHI
	s.reset = function() {
		if (G.magicModels.selected == "desktop") {
			currentWidth = desktopWidth;
			currentHeight = desktopHeight;
			
			currentScreenWidth = desktopScreenWidth;
			currentScreenHeight = desktopScreenHeight;

			currentScreenX = desktopScreenX;
			currentScreenY = desktopScreenY;

			currentImage = desktop;
			
		} else {
			currentWidth = iphoneWidth;
			currentHeight = iphoneHeight;
			
			currentScreenWidth = iphoneScreenWidth;
			currentScreenHeight = iphoneScreenHeight;

			currentScreenX = iphoneScreenX;
			currentScreenY = iphoneScreenY;
						
			currentImage = iphone;
		}
		
		currentTopLeftX = (wdth / 2) - (currentWidth / 2);
		currentTopLeftY = (hght / 2) - (currentHeight / 2);
		currentScreenTopLeftX = currentTopLeftX + currentScreenX;
		currentScreenTopLeftY = currentTopLeftY + currentScreenY;
		
		scrollBarX = currentScreenTopLeftX + currentScreenWidth - scrollBarWidth;
		scrollBarY = currentScreenTopLeftY;
		scrollBarTravel = currentScreenHeight - scrollBarHeight;
		
		percentScreenShown = scrollBarHeight / currentScreenHeight;
		contentHeight = currentScreenHeight / percentScreenShown;
		contentY = 0;
		
		clearButtonX = currentTopLeftX + currentWidth - (buttonDiameter / 2);
		clearButtonY = currentScreenTopLeftY - (buttonDiameter * 2);

		selectedCHI = G.magicModels.selected;
		s.clear();
	}
	
	
	s.clear = function() {
		G.magicModels.reset();
	}
	
	
	s.setScrollBarY = function() {
		if (dragging) {
			//for the desktop, you drag the scrollbar, so we change the scroll bar position here
			if (selectedCHI == "desktop") {
				if (dragging) scrollBarY = s.mouseY + dragOffset;
				scrollBarY = Math.max(scrollBarY, currentScreenTopLeftY);
				scrollBarY = Math.min(scrollBarY, currentScreenTopLeftY + currentScreenHeight - scrollBarHeight);
				
			//for the iphone, you drag the screen, so we change the content Y position here	
			} else if (selectedCHI == "iphone") {
				if (dragging) {
					let touchDelta = s.mouseY - touchY;
					contentY += touchDelta;
					contentY = Math.max(contentY, 0);
					contentY = Math.min(contentY, contentHeight);
					touchY = s.mouseY;
				}
			}
		}
	}
	
	
	s.drawGrid = function() {
		//background 
		s.noStroke();
		s.fill(gridBckgrndClr);
		s.rect(currentScreenTopLeftX, currentScreenTopLeftY, currentScreenWidth, currentScreenHeight);
		
		//setup to draw gridlines
		s.stroke(gridLineClr);
		s.strokeWeight(1);
		s.noFill();
		let lineSpacing = 40;
		
		//vertical lines
		for (var x = lineSpacing; x < currentScreenWidth; x += lineSpacing) {
			let lineX = currentScreenTopLeftX + x;
			s.line(lineX, currentScreenTopLeftY, lineX, currentScreenTopLeftY + currentScreenHeight);
		}
		
		//horizontal lines
		var contentPosition = contentY / contentHeight; //drag screen like iphone
		if (selectedCHI == "desktop") contentPosition = scrollBarY / scrollBarHeight;
		
		if (selectedCHI == "iphone") scrollBarY = currentScreenTopLeftY + (contentPosition * (currentScreenHeight - scrollBarHeight));
		else contentY = ( (scrollBarY - currentScreenTopLeftY) / scrollBarTravel) * contentHeight;
		
		
		
		let startY = contentY % lineSpacing;
		for (var y = startY; y < currentScreenHeight; y += lineSpacing) {
			let lineY = currentScreenTopLeftY + currentScreenHeight - y;
			s.line(currentScreenTopLeftX, lineY, currentScreenTopLeftX + currentScreenWidth, lineY);
		}
	}
	
	
	s.drawMarkers = function() {
		s.noStroke();
		s.fill(buttonClr);
		
		for (var i = 0; i < markers.length; i++) {
			let name = markers[i].name;
			let point = markers[i].point;
			let yAdjust = markers[i].contentY;
			
			let delta = contentY - yAdjust;
			let adjustedY = point.y - delta;
			
			if (name == MagicActions.POINTANDCLICK || name == MagicActions.TOUCH) {
				s.ellipse(point.x, adjustedY, buttonDiameter);
			} else if (name == MagicActions.DRAGFROM || name == MagicActions.DRAGTO) {
				s.rect(point.x, point.y, scrollBarWidth, scrollBarHeight);
			} else if (name == MagicActions.SWIPE) {
				let x = point.x - (buttonDiameter / 2)
				s.rect(x, adjustedY, buttonDiameter, buttonDiameter * 2, buttonDiameter);
			} 
		}
	}
	
	s.maskMarkers = function() {
		s.fill(backGroundClr);
		//top - bottom
		s.rect(currentScreenTopLeftX, currentScreenTopLeftY - currentScreenHeight, currentScreenWidth, currentScreenHeight);
		s.rect(currentScreenTopLeftX, currentScreenTopLeftY + currentScreenHeight, currentScreenWidth, currentScreenHeight);
		
		//left - right
		s.rect(currentScreenTopLeftX - currentScreenWidth, 0, currentScreenWidth, hght);
		s.rect(currentScreenTopLeftX + currentScreenWidth, 0, currentScreenWidth, hght);
	}
	
	
	s.setBackgroundImage = function() {
		s.image(currentImage, currentTopLeftX, currentTopLeftY);
	}
	
	
	s.drawHomeMarkers = function() {
		s.noStroke();
		s.fill(buttonClr);
		
		for (var i = 0; i < markers.length; i++) {
			let name = markers[i].name;
			let point = markers[i].point;
			if (name == MagicActions.HOME) s.ellipse(point.x, point.y, buttonDiameter);
		}
	}
	
	s.drawScrollBar = function() {
		s.noStroke();
		s.fill(scrollBarClr);
		s.rect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);
	}
	
	
	s.drawClearButton = function () {	
		//button background
		s.noStroke();
		s.fill(buttonClr);
		s.ellipse(clearButtonX, clearButtonY, buttonDiameter);
		
		s.noFill();
		s.stroke('#FFF');
		s.strokeWeight(2);
		
		//button icon <=|
		let iconHght = 8;
		let iconWdth = 8;
		
		//top right corner to start
		let vertexX = clearButtonX + (iconWdth / 2) + 1;
		let vertexY = clearButtonY - (iconHght / 2); 
		
		s.beginShape();
			s.vertex(vertexX, vertexY); //top right corner
		
			vertexY += iconHght;
			s.vertex(vertexX, vertexY); //bottom right corner
			
			vertexX -= iconWdth;
			s.vertex(vertexX, vertexY); //bottom left corner
		
			vertexX -= (iconWdth / 2);
			vertexY -= (iconHght / 2);
			s.vertex(vertexX, vertexY); //sharp point
		
			vertexX += (iconWdth / 2);
			vertexY -= (iconHght / 2);
			s.vertex(vertexX, vertexY); //top left corner
		
		s.endShape(s.CLOSE);
		
		s.fill('#AAA');
		s.noStroke();
		s.text("clear", clearButtonX - (buttonDiameter / 2) - 3, clearButtonY - buttonDiameter + 5);
	}
	
	
	s.mousePressed = function() {
		lastMouseDownXY = mouseDownXY
		mouseDownXY = new Point(s.mouseX, s.mouseY);
		console.log("DOWN", mouseDownXY);
		
		let d = new Date();
		clickStartTime = d.getTime();
		
		// if iphone, allow dragging of screen
		if (selectedCHI == "iphone" && s.mouseX >= currentScreenTopLeftX && s.mouseX <= currentScreenTopLeftX + currentScreenWidth && s.mouseY >= currentScreenTopLeftY  && s.mouseY <= currentScreenTopLeftY + currentScreenHeight) {
			dragging = true;
			touchY = s.mouseY;
			mouseTarget = "phone_screen";
		}
		
		else if (selectedCHI == "iphone" && s.dist(phoneHome.x, phoneHome.y, s.mouseX, s.mouseY) <= phoneHomeRadius) {
			mouseTarget = "phone_home";
		}
		
		// allow dragging scrollbar		  
		else if (selectedCHI == "desktop" && s.mouseX >= scrollBarX && s.mouseX <= scrollBarX + scrollBarWidth && s.mouseY >= scrollBarY  && s.mouseY <= scrollBarY + scrollBarHeight) {
			dragging = true;
			dragOffset = scrollBarY - s.mouseY;
			mouseTarget = "desktop_scroll_bar";
			
			let d = s.mappedDistance(lastMouseDownXY, mouseDownXY);
			let barPnt = new Point(scrollBarX, scrollBarY);
			G.magicModels.addPointBased(MagicActions.DRAGFROM, barPnt, d);
		}
		
		// allow clicking with mouse 		  
		else if (selectedCHI == "desktop" && s.mouseX >= currentScreenTopLeftX && s.mouseX <= currentScreenTopLeftX + currentScreenWidth && s.mouseY >= currentScreenTopLeftY  && s.mouseY <= currentScreenTopLeftY + currentScreenHeight) {
			mouseTarget = "desktop_screen";
		}
		
		//detect click on clear button
		else if (s.dist(clearButtonX, clearButtonY, s.mouseX, s.mouseY) <= buttonDiameter / 2) {
			s.clear();
		}
	}		

	
	s.mouseReleased = function() {
		mouseUpXY = new Point(s.mouseX, s.mouseY);
		console.log("UP", mouseUpXY);
		let d = new Date();
		let elapsedTime = d.getTime() - clickStartTime;
		
		dragging = false;
		
		if (selectedCHI == "iphone" && s.mouseX >= currentScreenTopLeftX && s.mouseX <= currentScreenTopLeftX + currentScreenWidth && s.mouseY >= currentScreenTopLeftY  && s.mouseY <= currentScreenTopLeftY + currentScreenHeight) {
			G.magicModels.speechRecMode = "none";
			if (mouseTarget == "phone_screen") {
				if (mouseDownXY.equals(mouseUpXY)) {
					let d = s.mappedDistance(lastMouseDownXY, mouseDownXY);
					G.magicModels.addPointBased(MagicActions.TOUCH, mouseDownXY, d);
				} else {
					let d = s.mappedDistance(mouseDownXY, mouseUpXY);
					G.magicModels.addPointBased(MagicActions.SWIPE, mouseUpXY, d);
				}
			}
		}
		
		else if (selectedCHI == "iphone" && s.dist(phoneHome.x, phoneHome.y, s.mouseX, s.mouseY) <= phoneHomeRadius) {
			if (mouseTarget = "phone_home") {
				let d = s.mappedDistance(lastMouseDownXY, mouseDownXY);
				let homePnt = new Point(phoneHome.x, phoneHome.y);
				
				if (elapsedTime > 1000) {
					G.magicModels.speechRecMode  = "Say";
					G.magicModels.addPointBased(MagicActions.SPEECHRECSAY, homePnt, d);
				}
				else {
					G.magicModels.speechRecMode  = "none";
					G.magicModels.addPointBased(MagicActions.HOME, homePnt, d);
				}
			} 
		}
		
		// allow dragging of screen		  
		else if (selectedCHI == "desktop" && s.mouseX >= scrollBarX && s.mouseX <= scrollBarX + scrollBarWidth && s.mouseY >= scrollBarY  && s.mouseY <= scrollBarY + scrollBarHeight) {
			G.magicModels.speechRecMode = "none";
			if (mouseTarget == "desktop_scroll_bar")  {
				let lastAction = G.magicModels.actions[G.magicModels.actions.length - 1]
				if (G.magicModels.actions.length > 0 && lastAction == MagicActions.DRAGFROM) {
					let d = s.mappedDistance(mouseDownXY, mouseUpXY);
					let barPnt = new Point(scrollBarX, scrollBarY);
					G.magicModels.addPointBased(MagicActions.DRAGTO, barPnt, d);
				}
			}
		}
		
		
		// allow dragging of screen		  
		else if (selectedCHI == "desktop" && s.mouseX >= currentScreenTopLeftX && s.mouseX <= currentScreenTopLeftX + currentScreenWidth && s.mouseY >= currentScreenTopLeftY  && s.mouseY <= currentScreenTopLeftY + currentScreenHeight) {
			G.magicModels.speechRecMode = "none";
			let lastAction = G.magicModels.actions[G.magicModels.actions.length - 1]
			if (G.magicModels.actions.length > 0 && lastAction == MagicActions.DRAGFROM) {
				let d = s.mappedDistance(mouseDownXY, mouseUpXY);
				let barPnt = new Point(scrollBarX, scrollBarY);
				G.magicModels.addPointBased(MagicActions.DRAGTO, barPnt, d);
			} else if (mouseTarget == "desktop_screen")  {
				let d = s.mappedDistance(lastMouseDownXY, mouseDownXY);
				G.magicModels.addPointBased(MagicActions.POINTANDCLICK, mouseUpXY, d);
			}
		}
		

		mouseTarget = "";
	}
	

	s.mappedDistance = function(startPoint, endPoint) {
		var startX = startPoint.x - currentScreenTopLeftX; //reference to 0,0
		var startY = startPoint.y - currentScreenTopLeftY; 
		var endX   = endPoint.x   - currentScreenTopLeftX
		var endY   = endPoint.y   - currentScreenTopLeftY;
		
		if (selectedCHI == "desktop") {
			startX = s.map(startPoint.x, 0, currentScreenWidth,  0, 1366);
			startY = s.map(startPoint.y, 0, currentScreenHeight, 0, 768);
			endX   = s.map(endPoint.x,   0, currentScreenWidth,  0, 1366);
			endY   = s.map(endPoint.y,   0, currentScreenHeight, 0, 768);
			return s.dist(startX, startY, endX, endY);
		} else {
			startX = s.map(startPoint.x, 0, currentScreenWidth,  0, 750);
			startY = s.map(startPoint.y, 0, currentScreenHeight, 0, 1334);
			endX   = s.map(endPoint.x,   0, currentScreenWidth,  0, 750);
			endY   = s.map(endPoint.y,   0, currentScreenHeight, 0, 1334);
			return s.dist(startX, startY, endX, endY);
		}
	}
	
}
var magicModels = new p5(magicModelsSketch, 'magic_box');