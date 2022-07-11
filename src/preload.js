const { Titlebar, Color } = require ('custom-electron-titlebar');

window.addEventListener('DOMContentLoaded', () => {
  // Title bar implemenation
    new Titlebar({
        backgroundColor: Color.fromHex('#EFEFEF'),
        drag: true
    });
});