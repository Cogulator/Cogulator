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
	import classes.SyntaxColor;
	import com.inruntime.utils.*;
	
	public class Memory {
		private const initialRehearsal:int = 3;
		private const recallThreshold:Number = 0.5;
		private const chunkThreshold:Number = 7;
		
		private var $:Global = Global.getInstance();
		private var interleavedSteps = new Array();
		private var colorPalette:Array = new Array (0x2AA198, 0x268BD2, 0x6C71C4, 0xD33682, 0xDC322F, 0xCB4B16, 0xCB4B16, 0xB58900);
		private var fromStack:int = 0;
		private var longTermMemory:Array = new Array();
		
		public var workingmemory:Array = new Array();
		public var rehearsals:Array = new Array(); //used by SubjectiveMentalWorkload
		public var averageLoad:Number;
		public var overloadedStacks:Array = new Array();
		

		public function Memory(intersteps:Array, modelEndTime:int, automateButtonCurrentFrame:int) {
			overloadedStacks. length = 0;
			
			var totalCycles:int = (Math.round(modelEndTime / 50) * 50) / 50;
			workingmemory.length = 0;
			workingmemory = new Array(totalCycles + 1); //create an array with a length equal to total number of cycles.  +1 ensures the last reference to chunk has a wm stack to sustain it
			
			if (workingmemory.length > 0) {
				for (var i:int = 0; i < workingmemory.length; i++) workingmemory[i] = []; //initialize the stacks within memory (one for each 50ms cycle)

				interleavedSteps.length = 0;
				for each (var s:Step in intersteps) interleavedSteps.push(s);
				interleavedSteps.sortOn("endTime", Array.NUMERIC);
				
				for each (var step:Step in interleavedSteps) {
					var stackToAddChunk:int = findChunkStackAtTime(step.endTime);
					decayMemory(stackToAddChunk);
					
					var isWmOperator:Boolean = isWorkingMemoryOperator(step.operator, step.resource, automateButtonCurrentFrame);
					if (step.chunkNames.length > 0) {
						isWmOperator = isWorkingMemoryOperator(step.operator, step.resource, 0); //count any operators that would count if set to automatic if chunk name is inserted
						for each (var chunkName in step.chunkNames) {
							if (step.operator == "ignore") {
								popChunkWithName(chunkName, stackToAddChunk); //remove from stack... no questions asked
							} else { //attempt to push chunk to stack
								var chunkAction = pushChunk(isWmOperator, chunkName, stackToAddChunk, step); //can add multiple chunks simultaneously... not realistic, but maybe passable
								if (chunkAction == "pushed_rehearsals") {
									if (!attendToChunkInFuture(chunkName, interleavedSteps.indexOf(step))) {
										popChunkWithName(chunkName, stackToAddChunk);
									}
								}
							}
						}
					} else if (isWmOperator) {
						pushChunk(true, "", stackToAddChunk, step);
					}
				}
				
				averageLoad = getAverageLoad();
			}
		}

				
		private function pushChunk(isWmOperator:Boolean, chunkName:String, chunkStack:int, step:Step):String {
			var chunkAction:String = ""
			var atTime = step.endTime;
			
			var existingChunk = null;
			if (chunkName != "") existingChunk = getExistingChunk(chunkName, chunkStack);
						
			if (chunkName == "" || (!existingChunk && isWmOperator)) {				
				var chunk = new Chunk(chunkName, atTime, -1, initialRehearsal, 1, colorPalette[0]); //name, addTime, stackHeight, rehearsals, recallProb, color
				if (workingmemory.length > chunkStack) {	
					workingmemory[chunkStack].push(chunk);
					colorPalette.push(colorPalette[0]); //place the current color at end of list
					colorPalette.shift(); // remove the current color from begninning of list
				}
			} else if (existingChunk && isWmOperator) { //chunks in lines like Say or Type, will be color coded and tested for memory availablity, but they don't add activation
				addRehearsalToChunk(chunkName, chunkStack);
			} else if (existingChunk) { //push to rehearsals so Mental Workload can be calculated
				var timeInMemory = getTimeChunkInMemoryInSeconds(chunkStack, existingChunk.addedAt);
				var activation = getActivation(existingChunk.stackDepthAtPush, timeInMemory, existingChunk.rehearsals)
				pushRehearsals(chunkName, activation, chunkStack); //used by SubjectiveMentalWorkload
				chunkAction = "pushed_rehearsals";
			} else if (!existingChunk) {
				$.errors[step.lineNo] = "<" + chunkName + "> is not in memory (forgotten?). Add with Store.";
				SyntaxColor.solarizeChunkOnLineNum(step.lineNo, chunkName);
			}
			
			return chunkAction;
		}
		
		
		private function decayMemory(toStack:int) {
			for (var i:int = fromStack; i < toStack; i++) {
				var stack = workingmemory[i - 1];
				//carry over the chunk from the previous cycle if recall probability greater than 0.5
				for each (var chunk in stack) {
					
					//set the chunk stack set if not set already
					if (chunk.stackDepthAtPush == -1) chunk.stackDepthAtPush = stack.length; //uses the previous cycle stack depth;
					var timeChunkInMemoryInSeconds = getTimeChunkInMemoryInSeconds(i, chunk.addedAt);
					var recallProbability = getProbabilityOfRecall(chunk.stackDepthAtPush, timeChunkInMemoryInSeconds, chunk.rehearsals);
					if (recallProbability > 1) recallProbability = 0.999; //rounding time sometimes results in recall > 1
					
					if (recallProbability > recallThreshold) {
						var updatedChunk = new Chunk(chunk.chunkName, chunk.addedAt, chunk.stackDepthAtPush, chunk.rehearsals, recallProbability, chunk.color); //name, addTime, stackHeight, accessCount, recallProb, color
						if (workingmemory[i] != undefined) workingmemory[i].push(updatedChunk); //occasionally getting undefined with last stack...
					}
				}
				
				//after carrying over the chunks from the previous cycle, pop those with lowest recall probability if load is greater than 7
				if (workingmemory[i] != null) {
					while (workingmemory[i].length > chunkThreshold) {
						popChunk(i);
						overloadedStacks.push(i);
					}
				}
			}
			
			fromStack = toStack;
		}		
		
		
		//Method to pop oldest chunk
		private function popChunk(cycleIndex:int) {
			var indexForOldestChunk:int = -1
			var earliestTime:Number = 1000000000.0;
		
			for (var i:int = 0; i < workingmemory[cycleIndex].length; i++) {
				if (workingmemory[cycleIndex][i].addedAt < earliestTime) {
					earliestTime = workingmemory[cycleIndex][i].addedAt;
					indexForOldestChunk = i;
				}
			}
			
			workingmemory[cycleIndex].splice(indexForOldestChunk, 1);
		}
		
		
		//Method to pop named chunk
		private function popChunkWithName(chunkName:String, cycleIndex:int) {
			cycleIndex--;
			for (var i:int = 0; i < workingmemory[cycleIndex].length; i++) {
				var chunk:Chunk = workingmemory[cycleIndex][i];
				if (chunk.chunkName == chunkName) {
					longTermMemory.push(chunk);
					workingmemory[cycleIndex].splice(i, 1);
					break;
				}
			}
		}
		
		
		//Determine if the chunk is ever referenced again later in the steps array
		private function attendToChunkInFuture(chunkName:String, startIndex:int):Boolean {
			startIndex++;
			for (var i = startIndex; i < interleavedSteps.length; i++) {
				for each (var chunk in interleavedSteps[i].chunkNames) {
					if (chunk == chunkName) {
						return true;
					}
				}
			}
			return false;
		}
		
		
		//Method to pop chunk with lowest activiation
/*		private function popMemoryOverload(cycleIndex:int) {
			var indexForLowestRecallProbChunk:int = -1
			var lowestRecallProb:Number = 1.1;
			
			for (var i:int = 0; i < memory[cycleIndex].length; i++) {
				if (memory[cycleIndex][i].probabilityOfRecall < lowestRecallProb) {
					lowestRecallProb = memory[cycleIndex][i].probabilityOfRecall;
					indexForLowestRecallProbChunk = i;
				}
			}
			
			memory[cycleIndex].splice(indexForLowestRecallProbChunk, 1);
		}*/
		
		
		//based on ACT-R & Workload Curve paper
		private function getProbabilityOfRecall(cogLoad:int, timeChunkInMemoryInSeconds:Number, rehearsals:Number):Number {
			const τ:Number =  -1  //threshold	
			const s:Number = 0.2; //noise
			
			var m = getActivation(cogLoad, timeChunkInMemoryInSeconds, rehearsals); //activation
			var p = 1 / (  1 + Math.pow(Math.E,( (τ - m) / s) )  ); //probability of recall
						
			return p;
		}	
		
		
		//based on ACT-R & Workload Curve paper
		private function getActivation(cogLoad:int, timeChunkInMemoryInSeconds:Number, rehearsals:Number):Number {
			var m = Math.log(rehearsals/Math.sqrt(timeChunkInMemoryInSeconds)); //activation
				m = (m + 1 / cogLoad) - 1; //activation divided among all chunks
			return m;
		}
		
		
		private function addRehearsalToChunk(chunkName:String, stack:int):void {
			for each (var chunk in workingmemory[stack - 1]) {
				if (chunk.chunkName == chunkName) {
					chunk.rehearsals++;
					break;
				}
			}
		}
		
		private function pushRehearsals(chunkName:String, activation:Number, chunkStack:int):void {
			//If multiple rehearsals in stack, only want the lowest activation one.  Used by SubjectiveMentalWorkload to calculate load at recall
			for each (var chunk in rehearsals) {
				if (chunk.stack == chunkStack) {
					if (activation < chunk.activation) {
						chunk.activation = activation;
						chunk.chunkName = chunkName;
					}
					return;
				}
			}
			rehearsals.push({chunkName: chunkName, activation: activation, stack: chunkStack});
		}
		
		
		private function getTimeChunkInMemoryInSeconds(stack:int, addedAt:int):Number {
			var currentCycleTimeInSeconds = (stack * 50) / 1000;
			var timeInMemory = currentCycleTimeInSeconds - (addedAt / 1000);
			if (timeInMemory > 0) return timeInMemory;
			else return .00001;
		}
		
		
		private function getAverageLoad():Number {
			var totalChunks = 0;
			for each (var stack in workingmemory) {
				totalChunks += stack.length;
			}
			return totalChunks / workingmemory.length;
		}
		
		
		private function findChunkStackAtTime(atTime:Number):int {
			var roundUpFactor = 0;
			if (atTime % 50 != 0) roundUpFactor = 50 - (atTime % 50);
			var roundedUpTime = atTime + roundUpFactor;
			return (roundedUpTime / 50);
		}
		
		
		private function isWorkingMemoryOperator(operator:String, resource:String, automateButtonFrame:int = 1):Boolean {
			if (automateButtonFrame < 3) { //if the user has the model set to automatic
				if ((resource == "see" || resource == "hear" || resource == "cognitive") && operator != "saccade" && operator != "verify") {
					return true;
				}
			} else {
				if (operator == "store" || operator == "recall") {
					return true;
				}
			}
			return false;
		}
		
		
		private function getExistingChunk(chunkName:String, stack:int):Chunk {			
			//first check to see if the chunk exists in LTM
			for each (var chunk in workingmemory[stack - 1]) {
				if (chunk.chunkName == chunkName) return chunk;
			}
			
// --- THIS FUNCTION IS INCOMPLETE -----------------------------
			for each (var ltmChunk in longTermMemory) {
				if (ltmChunk.chunkName == chunkName) {
					trace("FOUND A LTM CHUNK MATCH for", chunkName);
					//workingmemory[stack].push(chunk);
					//push it back into the working memory stack & return it (with a new rehearsal?)
				}
			}
// -------------------------------------------------------------
			
			return null;
		}
		
		
		
				
		//private function decayMemoryOLDFORMULA(toStack:int) {
		//	for (var i:int = fromStack; i < toStack; i++) {
		//		var stack = memory[i - 1];
		//		//carry over the chunk from the previous cycle if recall probability greater than 0.5
		//		for each (var chunk in stack) {
		//			
		//			//set the chunk stack set if not set already
		//			if (chunk.stackDepthAtPush == -1) {
		//				chunk.stackDepthAtPush = stack.length; //uses the previous cycle stack depth;
		//			}
		//			
		//			var currentCycleTimeInSeconds = (i * 50) / 1000;
		//			var timeChunkInMemoryInSeconds = currentCycleTimeInSeconds - (chunk.addedAt / 1000);
		//			var recallProbability = getProbabilityOfRecall(chunk.stackDepthAtPush, timeChunkInMemoryInSeconds);
		//			if (recallProbability > 1) recallProbability = 0.999; //rounding time sometimes results in recall > 1
		//			
		//			if (recallProbability > 0.5) {
		//				var updatedChunk = new Chunk(chunk.chunkName, chunk.addedAt, chunk.stackDepthAtPush, recallProbability, chunk.color);
		//				memory[i].push(updatedChunk);
		//			}
		//		}
		//		
		//		//after carrying over the chunks from the previous cycle, pop those with lowest recall probability if load is greater than 7
		//		if (memory[i] != null) {
		//			while (memory[i].length > 7) {
		//				popMemoryOverload(i);
		//			}
		//		}
		//	}
		//	
		//	fromStack = toStack;
		//}
		//
		//
		//
		//
		//private function decayMemoryOLD() {
		//	for (var i:int = 1; i < memory.length; i++) {
		//		var stack = memory[i - 1];
		//		//carry over the chunk from the previous cycle if recall probability greater than 0.5
		//		for each (var chunk in stack) {
		//			
		//			//set the chunk stack set if not set already
		//			if (chunk.stackDepthAtPush == -1) {
		//				chunk.stackDepthAtPush = stack.length; //uses the previous cycle stack depth;
		//			}
		//			
		//			var currentCycleTimeInSeconds = (i * 50) / 1000;
		//			var timeChunkInMemoryInSeconds = currentCycleTimeInSeconds - (chunk.addedAt / 1000);
		//			var recallProbability = getProbabilityOfRecall(chunk.stackDepthAtPush, timeChunkInMemoryInSeconds);
		//			if (recallProbability > 1) recallProbability = 0.999; //rounding time sometimes results in recall > 1
		//			
		//			if (recallProbability > 0.5) {
		//				var updatedChunk = new Chunk(chunk.chunkName, chunk.addedAt, chunk.stackDepthAtPush, recallProbability, chunk.color);
		//				memory[i].push(updatedChunk);
		//			}
		//		}
		//		
		//		//after carrying over the chunks from the previous cycle, pop those with lowest recall probability if load is greater than 7
		//		if (memory[i] != null) {
		//			while (memory[i].length > 7) {
		//				popMemoryOverload(i);
		//			}
		//		}
		//	}
		//}
		
		
		//based on model human processor estimates. card moran and newell (pg 38) 
		//private function getProbabilityOfRecallOLD(cogLoad:int, timeChunkInMemoryInSeconds:Number):Number {
		//	var yValue:Number;
		//	if (cogLoad < 3) {
		//		//yValue = (timeChunkInMemoryInSeconds + 0.00000000000020000000) / -105.31;
		//		yValue = (timeChunkInMemoryInSeconds + 0.00000000000020000000) / -50.31;
		//	} else {
		//		yValue = (timeChunkInMemoryInSeconds + 0.00000000000001000000) / -10.1;
		//	}
		//	return Math.pow(e, yValue); 
		//}
		

	}
	
}
