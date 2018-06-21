class DragAndDropManager {
	constructor() {
		var holder = document.getElementById('drag-file');

        document.ondragover = (e) => {
			e.dataTransfer.dropEffect = "copy";
            return false;
        };

        document.ondragleave = () => {
            return false;
        };

        document.ondragend = () => {
            return false;
        };

        document.ondrop = (e) => {
            e.preventDefault();

            for (let f of e.dataTransfer.files) {
				let fileName = path.basename(f.path);
				let extension = path.extname(fileName);
				console.log(fileName, extension);
				
				if (extension == ".goms") G.modelsManager.copyModel(f.path);
				else 					  alert("Can't load " + fileName + ".  It's not a .goms file");
            }
            
            return false;
        };
	}
}

G.dragAndDrop = new DragAndDropManager();