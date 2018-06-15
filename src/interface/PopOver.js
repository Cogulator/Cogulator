class PopOver {
	
	constructor(divID) {
		this.divID = divID;
		this.hide();
	}
	
	
	//called by QutterManager.js, which creates the popover buttons in the gutter
	show(message, offset, backgroundColor) {
		let top = offset.top + 22;
		let left = offset.left + 35;
		
		$(this.divID).text(message);
		$(this.divID).offset({top: top, left: left});
		$(this.divID).css({"background": backgroundColor});
		$(this.divID).css({"visibility": "visible"});
		
	}
	
	//called by QutterManager.js, which creates the popover buttons in the gutter
	hide() {
		$(this.divID).css({"visibility": "hidden"});
	}

}

G.errorPopOver = new PopOver('#error_message_popover');
	   
	   
	   
	   
	   