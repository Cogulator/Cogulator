class Chunk {
	constructor(chnkNm, addTime, stckHght, rhrsls, prbbltyOfRcll, clr, lineNo) {
		this.chunkName = chnkNm;
		this.addedAt = addTime;
		this.stackDepthAtPush = stckHght;
		this.rehearsals = rhrsls;
		this.probabilityOfRecall = prbbltyOfRcll;
		this.color = clr;
        this.lineNumber = lineNo;
	}
}