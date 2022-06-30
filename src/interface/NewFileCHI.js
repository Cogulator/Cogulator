class NewFileCHI { //Model, Operator, or Method CHI
	constructor(selected) {
		this.newModelHTML = this.getNewModelHTML();
		this.newOperatorHTML = this.getNewOperatorHTML();
		this.newMethodHTML = this.getNewMethodHTML();
		
		$( "#new_model_button_container" ).click(function() {
		  	G.newFileCHI.show("model_tab", true);
		});
		
		$(document).on("click", ".new_file_tab", function() {
			G.newFileCHI.show(this.id, false);
		});
		
		$(document).on("click", "#new_file_close_container", function() {
			G.newFileCHI.hide();
		});
		
		$(document).on("keyup", ".new_file_text_field", function(evt) {
			G.newFileCHI.handleKeystroke( evt, this.id, $(this).val() );
    	});
        
        $(document).on("keydown", ".new_file_text_field", function(evt) {
			G.newFileCHI.handleKeyDown( evt, this.id );
    	});
		
		$(document).on("click", ".create_button_container", function(evt) {
			G.newFileCHI.handleCreateClick(evt.target.id);
		});
		
		$('#new_file_inputs_container').html(this.newModelHTML);
	}
	
	
	getNewModelHTML() {
		var html = 
			"<table class='new_file_inputs_table'> \
			  <tr class='input_row'> \
				<td class='new_file_label'>Model Name</td> \
				<td class='new_file_input'><input class='new_file_text_field' type='text' id='model_name' placeholder='required'></td> \
			  </tr> \
			  <tr class='error_row'> \
				<td class='error_left'></td> \
				<td class='error_right'><div id='error_model_name'><div></td>  \
			  </tr> \
			  <tr class='input_row'> \
				<td class='new_file_label'>Folder</td> \
				<td class='new_file_input'> \
					<div> \
						<input class='new_file_text_field' type='text' id='folder_name' placeholder='optional'> \
						<div class='new_file_autocomplete' id='folder_autocomplete'></div>\
					</div> \
				</td> \
			  </tr> \
			  <tr class='error_row'> \
				<td class='error_left'></td> \
				<td class='error_right'></td>  \
			  </tr> \
			</table> \
			<div class='create_button_container'> \
				<div class='create_button' style='opacity:0.25' id='create_model_button'>create</div> \
			</div>"
		return html;
	}
	
	
	getNewOperatorHTML() {
		var html = 
			"<table class='new_file_inputs_table'> \
			  <tr class='input_row'> \
				<td class='new_file_label'>Name</td> \
				<td class='new_file_input'><input class='new_file_text_field' type='text' id='operator_name' placeholder='required'></td> \
			  </tr> \
			  <tr class='error_row'> \
				<td class='error_left'></td> \
				<td class='error_right'><div id='error_operator_name' placeholder='required'><div></td>  \
			  </tr> \
			  <tr class='input_row'> \
				<td class='new_file_label'>Type</td> \
				<td class='new_file_input'> \
				<select class='new_file_dropdown' id='operator_type'> \
				  <option value='cognitive' selected='selected'>cognitive</option> \
				  <option value='speech'>speech</option> \
				  <option value='hear'>hear</option> \
				  <option value='see'>see</option> \
				  <option value='hands'>hands</option> \
				</select> \
				</td> \
			  </tr> \
			  <tr class='error_row'> \
				<td class='error_left'></td> \
				<td class='error_right'></td>  \
			  </tr> \
			  <tr class='input_row'> \
				<td class='new_file_label'>Time</td> \
				<td class='new_file_input'><input class='new_file_text_field' type='text' id='operator_time' style='width:50px' onkeypress='G.newFileCHI.validateIsNumber(event)'> ms</td> \
			  </tr> \
			  <tr class='error_row'> \
				<td class='error_left'></td> \
				<td class='error_right' id='error_operator_time'></td>  \
			  </tr> \
			  <tr class='input_row'> \
				<td class='new_file_label' style='vertical-align:text-top'>Description</td> \
				<td class='new_file_input'><textarea class='new_file_text_area' type='text' id='operator_description'></textarea></td> \
			  </tr> \
			  <tr class='error_row'> \
				<td class='error_left'></td> \
				<td class='error_right'></td>  \
			  </tr> \
			</table> \
			<div class='create_button_container'> \
				<div class='create_button' id='create_operator_button' style='opacity:0.25'>create</div> \
			</div>"
		return html;
	}
	
	
	getNewMethodHTML() {
		var html = 
			"<table class='new_file_inputs_table'> \
			  <tr class='input_row'> \
				<td class='new_file_label'>Name</td> \
				<td class='new_file_input'><input class='new_file_text_field' type='text' id='method_name' placeholder='required'></td> \
			  </tr> \
			  <tr class='error_row'> \
				<td class='error_left'></td> \
				<td class='error_right'><div id='error_method_name'><div></td>  \
			  </tr> \
			  <tr class='input_row'> \
				<td class='new_file_label' style='vertical-align:text-top'>Steps</td> \
				<td class='new_file_input'><textarea class='new_file_text_area' type='text' id='method_steps'></textarea></td> \
			  </tr> \
			  <tr class='error_row'> \
				<td class='error_left'></td> \
				<td class='error_right'></td>  \
			  </tr> \
			</table> \
			<div class='create_button_container'> \
				<div class='create_button' id='create_method_button' style='opacity:0.25'>create</div> \
			</div>"
		return html;
	}
	
	
	show(type, toggle) {
		if (toggle) $('#new_file_container').slideToggle("fast");
		
		$('.new_file_tab').removeClass("selected_tab").addClass("not_selected_tab");
		$('#' + type).removeClass("not_selected_tab").addClass("selected_tab");
		
		switch(type) {
			case "model_tab":
				$('#new_file_inputs_container').html(this.newModelHTML);
				document.getElementById("model_name").focus();
				break;
			case "operator_tab":
				$('#new_file_inputs_container').html(this.newOperatorHTML);
				document.getElementById("operator_name").focus();
				break;
			case "method_tab":
				$('#new_file_inputs_container').html(this.newMethodHTML);
				document.getElementById("method_name").focus();
				break;
		}
	}
	
	
	hide() {
		$('#new_file_container').slideToggle("fast");
		$('#new_file_inputs_container').html(this.newModelHTML);
	}
	
	
	handleCreateClick(id) {
		if ( $('#' + id).css("opacity") < 1 ) return;
			
		switch(id) {
			case "create_model_button":
				G.modelsManager.newModel($('#model_name').val(), $('#folder_name').val());
				break;
			case "create_operator_button":
				let name = $('#operator_name').val();
				let resource = $('#operator_type').find(":selected").text();
				let time = $('#operator_time').val();
				let description = $('#operator_description').val();
				G.operatorsManager.createOperator(name, resource, time, description);
				break;
			case "create_method_button":
				G.methodsManager.newMethod( $('#method_name').val(), $('#method_steps').val() );
				break;
			default:
				break;
		}
		
		this.hide();
	}
	
	
	handleKeystroke(evt, id, text) {
		switch(id) {
			case "model_name":
			case "folder_name":
			case "method_name":
			case "operator_name":
				let replaceSpaces = $('#' + id).val().replace(" ", "_");
				$('#' + id).val(replaceSpaces);
				break;
			default:
				break;
		}
		
		switch(id) {
			case "model_name":
			case "method_name":
			case "operator_name":
				var namesThatMatch = [];
				var createButtonID = "";
				var errorDivID = ""
				if (id == "model_name") {
					namesThatMatch = G.modelsManager.models.filter(function (model) {return model.file.toLowerCase() == text.toLowerCase()});
					createButtonID = "#create_model_button";
					errorDivID = "#error_model_name"
				} else if (id == "operator_name"){
					namesThatMatch = G.operatorsManager.operators.filter(function (op) {return op.operator.toLowerCase() == text.toLowerCase()});
					createButtonID = "#create_operator_button";
					errorDivID = "#error_operator_name"
				} else {
					namesThatMatch = G.methodsManager.methods.filter(function (method) {return method.file.toLowerCase() == text.toLowerCase()});
					createButtonID = "#create_method_button";
					errorDivID = "#error_method_name"
				}
				
				if (namesThatMatch.length > 0) {
					$(errorDivID).text("name already exists");
					$(createButtonID).stop().animate({
						opacity: 0.25
					}, 250);
				} else if ($(createButtonID).css("opacity") < 1) {
					$(errorDivID).text("");
					$(createButtonID).stop().animate({
						opacity: 1
					}, 50);
				}
				break;
			case "folder_name":
				let directoriesThatMatch = G.modelsManager.paths.filter(function (path) { return path.directory.substring(0, text.length).toLowerCase() == text.toLowerCase() });
				if (directoriesThatMatch.length > 0) {
					let autocomplete = directoriesThatMatch[0].directory.substring(text.length, directoriesThatMatch[0].directory.length);
					let html = "<span id='folder_autocomplete_typed' style='color: rgba(0, 0, 0, 0.0)'>" + text + "</span>" + autocomplete;
					$('#folder_autocomplete').html(html);
					//folder_autocomplete
				} else {
					$('#folder_autocomplete').empty();
				}
                
                if (event.keyCode === 9) { //TAB to autocomplete folder name
                    let ac = $('#folder_autocomplete').text();
                    $('#folder_autocomplete').empty();
                    $('#folder_name').val(ac)
                }
                
				break;
		}
        
        //handle enter press in new model chi
        switch(id) {
            case "model_name":
			case "folder_name":
                if (evt.keyCode == 13) G.newFileCHI.handleCreateClick("create_model_button");
                break;
            default:
                break;
        }
	}
    
    
    handleKeyDown(evt, id) {
        if (event.keyCode === 9 && id == "folder_name") {
            event.preventDefault();
        }
    }
	
	
	validateIsNumber(evt) {
		var theEvent = evt || window.event;
		var key = theEvent.keyCode || theEvent.which;
		key = String.fromCharCode( key );
		var regex = /[0-9]|\./;
		if( !regex.test(key) ) {
			theEvent.returnValue = false;
			if(theEvent.preventDefault) {
				theEvent.preventDefault();
				$('#error_operator_time').html("<div id='numbers_only_error'>numbers only</div>");
				  $( "#numbers_only_error" ).fadeOut( 1000, function() {
					$('#error_operator_time').empty();
				  });
			} 
		}
	}

}

G.newFileCHI = new NewFileCHI("");