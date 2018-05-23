let Delta = Quill.import('delta');

class InsertionCHI {
	constructor() {
		this.deleteIndex = 0;
		this.hiddening = false; //that's right, hiddening
		this.showring = false;
		
		//hide if click on anything other than insertion chi, show if click on insertion marker
		$(document).bind('click', function(e) {
			if (e.target.className.includes("insertion_marker")) {
				let lineNumber = $(this).data("line");
				G.insertionCHI.show(lineNumber);
				return;
			}
			
			if (!G.insertionCHI.targetIsThis(e.target)) G.insertionCHI.hide();
		});
		
		//set up to hide on resize or scroll
		$( window ).resize(function() {
			if ( $('#insertion_chi_container').css("display") != "none" )  {
				G.insertionCHI.setPosition();
			}
		});
		
		$(document).on('mousewheel', function(e){
			if ( $('#insertion_chi_container').css("display") != "none" )  {
				G.insertionCHI.setPosition();
			}
		});

		
		//toggle click
		$(document).on("click", ".insertion_options_toggle_button", function(evt) {
			if (!$(this).hasClass( "insertion_options_toggle_selected" )) G.insertionCHI.toggle(evt.target.id);
		});
		
		
		//method button click
		$(document).on("click", ".insertion_option_method_button_model", function(evt) {
			let path = $(this).parent().data("path");
			G.io.loadFile(path, G.insertionCHI.insert);
		});
		
		//method info click
		$(document).on("click", ".insertion_option_method_button_info", function(evt) {
			let path = $(this).parent().data("path");
			G.io.loadFile(path, G.insertionCHI.showInfo);
		});
		
		
		//operator button click
		$(document).on("click", ".insertion_option_operator_button_model", function(evt) {
			let operator = $(this).text();
			G.insertionCHI.insert(operator);
		});
		
		//operator info click
		$(document).on("click", ".insertion_option_operator_button_info", function(evt) {
			let info = $(this).data("info");
			G.insertionCHI.showInfo(info);
		});
	}
	
	
	show(atLine) {
		if (this.hiddening) return;
		if ( $('#insertion_chi_container').css("display") != "none" ) return;
		
		G.insertionCHI.deleteIndex = G.quillManager.lastSelection.index;
		
		
	//ultimately, I want to have the quill "split" to look as if this chi is shown behin on opening up.  But, that's causing problems, so...
//		G.quill.updateContents(new Delta()
//		  .retain(G.insertionCHI.deleteIndex)           
//		  .insert({ 
//			image: './'
//		  },
//		  {
//			height: '176px'
//		  })
//		);
//		
//		//method to find image your adding and get it's height (and change it's height)
//		var x = $("img[src$='//:0']");
//		console.log("IMG", x, x.height());
	//--
		
		this.setPosition();
		
		if ($('#insertion_method_toggle').hasClass('insertion_options_toggle_selected')) this.setMethodHTML();
		else this.setOperatorHTML();
		
		G.insertionCHI.showring = true;
		$("#insertion_chi_container").slideToggle( "fast", function() {
			G.insertionCHI.showring = false;
		});
	}
	
	setPosition() {
		let offset = $(".insertion_marker").offset();
		if (offset == undefined || offset == null) return;
		
		var top = offset.top + 20;
		let left = offset.left - 10;
		let width = G.insertionCHI.getWidth();
		let height = $('#insertion_chi_container').height();
		if (top + height > $(document).height()) top = top - height - 25; //if this is going to put the chi below the bottom of hte window, put it over the line instead
		
		$('#insertion_chi_container').css({top: top, left: left});
		$('#insertion_chi_container').css({"width": width + "px"});
	}
	
	
	insert(text) {
		G.quill.focus();
		
		let insertIndex = G.insertionCHI.deleteIndex;
		G.insertionCHI.hide();
		G.quill.insertText(insertIndex, text);
		
		if (text.includes("\n")) G.quill.setSelection(insertIndex, text.length);
		else  G.quill.setSelection(insertIndex + text.length);
		
		G.quill.focus();
	}
	
	
	hide() {
		if (this.hiddening) return;
		if ( $('#insertion_chi_container').css("display") == "none" ) return;
		
		G.insertionCHI.hiddening = true;
		$('#insertion_chi_container').slideToggle("fast", function() {
			G.insertionCHI.hiddening = false;
		});
		
		//commented out until I get the effect working correctlyu
//		G.quill.updateContents(new Delta()
//		  .retain(G.insertionCHI.deleteIndex)           
//		  .delete(1)
//		);
		//--
		
		G.qutterManager.updateMarkers();
		G.quillet.setText("");
	}
	
	
	toggle(id) {
		var html = "";
		if (id.includes("method")) {
			$('#insertion_method_toggle').addClass('insertion_options_toggle_selected');
			$('#insertion_operator_toggle').removeClass('insertion_options_toggle_selected');
			
			this.setMethodHTML();
			
		} else {
			$('#insertion_operator_toggle').addClass('insertion_options_toggle_selected');
			$('#insertion_method_toggle').removeClass('insertion_options_toggle_selected');
			
			this.setOperatorHTML();
		}
		
		$('#insertion_options_content').scrollTop(0);
	}
	
	
	setMethodHTML() {
		var leftColumnHTML = "<div class='insertion_options_column_two_columns'><div class='insertion_column_header'>Built-In</div>";
		var rightColumnHTML = "<div class='insertion_options_column_two_columns'><div class='insertion_column_header'>Custom</div>";
		
		//insert buttons for each method. built in in left column.  custom in right column.
		for (var i = 0; i < G.methodsManager.methods.length; i++) {
			let method = G.methodsManager.methods[i];
			let buttonHTML = this.getMethodButtonHTML(method.file, method.filePath);
			
			if (method.filePath.includes("custom")) rightColumnHTML += buttonHTML;
			else leftColumnHTML += buttonHTML;
		}
		
		leftColumnHTML += "</div>";
		rightColumnHTML += "</div>";
		
		let html = leftColumnHTML + rightColumnHTML;
		$('#insertion_options_content').html(html);
	} 
	
	
	getMethodButtonHTML(name, path) {
		var html = "<div class='insertion_option_button' data-path='" + path + "'> \
						<div class='insertion_option_method_button_info'>i</div> \
						<div class='insertion_option_method_button_model'>" + name.replace(/_/g, " ") + "</div> \
					</div>"
		return html;
	}
	
	
	showInfo(txt) {
		G.quillet.setText(txt);
		G.solarize.solarizeQuillet();
	}
	
	
	setOperatorHTML() {
		var cogColumnHTML = "<div class='insertion_options_column_four_columns'><div class='insertion_column_header'>Cognitive</div>";
		var seeColumnHTML = "<div class='insertion_options_column_four_columns'><div class='insertion_column_header'>See</div>";
		var sayHearColumnHTML = "<div class='insertion_options_column_four_columns'><div class='insertion_column_header'>Say/Hear</div>";
		var handsColumnHTML = "<div class='insertion_options_column_four_columns'><div class='insertion_column_header'>Hands</div>";
		
		//insert buttons for each method. built in in left column.  custom in right column.
		for (var i = 0; i < G.operatorsManager.operators.length; i++) {
			let operator = G.operatorsManager.operators[i];
			let buttonHTML = this.getOperatorButtonHTML(operator);
			
			switch (operator.resource) {
				case "see":
					seeColumnHTML += buttonHTML;
					break;
				case "speech":
				case "hear":
					sayHearColumnHTML += buttonHTML;
					break;
				case "cognitive":
					cogColumnHTML += buttonHTML;
					break;
				case "hands":
					handsColumnHTML += buttonHTML;
					break;
			}
		}
		
		cogColumnHTML += "</div>";
		seeColumnHTML += "</div>";
		sayHearColumnHTML += "</div>";
		handsColumnHTML += "</div>";
		
		let html = cogColumnHTML + seeColumnHTML + sayHearColumnHTML + handsColumnHTML;
		$('#insertion_options_content').html(html);
	}
	
	
	getOperatorButtonHTML(operator) {
		var timeMod = "";
		
		if (operator.timeModifier == "count_label_words") timeMod = " per word in label.";
		else if (operator.timeModifier == "count_label_characters") timeMod = " per character in label.";
		else if (operator.operator.toLowerCase() == "type") timeMod = " per character in label.";
		
		var info = operator.operator + "\n"; 
			info += "*Time: " + operator.time + " milliseconds" + timeMod + "\n";
			info += "*Description: " + operator.description.replace(/_/g, " ");
		
		var html = "<div class='insertion_option_button'> \
						<div class='insertion_option_operator_button_info' data-info='" + info + "'>i</div> \
						<div class='insertion_option_operator_button_model'>" + operator.operator.replace(/_/g, " ") + "</div> \
					</div>"
		return html;
	}
	
	
	getWidth() {
		let margin = 20;
		let ql = $('#code').children('.ql-editor');
		let p = ql.children('p');
		var scrollbarWidth =  ql.innerWidth() - p.innerWidth() - margin;
		
		if (scrollbarWidth > 0) return $("#gutter").width() + $("#code").width() + 4;
		return ($("#gutter").width() + $("#code").width() + 18);
	}
	
	
	targetIsThis(target) {
		if (target.id == "insertion_chi_container") return true;
		
		var itIs = false;
		$(target).parents().each(function(){
			if (this.id == "insertion_chi_container") itIs = true;
		});
		
		return itIs;
	}
	
	
	isVisible() {
		if ( $('#insertion_chi_container').css("display") != "none" && !this.hiddening) return true;
		return false;
	}
	

}
	
G.insertionCHI = new InsertionCHI();
