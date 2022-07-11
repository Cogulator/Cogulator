$( document ).ready(function() {
    if (require('os').type() == "Windows_NT") {
        console.log("WINDOWS");
        $( '#electron-titlebar' ).remove();
    }
});