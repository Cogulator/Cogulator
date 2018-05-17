$( document ).ready(function() {
    G.modelsSidebar = new ModelsSidebar("");
});

class ModelsSidebar {
	constructor(selected) {
		this.showSelected = this.showSelected.bind(this);
		this.selectedPath = selected;
		
		this.buildSideBar();
	}

		
	buildSideBar() {
		$( '#sidebar_left' ).empty();
		
		let modelPaths = G.modelsManager.paths; //{directory, directoryPath, files:[{file, filePath}]}
		for (var i = 0; i < modelPaths.length; i++) {
			let models = modelPaths[i];
			$( '#sidebar_left' ).append("<div class='directory_label'>" + models.directory + "</div>");
			
			for (var j = 0; j < models.files.length; j++) {
				let file = models.files[j];
				
				var buttonClass = "model_button";
				var pointerDiv = "<div></div>";
				if (this.selectedPath == file.filePath) {
					buttonClass = "model_button model_button_selected";
					pointerDiv = "<div class='model_pointer'></div>";
				}
				
				//button
				let html = "<div class='" + buttonClass + "' data-path='" + file.filePath + "'>" +
								"<div class='model_button_delete' data-marked='x'> </div>" +
								"<div class='model_label'>" + file.file + "</div>" +
								"<div class='model_pointer_container'>" + pointerDiv + "</div>";
							"</div>";
				$( '#sidebar_left' ).append(html);
			}
		}
		
		
		//Select model listener
		$(' .model_label ').click(function (e) {
			let path = $(this).parent().data("path");
			if (G.modelsSidebar.selectedPath != path) G.modelsSidebar.showSelected(path); //scope is lost, so just reference Global
		});
		
		//Hover over model and show delete/undo button listener
		$(' .model_button ').hover(function (e) {
			let marked = $( this ).children('.model_button_delete').data("marked");
			$( this ).children('.model_button_delete').text(marked); //this scope change
		}, function (e) {
			$( this ).children('.model_button_delete').text(" "); //this scope change
		});
		
		//Select delete/undo listener
		$(' .model_button_delete ').click(function (e) {
			var marked = $( this ).data("marked");
			if (marked == "x") marked = "u";
			else marked = "x";
					
			if ( $( this ).siblings('.model_label').hasClass('strikethrough') ) {
				$( this ).siblings('.model_label').removeClass('strikethrough');
			} else {
				$( this ).siblings('.model_label').addClass('strikethrough');
			}
			
			$( this ).text(marked);
			$( this ).data("marked", marked);
		});
	}
		
	
	showSelected(selectedPath, loadModel) {
		$('#sidebar_left').children('.model_button').each(function(i) { 
			let path = $(this).data("path");
			if (path == selectedPath) {
				$(this).addClass('model_button_selected');
				$( this ).children('.model_pointer_container').html("<div class='model_pointer'></div>");
				G.modelsSidebar.selectedPath = path;
				
				if (selectedPath != G.modelsManager.selected && !loadModel) G.modelsManager.loadModel(path);
			} else {
				$(this).removeClass('model_button_selected');
				$( this ).children('.model_pointer_container').html("<div></div>");
			}
		});
	}

	
}