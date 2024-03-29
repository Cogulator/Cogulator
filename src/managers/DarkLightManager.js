//const { nativeTheme } = require('electron').remote.require('electron')
//
//nativeTheme.on('updated', function theThemeHasChanged () {
//    if (nativeTheme.shouldUseDarkColors) G.darkLightManager.youWantItDarker();
//    else                                 G.darkLightManager.youWantItBright();
//})

//once all js files are loaded, set dark/light according to system
//$( document ).ready(function() {
//    console.log("TEST");
//    if (nativeTheme.shouldUseDarkColors) G.darkLightManager.youWantItDarker();
//    else                                 G.darkLightManager.youWantItBright();
//});

class DarkLightManager {
	constructor() {
        this.isDark = G.settingsManager.getSetting('darkMode');
        
		ipcRenderer.on('View->Light', (sender, arg) => {
            this.youWantItBright();
		})
        
        ipcRenderer.on('View->Dark', (sender, arg) => {
            this.youWantItDarker();
		})
	}
    
    youWantItBright() {
        this.isDark = false;
        
        $(':root').css('--main-bg-color', '#F8F8F8');
        $(':root').css('--sidebar-left-bg-color', '#EFEFEF');
        $(':root').css('--sidebar-right-bg-color', '#EFEFEF');
        $(':root').css('--stats-color', '#000');
        $(':root').css('--border-color', '#DFDFDF');
        $(':root').css('--button-icon-color', '#000');
        $(':root').css('--scroll-bar-color', '#DDD');
        $(':root').css('--scroll-bar-hover-color', '#CCC');
        $(':root').css('--model-button-select-txt-color', 'white');
        $(':root').css('--model-button-txt-color', 'black');
	    $(':root').css('--directory-txt-color', '#777');
        $(':root').css('--box-shadow-color', 'grey');
        $(':root').css('--gantt-stripe-color', '#F0F0F0');
        $(':root').css('--gantt-text-shadow-color', '#FFF');
        $(':root').css('--gantt-border-color', '#CCC');
        $(':root').css('--windows-menu-font-color', '#000');
        $(':root').css('--line_number-color', 'lightgray');
        $(':root').css('--auto-complete-bg-color', '#4A4A4A');
        
        $( '#reload_model_button' ).html('<img src="images/reload.png">');
        
        G.solarize.setLight();
        $( document ).trigger( "Dark_Mode_Change" ); //listen for by MagicModels and GanttChart
        
        G.settingsManager.setSetting('darkMode', false);
    }
    
    youWantItDarker(onStartUp) {
        this.isDark = true;
        
        $(':root').css('--main-bg-color', '#073642');
        $(':root').css('--sidebar-left-bg-color', '#002B36');
        $(':root').css('--sidebar-right-bg-color', '#002B36');
        $(':root').css('--stats-color', '#93A1A1');
        $(':root').css('--border-color', '#094D5E');
        $(':root').css('--button-icon-color', '#93A1A1');
        $(':root').css('--scroll-bar-color', '#476A72');
        $(':root').css('--scroll-bar-hover-color', '#66838A');
        $(':root').css('--model-button-select-txt-color', 'white');
        $(':root').css('--model-button-txt-color', '#93A1A1');
	    $(':root').css('--directory-txt-color', '#586E75');
        $(':root').css('--box-shadow-color', 'black');
        $(':root').css('--gantt-stripe-color', '#002B36');
        $(':root').css('--gantt-text-shadow-color', '#111');
        $(':root').css('--gantt-border-color', '#002730');
        $(':root').css('--windows-menu-font-color', '#93A1A1');
        $(':root').css('--line_number-color', '#586E75');
        $(':root').css('--auto-complete-bg-color', '#93A1A1');
        
        $( '#reload_model_button' ).html('<img src="images/reload_dark.png">');
        
        $('html[electron-titlebar-platform=win32] #electron-titlebar > .button img').css('-webkit-filter', 'invert(50%)');
            
        //This same code is a duplicate from WindowsTitlebar.js. Has to be reapplied to keep the hover working correctly
        $( 'html[electron-titlebar-platform=win32] #electron-titlebar > .button-close' ).hover ( 
            function() {
                $(this).children('img').css('-webkit-filter', 'invert(100%)');
                $(this).css('background-color', '#e81123');
            }, function() {
                $(this).children('img').css('-webkit-filter', 'invert(50%)');
                $(this).css('background-color', 'rgba(168,168,168, 0.0)');
            }
        );
       
        G.solarize.setDark();
        if (onStartUp) $( document ).trigger( "Dark_Mode_StartUp" ); //listen for by MagicModels and GanttChart
        else           $( document ).trigger( "Dark_Mode_Change" ); //listen for by MagicModels and GanttChart
        
        G.settingsManager.setSetting('darkMode', true);
    }
    
}

G.darkLightManager = new DarkLightManager();