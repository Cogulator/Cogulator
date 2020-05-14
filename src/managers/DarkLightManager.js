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
        this.isDark = false;
        
		ipcRenderer.on('View->Light', (sender, arg) => {
            this.isDark = false;
            this.youWantItBright();
		})
        
        //Currently not in use
        ipcRenderer.on('View->Dim', (sender, arg) => {
            this.isDark = false;
            this.youWantSomeLight();
		})
        
        ipcRenderer.on('View->Dark', (sender, arg) => {
            this.isDark = true;
            this.youWantItDarker();
            
		})
	}
    
    youWantItBright() {
        $(':root').css('--main-bg-color', '#F8F8F8');
        $(':root').css('--sidebar-left-bg-color', '#EFEFEF');
        $(':root').css('--sidebar-right-bg-color', '#EFEFEF');
        $(':root').css('--stats-color', '#000');
        $(':root').css('--border-color', '#DFDFDF');
        $(':root').css('--button-icon-color', '#000');
        $(':root').css('--scroll-bar-color', '#EEE');
        $(':root').css('--model-button-select-txt-color', 'white');
        $(':root').css('--model-button-txt-color', 'black');
	    $(':root').css('--directory-txt-color', 'lightgray');
        $(':root').css('--box-shadow-color', 'grey');
        $(':root').css('--gantt-stripe-color', '#F0F0F0');
        $(':root').css('--gantt-text-shadow-color', '#FFF');
        $(':root').css('--gantt-border-color', '#CCC');
        
        G.solarize.setLight();
        G.magicModels.setMagicModels();
        G.ganttManager.setGanttChart();
    }
    
    youWantSomeLight() {
        $(':root').css('--main-bg-color', '#BFBFBF');
        $(':root').css('--sidebar-left-bg-color', '#EFEFEF');
        $(':root').css('--sidebar-right-bg-color', '#EFEFEF');
        $(':root').css('--stats-color', '#000');
        $(':root').css('--border-color', '#777');
        $(':root').css('--button-icon-color', '#000');
        $(':root').css('--scroll-bar-color', '#777');
        $(':root').css('--model-button-select-txt-color', 'white');
        $(':root').css('--model-button-txt-color', 'black');
	    $(':root').css('--directory-txt-color', 'lightgray');
        $(':root').css('--box-shadow-color', 'grey');
        $(':root').css('--gantt-stripe-color', '#F0F0F0');
        $(':root').css('--gantt-text-shadow-color', '#FFF');
        $(':root').css('--gantt-border-color', '#CCC');
        
        G.solarize.setDim();
        G.magicModels.setMagicModels();
        G.ganttManager.setGanttChart();
    }
    
    youWantItDarker() {
        $(':root').css('--main-bg-color', '#073642');
        $(':root').css('--sidebar-left-bg-color', '#002B36');
        $(':root').css('--sidebar-right-bg-color', '#002B36');
        $(':root').css('--stats-color', '#93A1A1');
        $(':root').css('--border-color', '#094D5E');
        $(':root').css('--button-icon-color', '#93A1A1');
        $(':root').css('--scroll-bar-color', '#476A72');
        $(':root').css('--model-button-select-txt-color', 'white');
        $(':root').css('--model-button-txt-color', '#93A1A1');
	    $(':root').css('--directory-txt-color', '#586E75');
        $(':root').css('--box-shadow-color', 'black');
        $(':root').css('--gantt-stripe-color', '#002B36');
        $(':root').css('--gantt-text-shadow-color', '#111');
        $(':root').css('--gantt-border-color', '#002730');
        
        G.solarize.setDark();
        G.magicModels.setMagicModels();
        G.ganttManager.setGanttChart();
    }
    
}

G.darkLightManager = new DarkLightManager();