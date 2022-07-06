$( document ).ready(function() {
    G.modelsSidebar = new ModelsSidebar("");
});

const MAX_SIDEBAR_WIDTH = 500;
const MIN_SIDEBAR_WIDTH = 20;

ipcRenderer.on('Model->Rename', (sender, path, name) => {
    showRenameInput(path, name, "model");
})
ipcRenderer.on('Directory->Rename', (sender, path, name) => {
    showRenameInput(path, name, "directory");
})
ipcRenderer.on('File->ChangeModelsDirectory', (sender) => {
    console.log("REBUILD");
    G.paths.updateModelsDirectory(); //point to the newest model directory
    G.modelsManager.update(); //update the list of available models in memory
    G.modelsManager.selectDefaultModel() //default to the first model in the group, if any .  Also rebuilds the sidebar.
})

/**
 * Function to show an HTML rename input in place of the given labelDiv.
 * @param {HTMLElement} labelDiv The div to replace temporarily.
 * @param {String} type Either 'model' or 'directory'.
 */
function showRenameInput(path, name, type) {
	function doRename(newName) {
		if (type === 'model') {
			const newFile = G.modelsManager.renameModel(path, newName);
			if (newFile) {
				G.modelsSidebar.selectedPath = newFile.filePath;
			}
		}

		if (type === 'directory') {
			G.modelsManager.renameDirectory(path, newName);
		}

		G.modelsSidebar.buildSideBar();
	}
    
    var searchClass = ".model_label";
    if (type === 'directory') searchClass = ".directory_label .label";
    
    let labelDiv = $(searchClass).filter(function() {
        return $(this).text() === name;
    });
    if (path != labelDiv.parent().data("path")) return;

	const nameInput = $("<input>")
		.attr("type", "text")
		.addClass("rename")
		.val(labelDiv.text())
		.blur(function () {
			doRename($(this).val());
		})
		.keypress(function (event) {
			if (event.key === "Enter") $(this).blur();
		})
 
	labelDiv.hide();
	nameInput.insertAfter(labelDiv);
	nameInput.focus();
}

function confirmDelete(name) {
    return ipcRenderer.sendSync('dialog-delete-confirm', name);
}

class ModelsSidebar {
	constructor(selected) {
		this.showSelected = this.showSelected.bind(this);
		this.selectedPath = selected;
		this.resizing = false;
        
        let sideBarWidth =  G.settingsManager.getSetting('sidebarWidth');
        $(':root').css('--sidebar-left-width',  sideBarWidth + 'px'); //size to last saved width
		
		this.buildSideBar();
		this.enableSideBarResize();
	}

	enableSideBarResize() {
		function resizeHandler(event) {
			if (event.pageX >= MIN_SIDEBAR_WIDTH && event.pageX <= MAX_SIDEBAR_WIDTH) {
				// Because of the magic of CSS variables, all we have to do is update the sidebar-left-width
				// Check the calculations in main.css to see how everything else is calculated based on this.
                $(':root').css('--sidebar-left-width',  event.pageX + 'px');
                G.settingsManager.setSetting('sidebarWidth', event.pageX); //set from saved settings
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
				G.qutterManager.updateMarkers();
				G.modelsSidebar.resizing = false;
				$(document).off('mousemove', resizeHandler);
			}
		})
	}

	enableDirectoryActions() {
		// Context menu for directories.
		$(".directory_label .label").contextmenu(function(e) {
			const directoryDiv = $(this);
			if (!directoryDiv.text()) return; // Not allowed to rename or delete root (which will have blank text).

            let path = directoryDiv.parent().data('path');
            let name = directoryDiv.text();
            ipcRenderer.sendSync('directory-context-menu', path, name);
		});

		// Double click to rename a directory.
		$(".directory_label .label").dblclick(function(e) {
			const directoryDiv = $(this);
			if (!directoryDiv.text()) return; // Not allowed to rename or delete root (which will have blank text).

            let path = directoryDiv.parent().data('path');
            let name = directoryDiv.text();
            showRenameInput(path, name, 'directory');
		})

		// Button to expand/collapse directory.
		$(".directory_label .button").click(function(e) {
			const directoryOpen = $(this).parent().data("open");
			const directoryPath = $(this).parent().data("path");
            
            const rightArrow = "&#9654;"
		    const downArrow = "&#9660;"
            
            let modelsPath = G.paths.models; //used to seperate setSetting below for currently selected models directory

			if (directoryOpen) {
				$(this).parent().data("open", false);
				$(this).html(rightArrow);

				// Find all directory_group divs with this directoryPath and collapse them.
				$(`.directory_group[data-path='${directoryPath.replace(/["\\]/g, '\\$&')}']`).slideUp();
                G.settingsManager.setSetting(modelsPath + directoryPath, "closed");
			} else {
				$(this).parent().data("open", true);
				$(this).html(downArrow);

				// Find all directory_group divs with this directoryPath and show them.
				$(`.directory_group[data-path='${directoryPath.replace(/["\\]/g, '\\$&')}']`).slideDown();
                G.settingsManager.setSetting(modelsPath + directoryPath, "open");
			}
		});
	}

	enableModelActions() {
		// Context menu for models.
		$(".model_label").contextmenu(function(e) {
			let modelDiv = $(this);
            let path = modelDiv.parent().data('path');
            let name = modelDiv.text();
            ipcRenderer.sendSync('model-context-menu', path, name);
		});

		// Double click to rename a file.
		$(".model_label").dblclick(function(e) {
            let modelDiv = $(this);
            let path = modelDiv.parent().data('path');
            let name = modelDiv.text();
            showRenameInput(path, name, 'model');
		})
		
		// Click to select.
		$(".model_label").click(function (e) {
			let path = $(this).parent().data("path");
			if (G.modelsSidebar.selectedPath != path) {
				G.modelsManager.loadModel(path);
			}
		});

		// Hover over model and show delete/undo button listener
		$(' .model_button ').hover(function (e) {
			let marked = $( this ).children('.model_button_delete').data("marked");
			$( this ).children('.model_button_delete').text(marked); //this scope change
		}, function (e) {
			$( this ).children('.model_button_delete').text(" "); //this scope change
		});

		// Select delete/undo listener
		$(' .model_button_delete ').click(function (e) {
            const modelName = $(this).parent().children(".model_label").text();
            const modelPath = $(this).parent().data("path");
            
            if (confirmDelete(modelName)) {
                G.modelsManager.deleteModel(modelPath);
            }
            
            //this is the code for the old toggle undo. 
            //I like the idea behind this, but there's something that just doesn't feel good about not immediately deleting the file and waiting for Cogulator to Close
            //Plus, it didn't always work as expected (getting the file deleted before Cogulator completely closed out was a problem)
//			var marked = $( this ).data("marked");
//			if (marked == "x") marked = "u";
//			else marked = "x";
//					
//			if ( $( this ).siblings('.model_label').hasClass('strikethrough') ) {
//				$( this ).siblings('.model_label').removeClass('strikethrough');
//			} else {
//				$( this ).siblings('.model_label').addClass('strikethrough');
//			}
//			
//			$( this ).text(marked);
//			$( this ).data("marked", marked);
		});
	}

	enableModelDragDrop() {
		$('.directory_label').on('dragover', function(event) {
			event.preventDefault();
			event.stopPropagation();
			$(this).addClass('dragging');
		})

		$('.directory_label').on('dragleave', function(event) {
			event.preventDefault();
			event.stopPropagation();
			$(this).removeClass('dragging');
		})

		$('.directory_label').on('drop', function(event) {
			event.preventDefault();
			event.stopPropagation();
			$(this).removeClass('dragging');

			// Make sure there is data and a model is being dropped.
			const textData = event.originalEvent.dataTransfer.getData("text");
			if (textData) {
				const droppedData = JSON.parse(textData);
				if (droppedData.type && droppedData.type === 'model-file') {
					const newFilePath = G.modelsManager.moveModel(droppedData.fullPath, $(this).data('path'));

					// It's possible to drop a file on the directory it's already in.
					// So only do stuff if the file was moved to a new directory.
					if (newFilePath !== droppedData.fullPath) {
						// If we moved the currently selected model, we need to update selectedPath.
						if (droppedData.fullPath === G.modelsSidebar.selectedPath) {
							G.modelsSidebar.selectedPath = newFilePath;
						}
						
						// Easiest thing to do after moving is to just rebuild the sidebar.
						// This will make sure the moved file gets put in the right place.
						G.modelsSidebar.buildSideBar();
					}
				}
			}
		})

		$('.model_label').on('dragstart', function(event) {
			const fullPath = $(this).parent().data('path');
			event.originalEvent.dataTransfer.effectAllowed = 'move';
			// Store the path and type of thing being dragged.
			event.originalEvent.dataTransfer.setData('text/plain', JSON.stringify({
				type: 'model-file',
				fullPath,
			}));
		});

	}
		
	buildSideBar() {
		const rightArrow = "&#9654;"
		const downArrow = "&#9660;"

		$( '#sidebar_left' ).empty();
		
        let allModelsPath = G.paths.models; //used to seperate setSetting below for currently selected models directory
		let modelPaths = G.modelsManager.paths; //{directory, directoryPath, files:[{file, filePath}]}
		for (var i = 0; i < modelPaths.length; i++) {
			let models = modelPaths[i];
            
            var lastWasOpen = true;
            if (G.settingsManager.getSetting(allModelsPath + models.directoryPath) == "closed") lastWasOpen = false;

			let directoryButton = "<div></div>"
			if (models.directory !== "") {
                if (lastWasOpen) directoryButton = "<div class='button'><div class='arrow'>" + downArrow + "</div></div>";
                else             directoryButton = "<div class='button'><div class='arrow'>" + rightArrow + "</div></div>";
			}

			$( '#sidebar_left' ).append(
				"<div class='directory_label' data-open='" + lastWasOpen + "' data-path='" + models.directoryPath + "'>" + 
					directoryButton +
					"<div class='label'>" + models.directory + "</div>" +
				"</div>"
			);

			// Build a directory_group to contain all files within this directory. Makes slideUp and slideDown possible.
			const directoryGroup = $(`<div class="directory_group" data-path="${models.directoryPath}"></div>`);
			$( '#sidebar_left' ).append(directoryGroup)
			
			for (var j = 0; j < models.files.length; j++) {
				let file = models.files[j];
				
				var buttonClass = "model_button";
				var pointerDiv = "";
                
				if (this.selectedPath.replace(/["\\]/g, '\\$&') == file.filePath.replace(/["\\]/g, '\\$&')) {
					buttonClass = "model_button model_button_selected";
					pointerDiv = "<div class='model_pointer'></div>";
				}

				directoryGroup.append(
					"<div class='" + buttonClass + "' data-path='" + file.filePath + "'>" +
						"<div class='model_button_delete' data-marked='x'> </div>" +
						"<div class='model_label' draggable='true'>" + file.file + "</div>" +
						pointerDiv +
					"</div>"
				);
			}
            
            // Check to see if the directory should be open or closed
            if (G.settingsManager.getSetting(allModelsPath + models.directoryPath) == "closed") {
                $(`.directory_group[data-path='${models.directoryPath.replace(/["\\]/g, '\\$&')}']`).slideUp();
            }
		}

        $( '#sidebar_left' ).append("<div class='empty_directory_label'> </div>"); //just add a little space at the bottom with an empty directory label div

		this.enableDirectoryActions();
		this.enableModelActions();
		this.enableModelDragDrop();
	}
		
	
	showSelected(selectedPath) {
		// Remove model_button_selected and model_pointer from all model buttons.
		$('#sidebar_left .model_button').removeClass('model_button_selected');
		$('#sidebar_left .model_button').find('.model_pointer').remove();

		// Add model_button_selected and model_pointer to the currently selected button.
        let pth = selectedPath.replace(/["\\]/g, '\\$&');
		$(`#sidebar_left .model_button[data-path='${pth}']`).addClass('model_button_selected');
		$(`#sidebar_left .model_button[data-path='${pth}']`).append("<div class='model_pointer'></div>");

		G.modelsSidebar.selectedPath = selectedPath;
	}

	
}
