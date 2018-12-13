class QuillManager {
	constructor() {
		this.lastSelection;
		
		G.quill.on('selection-change', function(range, oldRange, source) {
			if (range && oldRange) G.quillManager.lastSelection = range;
			if (range == undefined && oldRange) G.quillManager.lastSelection = oldRange;
		});
	}
	
	getWord(index) {
		var start = this.getWordStart(index);
		let end = this.getWordEnd(index);
		var length = end - start;
		return G.quill.getText(start, length);
	}
	
	getWordStart(index) {
		var itr = index;
		while (itr >= 0) {
			let char = G.quill.getText(itr, 1);
			if (char == "\n" || char == " " || char == ".") {
				if (itr + 1 < 0) return 0;
				return itr + 1;
			}
			itr--;
		}
		
		if (itr < 0) return 0;
		return itr;
	}
	
	getWordEnd(index) {
		let maxLength = G.quill.getText().length + 1;
		var itr = index;
		while (itr < maxLength) {
			let char = G.quill.getText(itr, 1);
			if (char == "\n" || char == " " || char == ".") {
				return itr;
			}
			itr++;
		}
		
		return itr;
	}
	
	getLineNumber(index) {
		let txt = G.quill.getText(0, index);
		let lineCount = txt.split('\n').length;
		return lineCount - 1;
	}
	
	
	getLine(index) {
		var start = this.getLineStart(index);
		let end = this.getLineEnd(index);
		if (end < start) start = this.getLineStart(end - 1);
		
		let length = end - start;
		return G.quill.getText(start, length); 
	}
	
	getLineStart(index) {
		var itr = index;
		while (itr >= 0) {
			if (G.quill.getText(itr, 1) == "\n") return itr + 1;
			itr--;
		}
		
		return itr;
	}
	
	getLineEnd(index) {
		let maxLength = G.quill.getText().length + 1;
		var itr = index;
		while (itr < maxLength) {
			if (G.quill.getText(itr, 1) == "\n") {
				return itr;
			}
			itr++;
		}
		
		return itr;
	}
	
	getLineCount() {
		return G.quill.getText().split('\n').length;
	}
	
	getLineIndex(lineNo) {
		let lines = G.quill.getText().split('\n');
		if (lineNo > lines.length) return null;
		
		var index = 0;
		for (var i = 0; i < lineNo; i++) {
			index += lines[i].length + 1; //for the new line character you split out
		}
		
		return index;
	}
	
	insertTextAtLine(text, lineNo) {
		let index = this.getLineIndex(lineNo);
		if (index == null) return;
		
		G.quill.insertText(index, text);
		G.quill.focus();
	}
	
	//match the number of indents at the current line
	insertIndentedTextAtLine(text, lineNo) {
		let index = this.getLineIndex(lineNo);
		if (index == null) return;
		
		let lineTxt = this.getLine(index);
		
		var indent = "";
		for (var i = 0; i < lineTxt.length; i++) {
			if (lineTxt[i] != " " && lineTxt[i] != ".") break;
			indent += lineTxt[i];
		}
		text = indent + text;
		
		G.quill.insertText(index, text);
	}
	
	selectLine(lineNo)
	{
		let index = this.getLineIndex(lineNo);
		if (index == null) return;
		
		let lineTxt = this.getLine(index);

		var range = lineTxt.length;

		G.quill.setSelection(index, range);
	}

	selectText(lineNo, indexInLine, range)
	{
		let index = this.getLineIndex(lineNo);
		if (index == null){
			return;
		} 

		G.quill.setSelection(index + indexInLine, range);
	}
	
}

G.quillManager = new QuillManager();