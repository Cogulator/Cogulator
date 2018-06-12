class FittsLaw {
		
	//A: Amplitude or distance traveled
	//W: Target width in pixels
	pointAndClick(A, W = 30) {
		const a = -123; //scaled for milliseconds
		const b = 381;  //scaled for milliseconds
		var ID = this.indexOfDifficultyWelford(A, W);

		return Math.max(200, this.MT(a, b, ID));
	}

	//A: Amplitude or distance traveled
	//W: Target width in pixels
	dragAndDrop(A, W = 30) {
		const a = -234; //scaled for milliseconds
		const b = 434;  //scaled for milliseconds
		var ID = this.indexOfDifficultyWelford(A, W);

		return Math.max(200, this.MT(a, b, ID));
	}

	//A: Amplitude or distance traveled
	//W: Target width in pixels		
	touchDrag(A, W = 30) {
		const a = -32.7; //scaled for milliseconds
		const b = 79.9;  //scaled for milliseconds
		var ID = this.indexOfDifficultyShannon(A, W);

		return Math.max(100, this.MT(a, b, ID));
	}

	//A: Amplitude or distance traveled
	//W: Target width in pixels	
	pointAndTouch(A, W = 30) {
		const a = 103.5; //scaled for milliseconds
		const b = 125.7;  //scaled for milliseconds
		var ID = this.indexOfDifficultyShannon(A, W);

		return Math.max(100, this.MT(a, b, ID));
	}

	//Mean Travel Time (in milliseconds)
	MT(a, b, ID) {
		return a + b * ID;
	}

	indexOfDifficultyWelford(A, W) {
		return this.logx(A/W + 0.5, 2);
	}

	indexOfDifficultyShannon(A, W) {
		return this.logx(A/W + 1, 2);
	}

	logx(val, base = 10) {
		return Math.log(val)/Math.log(base)
	}
			
}