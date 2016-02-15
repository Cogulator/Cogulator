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
	
	public class WorkingMemory {
		public var memory:Array = new Array();
		public var colorPalette:Array = new Array (0x2AA198, 0x268BD2, 0x6C71C4, 0xD33682, 0xDC322F, 0xCB4B16, 0xCB4B16, 0xB58900);  // Alternate syntax

		private static const e:Number = 2.71828; //Euler's Number

		public function WorkingMemoryLoad() {
			// constructor code
		}
		
		public function updateMemory(action:String, chunk:String, timeAdded:Number):Boolean {
			if (action == "push") {
				if(memory.indexOf(chunk) < 0) { //if this chunk doesn't already exist in wm, add it
					memory.push({chunkName: chunk, addedAt: timeAdded, probabilityOfRecall: 1, cogLoad: memory.length, color:colorPalette[0]});
					colorPalette.push(colorPalette[0]); //place the current color at end of list
					colorPalette.shift(); // remove the current color from begninning of list
				}
				
				if(memory.length > 7) {
					memory.shift(); // if memory exceeds 7 chunks, delete the first item in wm.  does not account for bowing effect of primacy and recency
					return(true);
				} else {
					return(false);
				}
			
			} else { //the action is to pop 
			
				for (var i:int = 0; i < memory.length; i++) {
					if (memory[i].chunkName == chunk) {
						memory.splice(i, 1);
						break;
					}
				}
				
			}
			
			return(false);
		}
		
		//based on model human processor estimates. card moran and newell (pg 38) 
		//may update to reflect current ACT-R thinking, bowing effect in recall, etc
		public function updateProbabilityOfRecall(slot:int, timeChunkInMemoryInSeconds:Number):Number {
			if (memory[slot].probabilityOfRecall < .5) {
				memory.splice(slot, 1);
				return (.49) //remove the memory if less threshold
			}
			
			var yValue:Number;
			if (memory.cogLoad < 3) yValue = (timeChunkInMemoryInSeconds + 0.00000000000020000000) / -105.31; 
			else yValue = (timeChunkInMemoryInSeconds + 0.00000000000001000000) / -10.1;
			memory[slot].probabilityOfRecall = Math.pow(e, yValue); 
			
			return(memory[slot].probabilityOfRecall);
		}

	}
	
}
