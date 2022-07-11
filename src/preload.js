const { Titlebar, Color } = require ('custom-electron-titlebar');

window.addEventListener('DOMContentLoaded', () => {
    new Titlebar({
        backgroundColor: Color.fromHex('#EFEFEF'),
        drag: true
    });
});