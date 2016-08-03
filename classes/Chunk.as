package classes {
	
	public class Chunk {
		
		public var chunkName:String;
		public var addedAt:Number;
		public var stackDepthAtPush:int;
		public var rehearsals:int;
		public var probabilityOfRecall:Number;
		public var color:uint;

		public function Chunk(chnkNm:String, addTime:Number, stckHght:int, rhrsls:int, prbbltyOfRcll:Number, clr:uint) {
			// constructor code
			chunkName = chnkNm;
			addedAt = addTime;
			stackDepthAtPush = stckHght;
			rehearsals = rhrsls;
			probabilityOfRecall = prbbltyOfRcll;
			color = clr;
		}

	}
	
}