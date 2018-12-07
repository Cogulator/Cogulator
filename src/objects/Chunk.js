class Chunk {
	constructor(chnkNm, addTime, stckHght, rhrsls, prbbltyOfRcll, clr, lineNumber) {
		this.chunkName = chnkNm;
		this.addedAt = addTime;
		this.stackDepthAtPush = stckHght;
		this.rehearsals = rhrsls;
		this.probabilityOfRecall = prbbltyOfRcll;
		this.color = clr;
		this.lineNumber = lineNumber;
		this.activation = 0.0;
		this.goal = "";
		this.workload = 1.0;
	}
}