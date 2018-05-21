let Delta = Quill.import('delta');

class InsertionCHI {
	constructor() {
		this.deleteIndex = 0;
		
		//hide if click on anything other than insertion chi, show if click on insertion marker
		$(document).bind('click', function(e) {
			if (e.target.className.includes("insertion_marker")) {
				let lineNumber =  $(this).data("line");
				G.insertionCHI.show(lineNumber);
				return;
			}
			
			if (e.target.id == "insertion_container") return;
			
			var hide = true;
			$(e.target).parents().each(function(){
				if (this.id == "insertion_container") {
					hide = false;
				}
			});
			
			if (hide) G.insertionCHI.hide(true);
		});
		
		//set up to hide on resize or scroll
		$( window ).resize(function() {
			G.insertionCHI.hide(true);
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
			G.io.loadFile(path, G.insertionCHI.showMethodInfo);
		});
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
		
		console.log("SET METHOD");
	} 
	
	
	getMethodButtonHTML(name, path) {
		var html = "<div class='insertion_option_button' data-path='" + path + "'> \
						<div class='insertion_option_method_button_info'>i</div> \
						<div class='insertion_option_method_button_model'>" + name + "</div> \
					</div>"
		return html;
	}
	
	
	showMethodInfo(method) {
		G.quillet.setText(method);
		G.solarize.solarizeQuillet();
	}
	
	
	setOperatorHTML() {
		console.log("SET OPERATOR");
	}
	
	
	show(atLine) {
		if ( $('#insertion_container').css("visibility") != "hidden" ) return;
		
		G.insertionCHI.deleteIndex = G.quillManager.lastSelection.index;
		G.quill.updateContents(new Delta()
		  .retain(G.insertionCHI.deleteIndex)           
		  .insert({ 
			image: './'
		  },
		  {
			height: '175px'
		  })
		);
		
		let offset = $(".insertion_marker").offset();
		let top = offset.top + 20;
		let left = offset.left - 10;
		let width = G.insertionCHI.getWidth();
		
		$('#insertion_container').offset({top: top, left: left});
		$('#insertion_container').css({"width": width + "px"});
		
		this.setMethodHTML();
		$('#insertion_container').css({"visibility": "visible"});
	}
	
	
	insert(text) {
		G.quill.insertText(G.insertionCHI.deleteIndex, text);
		G.insertionCHI.hide(false);
	}

	
	hide(dlt) {
		if ( $('#insertion_container').css("visibility") == "hidden" ) return;
		$('#insertion_container').css({"visibility": "hidden"});
		
		if (dlt) {
			G.quill.updateContents(new Delta()
			  .retain(G.insertionCHI.deleteIndex)           
			  .delete(1)
			);
		}
		
		G.qutterManager.updateMarkers();
		G.quillet.setText("");
	}
	
	
	getWidth() {
		let margin = 20;
		let ql = $('#code').children('.ql-editor');
		let p = ql.children('p');
		var scrollbarWidth =  ql.innerWidth() - p.innerWidth() - margin;
		
		if (scrollbarWidth > 0) return $("#gutter").width() + $("#code").width() + 4;
		return ($("#gutter").width() + $("#code").width() + 18);
	}
}
	
G.insertionCHI = new InsertionCHI();
