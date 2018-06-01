class MagicModelsManager {
	
	constructor() {
		this.selected = "desktop";
		this.visible = false;
		
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
	
	//clear button position
	let buttonDiameter = 22;
	var clearButtonX = currentTopLeftX + currentWidth - (buttonDiameter / 2);
	var clearButtonY = currentScreenTopLeftY - (buttonDiameter * 2);
	
	//scrollbar
	let scrollBarWidth = 10;
	let scrollBarHeight = 30;
	let scrollBarX = currentScreenTopLeftX + currentScreenWidth - scrollBarWidth;
	var scrollBarY = currentScreenTopLeftY;
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
	
	//loop control: things get laggy while looping, so only loop when focus is on magic box
	$( "#not_gantt_but_is_magic" ).hover(
		function() { //on over
			s.loop();
		}, function() {
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
			s.drawBackground();
			if (selectedCHI != G.magicModels.selected) s.reset();
			s.setScrollBarY();
			s.drawGrid();
			s.setBackgroundImage();
			s.drawMarkers();
			s.drawScrollBar();
			s.drawClearButton();
			
		//} catch(err) {}
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
		percentScreenShown = scrollBarHeight / currentScreenHeight;
		contentHeight = currentScreenHeight / percentScreenShown;
		contentY = 0;
		
		clearButtonX = currentTopLeftX + currentWidth - (buttonDiameter / 2);
		clearButtonY = currentScreenTopLeftY - (buttonDiameter * 2);

		selectedCHI = G.magicModels.selected;
		s.clear();
	}
	
	
	s.clear = function() {
		console.log("CLEAR");
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
		else contentY = contentHeight * contentPosition;
		
		let startY = contentY % lineSpacing;
		for (var y = startY; y < currentScreenHeight; y += lineSpacing) {
			let lineY = currentScreenTopLeftY + y;
			s.line(currentScreenTopLeftX, lineY, currentScreenTopLeftX + currentScreenWidth, lineY);
		}
	}
	
	
	s.setBackgroundImage = function() {
		s.image(currentImage, currentTopLeftX, currentTopLeftY);
	}
	
	
	s.drawMarkers = function() {
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
		// if iphone, allow dragging of screen
		if (selectedCHI == "iphone" && s.mouseX >= currentScreenTopLeftX && s.mouseX <= currentScreenTopLeftX + currentScreenWidth && s.mouseY >= currentScreenTopLeftY  && s.mouseY <= currentScreenTopLeftY + currentScreenHeight) {
			dragging = true;
			touchY = s.mouseY;
		}
		
		// allow dragging of screen		  
		else if (selectedCHI == "desktop" && s.mouseX >= scrollBarX && s.mouseX <= scrollBarX + scrollBarWidth && s.mouseY >= scrollBarY  && s.mouseY <= scrollBarY + scrollBarHeight) {
			dragging = true;
			dragOffset = scrollBarY - s.mouseY;
		}
		
		//detect click on clear button
		else if (s.dist(clearButtonX, clearButtonY, s.mouseX, s.mouseY) <= buttonDiameter / 2) {
			s.clear();
		}
	}		

	s.mouseReleased = function() {		  
		dragging = false;	
	}
	
}
var magicModels = new p5(magicModelsSketch, 'magic_box');