
const { BrowserWindow,  webFrame} = require('electron');


class WindowsTitleBar {
    constructor() {
    }
    
	
    build() {
		require('electron-titlebar');
		this.currentWindow = remote.getCurrentWindow();
		this.webContents = this.currentWindow.webContents;
		
        let height = 20;
        let halfHeight = height / 2;
        let codeTop = 60 + halfHeight;
        
        $( '#sidebar_left' ).css('padding-top', height + 'px');
        $( '#main_nav' ).css('padding-top', halfHeight + 'px');
        $( '#gutter' ).css('top', codeTop + 'px');
        $( '#gutter' ).css('height', 'calc(100% - ' +  codeTop + 'px');
        $( '#code' ).css('top', codeTop + 'px');
        $( '#code' ).css('height', 'calc(100% - ' +  codeTop + 'px');
        $( '#sidebar_right' ).css('padding-top', height + 'px');
        $( '#not_gantt_but_is_magic' ).css('padding-top', height + 'px');
        
        let imgHTML = "<img src='icons/1024x1024.png' style='position:relative; float:left; margin:5px; height:20px'>";
        let menuHTML = "<div id='windows_menubar'>\
                           <div id='windows_file_btn' class='windows_menubar_item'>File</div>\
                           <div id='windows_edit_btn' class='windows_menubar_item'>Edit</div>\
                           <div id='windows_view_btn' class='windows_menubar_item'>View</div>\
                           <div id='windows_help_btn' class='windows_menubar_item'>Help</div>\
                        </div>";
        
        $( '#electron-titlebar' ).html(imgHTML + menuHTML);
				
		//menu button event handlers
		$( '#windows_file_btn' ).on( 'click', G.windowsTitleBar.handleFileClick);
		$( '#windows_edit_btn' ).on( 'click', G.windowsTitleBar.handleEditClick);
		$( '#windows_view_btn' ).on( 'click', G.windowsTitleBar.handleViewClick);
		$( '#windows_help_btn' ).on( 'click', G.windowsTitleBar.handleHelpClick);
		
		//hide menu if clicked item is not one of the menu buttons
		$(document).click(function (evt) {
			var target = $(evt.target);
			if (target.closest("#windows_file_btn").length == 0
				&& target.closest("#windows_edit_btn").length == 0
				&& target.closest("#windows_view_btn").length == 0
				&& target.closest("#windows_help_btn").length == 0) {
				G.windowsTitleBar.hideMenuOptions();
			}
		});
		
		//handle click on item in selected menu
		$( 'body' ).on( 'click', '.windows_menu_tr', function(evt) {
			G.windowsTitleBar.handleMenuButtonClick(evt);
		});
				
		//highlight items on menu on hover
		$( 'body' ).on( 'mouseenter', '.windows_menu_tr', function(evt) {
			$(this).addClass('windows_tr_highlight');
		});
		$( 'body' ).on( 'mouseleave', '.windows_menu_tr', function(evt) {
			$(this).removeClass('windows_tr_highlight');
		});
    }
	
	
	handleFileClick() {
		let options = [{text: "Save", shortcut: "Ctrl+S"},
					   {text: "Export Model", shortcut: ""},
					   {text: "Export Working Memory", shortcut: ""},
					   {text: "Open Cogulator Folder", shortcut: ""}
					  ];
		let position = $( '#windows_file_btn' ).offset();
		G.windowsTitleBar.showMenuOptions(position, options);
	}
	
	
	handleEditClick() {
		let options = [{text: "Undo", shortcut: "Ctrl+Z"},
					   {text: "Redo", shortcut: "Ctrl+Y"},
					   {text: "Cut", shortcut: "Ctrl+X"},
					   {text: "Copy", shortcut: "Ctrl+C"},
					   {text: "Paste", shortcut: "Ctrl+V"},
					   {text: "Select All", shortcut: "Ctrl+A"},
                       {text: "Find", shortcut: "Ctrl+F"}
					  ];
		let offset = $( '#windows_edit_btn' ).offset();
		G.windowsTitleBar.showMenuOptions(offset, options);
	}
	
	
	handleViewClick() {
		let options = [{text: "Dark", shortcut: ""},
                       {text: "Light", shortcut: ""},
                       {text: "Actual Size", shortcut: " Ctrl+O"},
					   {text: "Zoom In", shortcut: "Ctrl+Shift+="},
					   {text: "Zoom Out", shortcut: "Ctrl+-"},
					   {text: "Toggle Full Screen", shortcut: "F11"},
                       {text: "Toggle Line Numbers", shortcut: ""}
		];
		let offset = $( '#windows_view_btn' ).offset();
		G.windowsTitleBar.showMenuOptions(offset, options);
	}
	
	
	handleHelpClick() {
		let options = [{text: "Quick Start", shortcut: ""},
					   {text: "Learn More", shortcut: ""}
					  ];
		let offset = $( '#windows_help_btn' ).offset();
		G.windowsTitleBar.showMenuOptions(offset, options);
	}
	
	
	showMenuOptions(offset, options) {
		$( "#windows_popover_menu" ).remove();
		
		let optionsHTML = "<table>";
		for (var i = 0; i < options.length; i++) {
			let rowHTML = "<tr class='windows_menu_tr'><td>" + options[i].text + "</td><td class='windows_popover_shortcut'>" + options[i].shortcut + "</td><tr>";
			optionsHTML += rowHTML;
		}
		
		let left = offset.left;
		let html = "<div id='windows_popover_menu' style='left:" + left + "px'>" + optionsHTML + "</div>" 
		$( 'body' ).append( html );
	}
	
	hideMenuOptions() {
		$( "#windows_popover_menu" ).remove();
	}
	
	
	handleMenuButtonClick(evt) {
		let currentZoomFactor = webFrame.getZoomFactor();
		let fullScreen = G.windowsTitleBar.currentWindow.isFullScreen();
		
		let cogulatorPath = path.join(app.getPath('documents'), "cogulator");
		let rowTxt = $(evt.currentTarget).text();
		
		if 		(rowTxt == "SaveCtrl+S") G.modelsManager.saveModel();
		else if (rowTxt == "Export Model") G.exportManager.exportModel();
		else if (rowTxt == "Export Working Memory") G.exportManager.exportWM();
		else if (rowTxt == "Open Cogulator Folder") require('electron').shell.openExternal("file://" + cogulatorPath);
		
		else if (rowTxt == "UndoCtrl+Z")  G.windowsTitleBar.webContents.undo();
		else if (rowTxt == "RedoCtrl+Y") G.windowsTitleBar.webContents.redo();
		else if (rowTxt == "CutCtrl+X") G.windowsTitleBar.webContents.cut();
		else if (rowTxt == "CopyCtrl+C") G.windowsTitleBar.webContents.copy();
		else if (rowTxt == "PasteCtrl+V") G.windowsTitleBar.webContents.paste();
		else if (rowTxt == "Select AllCtrl+A") G.windowsTitleBar.webContents.selectAll();
        else if (rowTxt == "FindCtrl+F") G.finderCHI.show();

        else if (rowTxt == "Dark") G.darkLightManager.youWantItDarker();
        else if (rowTxt == "Light") G.darkLightManager.youWantItBright();
		else if (rowTxt == "Actual Size Ctrl+O") webFrame.setZoomFactor(1);
		else if (rowTxt == "Zoom InCtrl+Shift+=") webFrame.setZoomFactor(currentZoomFactor + .2);
		else if (rowTxt == "Zoom OutCtrl+-") webFrame.setZoomFactor(Math.max(0, currentZoomFactor - .2));
		else if (rowTxt == "Toggle Full ScreenF11") G.windowsTitleBar.currentWindow.setFullScreen(!fullScreen);
        else if (rowTxt == "Toggle Line Numbers") {
            G.qutterManager.showLineNumbers = !G.qutterManager.showLineNumbers;
            G.qutterManager.updateMarkers();
        }
		
		else if (rowTxt == "Quick Start") G.helpScreen.show();
		else if (rowTxt == "Learn More") require('electron').shell.openExternal('http://cogulator.io');
	}
}

G.windowsTitleBar = new WindowsTitleBar();
if (require('os').type() == "Windows_NT") G.windowsTitleBar.build();

$(document).ready(function() {
    $('html[electron-titlebar-platform=win32] #electron-titlebar > .button').css('width', '30px');
    $('html[electron-titlebar-platform=win32] #electron-titlebar > .button-maximize').css('right', '30px');
    $('html[electron-titlebar-platform=win32] #electron-titlebar > .button-minimize').css('right', '60px');
    $('html[electron-titlebar-platform=win32] #electron-titlebar > .button img').css('margin-left', '9px');
    
    //Override the existing electron-titlebar action for close.  It prevents deletions and saves to complete before 
    //shutting down the app.  Clone effectively removes all eventlisteners attached to .button-close.
    //Trigger sends message to ModelsManager.js to save active model, delete models marked for deletion, and close the app.
    $( 'html[electron-titlebar-platform=win32] #electron-titlebar > .button-close' ).replaceWith($('#electron-titlebar > .button-close').clone());
    $( 'html[electron-titlebar-platform=win32] #electron-titlebar > .button-close' ).on( 'click', function() {
        $( document ).trigger( "Win32_Close_Button_Pressed");
    });
    
    //Removing the event listeners screws up the hover on the close button somehow.  So, this addresses that issue
    $( 'html[electron-titlebar-platform=win32] #electron-titlebar > .button-close' ).hover( 
        function() {
            $(this).children('img').css('-webkit-filter', 'invert(100%)');
            $(this).css('background-color', '#e81123');
        }, function() {
            $(this).children('img').css('-webkit-filter', 'invert(0%)');
            $(this).css('background-color', 'rgba(168,168,168, 0.0)');
        }
    );
})
