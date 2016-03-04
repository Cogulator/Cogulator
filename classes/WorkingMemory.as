/*******************************************************************************
 * This is the copyright work of The MITRE Corporation, and was produced for the 
 * U. S. Government under Contract Number DTFAWA-10-C-00080.
 * 
 * For further information, please contact The MITRE Corporation, Contracts Office, 
 * 7515 Colshire Drive, McLean, VA  22102-7539, (703) 983-6000.
 * 
 * Copyright 2014 The MITRE Corporation
 *
 * Approved for Public Release; Distribution Unlimited. 14-0584
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/


package classes {
	import classes.Step;
	import classes.Chunk;
	
	public class WorkingMemory {
		public var memory:Array = new Array();
		public var averageLoad:Number;
		private var colorPalette:Array = new Array (0x2AA198, 0x268BD2, 0x6C71C4, 0xD33682, 0xDC322F, 0xCB4B16, 0xCB4B16, 0xB58900);  // Alternate syntax
		private static const e:Number = 2.71828; //Euler's Number

		public function WorkingMemory(intersteps:Array, modelEndTime:int, automateButtonCurrentFrame:int) {
			
			var totalCycles:int = (Math.round(modelEndTime / 50) * 50) / 50;
			memory.length = 0;
			memory = new Array(totalCycles); //create an array with a length equal to total number of cycles
			
			if (memory.length > 0) {
				 
				//initialize the stacks within memory (one for each 50ms cycle)
				for (var i:int = 0; i < memory.length; i++) {
					memory[i] = [];
				}
				
				for each (var step:Step in intersteps) {
					if (automateButtonCurrentFrame < 3) { //if the user has the model set to autome
						if ((step.resource == "see" || step.resource == "hear" ||
							 step.operator == "recall" || step.operator == "store" || step.operator == "think") 
							 && step.operator != "saccade") {
							pushChunk(step.label, step.endTime);
						}
					} else {
						if (step.operator == "store" || step.operator == "recall") {
							pushChunk(step.label, step.endTime);
						}
					}				
				}
				
				decayMemory();
				averageLoad = getAverageLoad();
			}       
		}
		
				
		private function pushChunk(chunkName:String, atTime:Number) {
			var roundUpFactor = 0;
			if (atTime % 50 != 0) roundUpFactor = 50 - (atTime % 50);
			var roundedUpTime = atTime + roundUpFactor;
			var stackToAddChunk:int = roundedUpTime / 50;
			
			var chunk = new Chunk(chunkName, atTime, -1, 1, colorPalette[0]);
						
			if (memory.length > stackToAddChunk) {	
				memory[stackToAddChunk].push(chunk);
				colorPalette.push(colorPalette[0]); //place the current color at end of list
				colorPalette.shift(); // remove the current color from begninning of list
			} 
		}
		
		
		private function decayMemory() {
			for (var i:int = 1; i < memory.length; i++) {
				var stack = memory[i - 1];
				//carry over the chunk from the previous cycle if recall probability greater than 0.5
				for each (var chunk in stack) {
					
					//set the chunk stack set if not set already
					if (chunk.stackDepthAtPush == -1) {
						chunk.stackDepthAtPush = stack.length; //uses the previous cycle stack depth;
					}
					
					var currentCycleTimeInSeconds = (i * 50) / 1000;
					var timeChunkInMemoryInSeconds = currentCycleTimeInSeconds - (chunk.addedAt / 1000);
					var recallProbability = getProbabilityOfRecall(chunk.stackDepthAtPush, timeChunkInMemoryInSeconds);
					if (recallProbability > 1) recallProbability = 0.999; //rounding time sometimes results in recall > 1
					
					if (recallProbability > 0.5) {
						var updatedChunk = new Chunk(chunk.chunkName, chunk.addedAt, chunk.stackDepthAtPush, recallProbability, chunk.color);
						memory[i].push(updatedChunk);
					}
				}
				
				//after carrying over the chunks from the previous cycle, pop those with lowest recall probability if load is greater than 7
				if (memory[i] != null) {
					while (memory[i].length > 7) {
						popMemoryOverload(i);
					}
				}
			}
		}
		
		
		private function popMemoryOverload(cycleIndex:int) {
			var indexForLowestRecallProbChunk:int = -1
			var lowestRecallProb:Number = 1.1;
			
			for (var i:int = 0; i < memory[cycleIndex].length; i++) {
				if (memory[cycleIndex][i].probabilityOfRecall < lowestRecallProb) {
					lowestRecallProb = memory[cycleIndex][i].probabilityOfRecall;
					indexForLowestRecallProbChunk = i;
				}
			}
			
			memory[cycleIndex].splice(indexForLowestRecallProbChunk, 1);
		}
		
		
		//based on model human processor estimates. card moran and newell (pg 38) 
		//may update to reflect current ACT-R thinking, bowing effect in recall, etc
		private function getProbabilityOfRecall(cogLoad:int, timeChunkInMemoryInSeconds:Number):Number {
			var yValue:Number;
			if (cogLoad < 3) {
				//yValue = (timeChunkInMemoryInSeconds + 0.00000000000020000000) / -105.31;
				yValue = (timeChunkInMemoryInSeconds + 0.00000000000020000000) / -50.31;
			} else {
				yValue = (timeChunkInMemoryInSeconds + 0.00000000000001000000) / -10.1;
			}
			return Math.pow(e, yValue); 
		}
		
		
		private function getAverageLoad():Number {
			var totalChunks = 0;
			for each (var stack in memory) {
				totalChunks += stack.length;
			}
			return totalChunks / memory.length;
		}

	}
	
}
