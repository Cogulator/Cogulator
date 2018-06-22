class WindowsTitleBar {
    constructor() {
        let os = require('os');
        if (os.type() == "Windows_NT") this.build();
    }
    
    build() {
        require('electron-titlebar');
        
        let height = 20;
        let codeTop = 60 + height;
        
        $( '#sidebar_left' ).css('padding-top', height + 'px');
        $( '#main_nav' ).css('padding-top', height + 'px');
        $( '#gutter' ).css('top', codeTop + 'px');
        $( '#gutter' ).css('height', 'calc(100% - ' +  codeTop + 'px');
        $( '#code' ).css('top', codeTop + 'px');
        $( '#code' ).css('height', 'calc(100% - ' +  codeTop + 'px');
        $( '#sidebar_right' ).css('padding-top', height + 'px');
        $( '#not_gantt_but_is_magic' ).css('padding-top', height + 'px');
        
        $( '#electron-titlebar' ).html("<img src='icons/1024x1024.png' style='margin:5px; height:20px'>");
    }
}

G.windowsTitleBar = new WindowsTitleBar();