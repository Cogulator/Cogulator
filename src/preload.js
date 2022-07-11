const { Titlebar, Color } = require ('custom-electron-titlebar');

window.addEventListener('DOMContentLoaded', () => {
  // Title bar implemenation
    console.log("TICKLE THE PRELOAD");
    new Titlebar({
        backgroundColor: Color.fromHex('#EFEFEF'),
        drag: true
    });
});