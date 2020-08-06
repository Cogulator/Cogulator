$( document ).ready(function() {
    G.modelsSidebar = new ModelsSidebar("");
});

const MAX_SIDEBAR_WIDTH = 500;
const MIN_SIDEBAR_WIDTH = 20;

class ModelsSidebar {
	constructor(selected) {
		this.showSelected = this.showSelected.bind(this);
		this.selectedPath = selected;
		this.resizing = false;
		
		this.buildSideBar();
		this.enableSideBarResize();
	}

	enableSideBarResize() {
		function resizeHandler(event) {
			if (event.pageX >= MIN_SIDEBAR_WIDTH && event.pageX <= MAX_SIDEBAR_WIDTH) {
				// Because of the magic of CSS variables, all we have to do is update the sidebar-left-width
				// Check the calculations in main.css to see how everything else is calculated based on this.
//				const html = document.getElementsByTagName('html')[0];
//				html.style.cssText = `--sidebar-left-width: ${event.pageX}px`;
                $(':root').css('--sidebar-left-width',  event.pageX + 'px');
			}
		}

		// On mousedown on the spacer, set indicator that we are resizing the sidebar and bind the resizing handler.
		$('#sidebar_spacer').on('mousedown', function() {
			G.modelsSidebar.resizing = true;
			$(document).on('mousemove', resizeHandler);
		})

		// Mouseup could happen anywhere, so check that on the document.
		// If there's a mouseup and we're resizing, stop the resizing handler.
		$(document).on('mouseup', function() {
			if (G.modelsSidebar.resizing) {
				G.modelsSidebar.resizing = false;
				$(document).off('mousemove', resizeHandler);
			}
		})
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
        $( '#sidebar_left' ).append("<div class='directory_label'> </div>"); //just add a little space at the bottom with an empty directory label div

		// Double click to rename a file.
		$(".model_label").dblclick(function(e) {
			const originalDiv = $(this);

			function doRename(newName) {
				const fullPath = originalDiv.parent().data("path");
				const newFile = G.modelsManager.renameModel(fullPath, newName);
				// Easiest thing to do after renaming is to just rebuild the sidebar.
				// This will make sure the renamed file gets put in the right place.
				G.modelsSidebar.selectedPath = newFile.filePath;
				G.modelsSidebar.buildSideBar();
			}

			const nameInput = $("<input>")
				.attr("type", "text")
				.addClass("rename_model")
				.val($(this).text())
				.blur(function () {
					doRename($(this).val());
				})
				.keypress(function (event) {
					if (event.key === "Enter") {
						doRename($(this).val());
					}
				})
		
			originalDiv.hide();
			nameInput.insertAfter(originalDiv);
			nameInput.focus();
		})
		
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
