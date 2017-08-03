//Desktop reference http://delivery.acm.org/10.1145/380000/371146/p1-inkpen.pdf?ip=128.29.43.2&id=371146&acc=ACTIVE%20SERVICE&key=A9ED11D7A520B19D%2E4D4702B0C3E38B35%2E4D4702B0C3E38B35%2E4D4702B0C3E38B35&CFID=788248994&CFTOKEN=83184349&__acm__=1500670980_c63b6ea4d743121ca7c2150615330f40
//TouchScreen reference Fingerstroke time estimates for touchscreen-based mobile gaming interaction

package classes {
	import flash.geom.Point;
	
	public class FittsLaw {

		public function FittsLaw() {
			// constructor code
		}
		
		//A: Amplitude or distance traveled
		//W: Target width in pixels
		public function pointAndClick(A:Number, W:Number = 30):int {
			const a:Number = -123; //scaled for milliseconds
			const b:Number = 381;  //scaled for milliseconds
			var ID:Number = indexOfDifficultyWelford(A, W);
			
			return Math.max(200, MT(a, b, ID));
		}
		
		//A: Amplitude or distance traveled
		//W: Target width in pixels
		public function dragAndDrop(A:Number, W:Number = 30):int {
			const a:Number = -234; //scaled for milliseconds
			const b:Number = 434;  //scaled for milliseconds
			var ID:Number = indexOfDifficultyWelford(A, W);
			
			return Math.max(200, MT(a, b, ID));
		}
		
		//A: Amplitude or distance traveled
		//W: Target width in pixels		
		public function touchDrag(A:Number, W:Number = 30):int {
			const a:Number = -32.7; //scaled for milliseconds
			const b:Number = 79.9;  //scaled for milliseconds
			var ID:Number = indexOfDifficultyShannon(A, W);
			
			return Math.max(100, MT(a, b, ID));
		}
		
		//A: Amplitude or distance traveled
		//W: Target width in pixels	
		public function pointAndTouch(A:Number, W:Number = 30):int {
			const a:Number = 103.5; //scaled for milliseconds
			const b:Number = 125.7;  //scaled for milliseconds
			var ID:Number = indexOfDifficultyShannon(A, W);
			
			return Math.max(100, MT(a, b, ID));
		}
		
		//Mean Travel Time (in milliseconds)
		private function MT(a:Number, b:Number, ID:Number):Number {
			return a + b * ID;
		}
		
		private function indexOfDifficultyWelford(A:Number, W:Number):Number {
			return logx(A/W + 0.5, 2);
		}
		
		private function indexOfDifficultyShannon(A:Number, W:Number):Number {
			return logx(A/W + 1, 2);
		}
		
		private function logx(val:Number, base:Number=10):Number {
			return Math.log(val)/Math.log(base)
		}
		


	}
	
}
