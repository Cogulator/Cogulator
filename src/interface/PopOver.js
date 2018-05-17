class PopOver {
	
	constructor(divID) {
		this.divID = divID;
		this.hide();
	}
	

	show(message, offset) {
		let top = offset.top + 22;
		let left = offset.left + 35;
		
		$(this.divID).text(message);
		$(this.divID).offset({top: top, left: left});
		$(this.divID).css({"visibility": "visible"});
		
	}
	
	
	hide() {
		$(this.divID).css({"visibility": "hidden"});
	}

}

G.errorPopOver = new PopOver('#error_message_popover');
	   
	   
	   
	   
	   