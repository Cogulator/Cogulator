class WindowsTitleBar {
    constructor() {
        let os = require('os');
        if (os.type() == "Windows_NT") this.build();
    }
    
    build() {
        require('electron-titlebar');
        
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
    }
}

G.windowsTitleBar = new WindowsTitleBar();