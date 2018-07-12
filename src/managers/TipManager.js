class Tip {
	//types
	//  operator_error
	//  time_modifier_error
	constructor(type, lineNo) {
		this.type = type; //
		this.lineNo = lineNo;
		this.hint = this.getHint(this.type); //
		this.fix = this.getFix(this.type);
		this.id = this.lineNo + "_" + this.type;
	}
	
	getHint(type) {
		switch(type) {
			case "missing_label":
				return "Typically this operator is followed by a label. The label is used to calculate operator time."
			case "hands_to_mouse":
				return "Doesn&#39;t look like the hands are on the mouse."; //add fix to end
			case "hands_to_keyboard":
				return "Doesn&#39;t look like the hands are on the keyboard."; //add fix to end
			case "eyes_to_target":
				return "Typically a Look precedes this operator."; //add fix to end 
			case "missing_point":
				return "Typically there&#39;s a Point before the Click."; //add fix to end
			default:
				return "";
		}
	}
	
	getFix(type) {
		switch(type) {
			case "missing_label":
				return ""
			case "hands_to_mouse":
				return "Hands to mouse"; //add fix to end
			case "hands_to_keyboard":
				return "Hands to keyboard"; //add fix to end
			case "eyes_to_target":
				return "Look at target"; //add fix to end 
			case "missing_point":
				return "Point to target"; //add fix to end
			default:
				return "";
		}
	}
}


class TipManager {
	constructor() {
		this.tips = [];
		
		$( document ).on( "GOMS_Process_Started", function() {
		  	G.tipManager.tips.length = 0;
		});
		
		$( document ).on( "Memory_Processed", function(evt, taskTimeMS) {
		  	G.tipManager.updateTips();
		});
	}
	
	updateTips() {
		this.tips.length = 0;
		
		//loop through the model and determine if you need to add any hints
		var lookNotTakenByPointOrTouch = false;
		var pointNotTakenByClick = false;
		var handsLocation = null; 
		
		for (var i = 0; i < G.gomsProcessor.intersteps.length; i++) {
			let step = G.gomsProcessor.intersteps[i];

			if ( (step.operator == "say" || step.operator == "hear") && step.label == "") {
				let tip = new Tip("missing_label", step.lineNo);
				this.tips.push(tip);
			} else if (step.operator == "type" && step.label == "") {
				let tip = new Tip("missing_label", step.lineNo);
				this.tips.push(tip);
			}

			if (step.resource == "hands") {
				if (handsLocation == null && step.operator != "hands") {
					if (step.operator == "point" || step.operator == "click") handsLocation = "mouse";
					else handsLocation = "keyboard";
				} else if (step.operator == "hands") { //operator rather than resource 
					handsLocation = null //setting to null allows to work without setting location in label
				} else if ((step.operator == "point" || step.operator == "click") && handsLocation == "keyboard") {
					let tip = new Tip("hands_to_mouse", step.lineNo);
					this.tips.push(tip);
				} else if ((step.operator == "keystroke" || step.operator == "type") && handsLocation == "mouse"){
					let tip = new Tip("hands_to_keyboard", step.lineNo);
					this.tips.push(tip);
				}
			}

			if (step.operator == "look" || step.operator == "search") {
				lookNotTakenByPointOrTouch = true;
			} else if (step.operator == "point" || step.operator == "touch") {
				if (lookNotTakenByPointOrTouch) lookNotTakenByPointOrTouch = false;
				else this.tips.push(new Tip("eyes_to_target", step.lineNo));
				
				if (step.operator == "point") pointNotTakenByClick = true;
			} else if (step.operator == "click") {
				if (pointNotTakenByClick) pointNotTakenByClick = false;
				else this.tips.push(new Tip("missing_point", step.lineNo));
			}
		}
				
		G.qutterManager.updateMarkers();
	}
									
	
	fixIt(tip) {
		switch(tip.type) {
			case "hands_to_mouse":
				break;
			case "hands_to_keyboard":
				break;
			case "eyes_to_target":
				break;
			case "missing_point":
				break;
		}
	}
	
	
}
				
G.tipManager = new TipManager();