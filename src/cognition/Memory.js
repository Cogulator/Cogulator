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

$(function() {
    G.memory = new Memory();
});

class Memory {
	
	constructor() {
		this.initialRehearsal = 3;
		this.recallThreshold = 0.5;
		this.chunkThreshold = 7;

		this.interleavedSteps = [];
		this.colorPalette = ['#2AA198', '#268BD2', '#6C71C4', '#D33682', '#DC322F', '#CB4B16', '#CB4B16', '#B58900'];
		this.fromStack = 0;
		//this.longTermMemory = []; // Dictionary();

		this.workingmemory = [];
		this.rehearsals = []; //used by SubjectiveMentalWorkload
		this.averageLoad = 0.0
		this.overloadedStacks = [];
		
		$( document ).on( "GOMS_Processed", function(evt, taskTimeMS) {
		  G.memory.fire(taskTimeMS);
		});
	}


	fire(taskTimeMS) {
        //reset everything
		this.interleavedSteps.length = 0;
		this.colorPalette = ['#2AA198', '#268BD2', '#6C71C4', '#D33682', '#DC322F', '#CB4B16', '#CB4B16', '#B58900'];
		this.fromStack = 0;

		this.workingmemory.length = 0;
		this.rehearsals.length = 0;
		this.averageLoad = 0.0
		this.overloadedStacks.length = 0;
        
		//start processing
		var intersteps = G.gomsProcessor.intersteps;

		var totalCycles = (Math.round(taskTimeMS / 50) * 50) / 50;
		if (totalCycles == 0) {
			$( document ).trigger( "Memory_Processed", [this.averageLoad] );
			return;
		}
		
		//populate a working memory array with empty arrays
		for (var i = 0; i < totalCycles + 1; i++) this.workingmemory.push([]); ; //initialize the stacks within memory (one for each 50ms cycle)
        
		this.interleavedSteps.length = 0;
		for (var i = 0; i < intersteps.length; i++) this.interleavedSteps.push(intersteps[i]);

//		this.interleavedSteps.sort(function(a, b){
//			return a.endTime-b.endTime;
//		});
        
		for (var i = 0; i < this.interleavedSteps.length; i++) {
			var step = this.interleavedSteps[i];
            
            var toTime = step.endTime;
            if (i + 1 < this.interleavedSteps.length) {
                let nextStep = this.interleavedSteps[i+1];
                if (nextStep.startTime < step.endTime) toTime = nextStep.startTime;
            }
            
            //basically want you want to do is go to the end of this step time, or the start of the next step end time... whichever is earliest
			var stackToAddChunk = this.findChunkStackAtTime(step.endTime);
            if (step.chunkNames.length == 0 || step.operator == "ignore") this.decayMemory(stackToAddChunk);
			//this.decayMemory(stackToAddChunk);

			var isWmOperator = this.isWorkingMemoryOperator(step.operator, step.resource, false); //set to false if you don't want to automate working memory
			if (step.chunkNames.length > 0) {
                
				isWmOperator = this.isWorkingMemoryOperator(step.operator, step.resource, true); //count any operators if chunk name is inserted
				for (var j = 0; j < step.chunkNames.length; j++) {
					var chunkName = step.chunkNames[j];
					if (step.operator == "ignore") {
						this.popChunkWithName(chunkName, stackToAddChunk); //remove from stack... no questions asked
					} else { //attempt to push chunk to stack
                        
                        // START TEST //
                        //if there is more than one chunk, we'll distribute them evenly across the step time
                        var chunkAction;
                        if (step.chunkNames.length == 1 || step.time <= 50) {
                            this.decayMemory(stackToAddChunk);
                            chunkAction = this.pushChunk(isWmOperator, step.operator, chunkName, stackToAddChunk, step); 
                            
                        } else {
                            var addAt = (step.time / step.chunkNames.length) * j + step.startTime;
                            
                                addAt = Math.max(50, addAt);
                                addAt = Math.max(step.startTime, addAt);
                                addAt = Math.min(step.endTime, addAt);
                            let stackAt = this.findChunkStackAtTime(addAt);
                                                        
                            this.decayMemory(stackAt);
                            chunkAction = this.pushChunk(isWmOperator, step.operator, chunkName, stackAt, step); 
                            
                        }
                        // END TEST //
                        
						//var chunkAction = this.pushChunk(isWmOperator, step.operator, chunkName, stackToAddChunk, step); //can add multiple chunks simultaneously... not realistic, but maybe passable
					}
				}
                
                //if (step.operator != "ignore" && step.time > 50 && step.chunkNames.length > 1) this.decayMemory(stackToAddChunk); 
			} else if (isWmOperator) {
				this.pushChunk(true, step.operator, "", stackToAddChunk, step);
			}
		}

		this.averageLoad = this.getAverageLoad();
		$( document ).trigger( "Memory_Processed", [this.averageLoad] );
	}


	pushChunk(isWmOperator, operator, chunkName, chunkStack, step) {    
		var rehearsals = this.initialRehearsal;
		if (operator == "recall") rehearsals = 10; //if recalling from LTM, and not already an existing chunk, assume an initial level of rehearsal that's fairly high
        
		var chunkAction = ""
		var atTime = step.endTime;

		var existingChunk = null;
		if (chunkName != "") existingChunk = this.getExistingChunk(operator, chunkName, chunkStack);
        if (existingChunk == null) existingChunk = this.getExistingChunk(operator, chunkName, chunkStack + 1); //Temporary solution. Memory is only modeled on 50ms cycles.  But steps can happen at in time.  This prevents a memory error from off-cycle steps

		if (chunkName == "" || (!existingChunk && isWmOperator)) {
			var chunk = new Chunk(chunkName, atTime, -1, rehearsals, 1, this.colorPalette[0], step.lineNo); //name, addTime, stackHeight, rehearsals, recallProb, color
			chunk.activation = this.getActivation(chunkStack, this.getTimeChunkInMemoryInSeconds(chunkStack, atTime), rehearsals);
			chunk.goal = step.goal;
			chunk.goalMap = step.goalMap;
			if (this.workingmemory.length > chunkStack) {	
				this.workingmemory[chunkStack].push(chunk);
				this.colorPalette.push(this.colorPalette[0]); //place the current color at end of list
				this.colorPalette.shift(); // remove the current color from begninning of list
			}
		} else if (existingChunk && isWmOperator) { //chunks in lines like Say or Type, will be color coded and tested for memory availablity, but they don't add activation
            if (operator == "attend") { //attend to item in memory.  setup this way to provide subjective workload estimate base on memory availabity.  all other cog ops presume rehearsal
                var timeInMemory = this.getTimeChunkInMemoryInSeconds(chunkStack, existingChunk.addedAt);
                var activation = this.getActivation(existingChunk.stackDepthAtPush, timeInMemory, existingChunk.rehearsals)
                this.pushRehearsals(chunkName, activation, chunkStack);
                chunkAction = "pushed_rehearsals";
                existingChunk.goalMap = step.goalMap;
            } else {
                this.addRehearsalToChunk(chunkName, chunkStack);
            }
		} else if (existingChunk) { //push to rehearsals so Mental Workload can be calculated
			var timeInMemory = this.getTimeChunkInMemoryInSeconds(chunkStack, existingChunk.addedAt);
			var activation = this.getActivation(existingChunk.stackDepthAtPush, timeInMemory, existingChunk.rehearsals)
			this.pushRehearsals(chunkName, activation, chunkStack); //used by SubjectiveMentalWorkload
			
            chunkAction = "pushed_rehearsals";
			existingChunk.goalMap = step.goalMap;
		} else if (!existingChunk) {
			G.errorManager.errors.push(new GomsError("forgetting_error", step.lineNo, "Trying to recall " + chunkName + ", but it is not in memory. It was either never put in memory, or forgotten.  You can add to memory with Store operator.", chunkName));
		}

		return chunkAction;
	}


	decayMemory(toStack) {
		for (var i = this.fromStack; i < toStack; i++) {
			var stack = this.workingmemory[i - 1];
            			
			//carry over the chunk from the previous cycle if recall probability greater than 0.5
			if (stack != undefined) {
				for (var j = 0; j < stack.length; j++) {
					var chunk = stack[j];
                    
                    //check to see if the chunk already exists in the stack your pushing to.  This can happen with multitasking when multiple chunks are distributed evenly across step time
                    var alreadyExists = false;
                    let targetStack = this.workingmemory[i];
                    for (var itr = 0; itr < targetStack.length; itr++) {
                        if (targetStack[itr].chunkName == chunk.chunkName) {
                            alreadyExists = true;
                            break;
                        }
                    }
                    
                    if (alreadyExists) continue;
                    
					//set the chunk stack set if not set already
					if (chunk.stackDepthAtPush == -1) chunk.stackDepthAtPush = stack.length; //uses the previous cycle stack depth;
					var timeChunkInMemoryInSeconds = this.getTimeChunkInMemoryInSeconds(i, chunk.addedAt);
					var recallProbability = this.getProbabilityOfRecall(chunk.stackDepthAtPush, timeChunkInMemoryInSeconds, chunk.rehearsals);
					if (recallProbability > 1) recallProbability = 0.999; //rounding time sometimes results in recall > 1

					if (recallProbability > this.recallThreshold) {
						var updatedChunk = new Chunk(chunk.chunkName, chunk.addedAt, chunk.stackDepthAtPush, chunk.rehearsals, recallProbability, chunk.color, chunk.lineNumber); //name, addTime, stackHeight, accessCount, recallProb, color
						updatedChunk.activation = this.getActivation(chunk.stackDepthAtPush, timeChunkInMemoryInSeconds, chunk.rehearsals);
						updatedChunk.goal = chunk.goal;
						updatedChunk.goalMap = chunk.goalMap
						if (this.workingmemory[i] != undefined) this.workingmemory[i].push(updatedChunk); //occasionally getting undefined with last stack...
					}
				}
			}

			//after carrying over the chunks from the previous cycle, pop those with lowest recall probability if load is greater than 7
			if (this.workingmemory[i] != null) {
				while (this.workingmemory[i].length > this.chunkThreshold) {
					this.popChunk(i);
					this.overloadedStacks.push(i);
				}
			}
		}

		this.fromStack = toStack;
	}		


	//Method to pop weakest chunk.  Used to be the oldest chunk.
	popChunk(cycleIndex) {
        var indexForWeakestChunk = -1
		var weakestActivation = 1000000000.0;

		for (var i = 0; i < this.workingmemory[cycleIndex].length; i++) {
			if (this.workingmemory[cycleIndex][i].activation < weakestActivation) {
				weakestActivation = this.workingmemory[cycleIndex][i].activation;
				indexForWeakestChunk = i;
			}
		}

		this.workingmemory[cycleIndex].splice(indexForWeakestChunk, 1);
	}


	//Method to pop named chunk
	popChunkWithName(chunkName, cycleIndex) {
		cycleIndex--;
		for (var i = 0; i < this.workingmemory[cycleIndex].length; i++) {
			var chunk = this.workingmemory[cycleIndex][i];
			if (chunk.chunkName == chunkName) {
				//this.longTermMemory[chunk.chunkName] = chunk;
				this.workingmemory[cycleIndex].splice(i, 1);
				break;
			}
		}
	}


	//Determine if the chunk is ever referenced again later in the steps array
	attendToChunkInFuture(chunkName, startIndex) {
		startIndex++;
		for (var i = startIndex; i < this.interleavedSteps.length; i++) {
			for (var j = 0; j <  interleavedSteps[i].chunkNames.length; j ++) {
				var chunk = interleavedSteps[i].chunkNames[j];
				if (chunk == chunkName) return true;
			}
		}
		return false;
	}


	//based on ACT-R & Workload Curve paper
	getProbabilityOfRecall(cogLoad, timeChunkInMemoryInSeconds, rehearsals) {
		const τ =  -1  //threshold	
		const s = 0.2; //noise

		var m = this.getActivation(cogLoad, timeChunkInMemoryInSeconds, rehearsals); //activation
		var p = 1 / (  1 + Math.pow(Math.E,( (τ - m) / s) )  ); //probability of recall

		return p;
	}	


	//based on ACT-R & Workload Curve paper
	getActivation(cogLoad, timeChunkInMemoryInSeconds, rehearsals) {
		var m = Math.log(rehearsals/Math.sqrt(timeChunkInMemoryInSeconds)); //activation
            m = (m + 1 / cogLoad) - 1; //activation divided among all chunks
		return m;
	}


	addRehearsalToChunk(chunkName, stack) {
		for (var i = 0; i < this.workingmemory[stack - 1].length; i++) {
			var chunk = this.workingmemory[stack - 1][i];
			if (chunk.chunkName == chunkName) {
				chunk.rehearsals++;
				return;
			}
		}
	}

	
	pushRehearsals(chunkName, activation, chunkStack) {
		//If multiple rehearsals in stack, only want the lowest activation one.  Used by SubjectiveMentalWorkload to calculate load at recall
		for (var i = 0; i < this.rehearsals.length; i++ ){
			var chunk = this.rehearsals[i];
			if (chunk.stack == chunkStack) {
				if (activation < chunk.activation) {
					chunk.activation = activation;
					chunk.chunkName = chunkName;
				}
				return;
			}
		}
		this.rehearsals.push({chunkName: chunkName, activation: activation, stack: chunkStack});
	}
	

	getTimeChunkInMemoryInSeconds(stack, addedAt) {
		var currentCycleTimeInSeconds = (stack * 50) / 1000;
		var timeInMemory = currentCycleTimeInSeconds - (addedAt / 1000);
		if (timeInMemory > 0) return timeInMemory;
		else return .00001;
	}


	getAverageLoad() {
		var totalChunks = 0;
		for (var i = 0; i < this.workingmemory.length; i++) {
			var stack = this.workingmemory[i];
			totalChunks += stack.length;
		}
		return totalChunks / this.workingmemory.length;
	}


	findChunkStackAtTime(atTime) {
		var roundUpFactor = 0;
		if (atTime % 50 != 0) roundUpFactor = 50 - (atTime % 50);
		var roundedUpTime = atTime + roundUpFactor;
		return (roundedUpTime / 50);
	}


	isWorkingMemoryOperator(operator, resource, chunkNamed) {
		if (chunkNamed) { //if this includes a named chunk
			if ((resource == "see" || resource == "hear" || resource == "cognitive") && operator != "saccade" && operator != "verify") {
				return true;
			}
		} 
			
        if (operator == "store" || operator == "recall") {
            return true;
        }
        
		return false;
	}

	
	getExistingChunk(operator, chunkName, stack) {			
		//first check to see if the chunk exists in WM
		for (var i = 0; i < this.workingmemory[stack - 1].length; i++) {
			var chunk = this.workingmemory[stack - 1][i];
			if (chunk.chunkName == chunkName) return chunk;
		}

		//if not in WM, check to see if LTM
        //-- NOTE: Right now, I'm not sure about this at all
        //         If you restore anything that was ever in LTM you essentially get infinite memory.
        //         For the time being, it'll only pull stuff out of LTM with cognitive operators.
        //         Otherwise, the chunk needs to be at > 50% probability of recall.
//        if (operator.resource == "cognitive") {
//            if (this.longTermMemory[chunkName] != undefined) {
//                if (this.workingmemory[stack - 1].length >= 7) {
//                    this.popChunk(stack - 1);
//                }
//                this.workingmemory[stack - 1].push(this.longTermMemory[chunkName]);
//                return this.longTermMemory[chunkName]
//            }
//        }
        
		return null;
	}

}

