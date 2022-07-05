class SettingsManager{
    setSetting(key, value){
        let rtrn = ipcRenderer.sendSync('set-config', key, value);
    }
    
    getSetting(key) {
        return ipcRenderer.sendSync('get-config', key);
    }
}


G.settingsManager = new SettingsManager();