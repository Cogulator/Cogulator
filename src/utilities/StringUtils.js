class StringUtils {
	constructor() {}
	
	trim(s) {
		if (s == null) return("");
		else return s.replace(/^[\s|\t|\n]+|[\s|\t|\n]+$/gmi, '');
	}
}

G.stringUtils = new StringUtils();