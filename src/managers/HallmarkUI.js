class HallmarkUI {

    constructor()
    {
        G.quill.on('editor-change', function(eventName) {
            G.qutterManager.numberLines();
        });
    }

}

G.hallmarkUI = new HallmarkUI();