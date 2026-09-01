$( document ).ready(function() {
    if (os.type == "Windows_NT") {
        console.log("WINDOWS");
        $( '#electron-titlebar' ).remove();
    }
});
