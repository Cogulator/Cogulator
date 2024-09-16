const { Titlebar, TitlebarColor } = require ('custom-electron-titlebar');

window.addEventListener('DOMContentLoaded', () => {
    new Titlebar({
        backgroundColor: TitlebarColor.fromHex('#EFEFEF'),
        drag: true
    });
});