class PopOverFix {
	
	constructor(divID) {
		this.divID = divID;
		this.hide();
		this.fixText = "";
		this.lineNo = 0;
	}
	
	show(offset, fix, lineNo) {
		this.fixText = fix;
		this.lineNo = lineNo;
		
		let top = offset.top - 5;
		let left = offset.left - 9;
		
		$(this.divID).offset({top: top, left: left});
		$(this.divID).css({"visibility": "visible"});
		
	}
	
	hide() {
		$(this.divID).css({"visibility": "hidden"});
	}
	
	fix() {
		G.quillManager.insertIndentedTextAtLine(this.fixText + "\n", this.lineNo);
	}
}

G.fixPopOver = new PopOverFix('#fixable_tip_popover');