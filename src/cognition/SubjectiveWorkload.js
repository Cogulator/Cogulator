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

class SubjectiveMentalWorkload {
	//{chunkName: chunkName, activation: activation, stack: chunkStack}) from WorkingMemory
	constructor() {
		this.workload = [];
		this.maxWorkload = 1;
		
		$( document ).on( "Memory_Processed", function(evt, taskTimeMS) {
		  G.workload.setMentalWorkload(G.memory.rehearsals);
		});
	}

	setMentalWorkload(recalledChunks) {
		this.workload.length = 0;
		this.maxWorkload = 0;
		
		for (var i = 0; i < recalledChunks.length; i++) {
			let chunk = recalledChunks[i];
			var load = this.getWorkload(chunk.activation);
			this.workload.push({stack: chunk.stack, load: load});
			this.maxWorkload = Math.max(this.maxWorkload, load);
		}
		
		$( document ).trigger( "Subjective_Workload_Processed", [this.maxWorkload] ); //if max workload is 0, indicates there are no workload estimates in stack
	}

	getWorkload(activation) {

		if(activation <= -1.0)
		{
			return 10.0;
		}

		//from model fit in Workload Curve paper
		var load = -3.78 * Math.log(activation + 1) + 2.4793;

		// console.log("real load: " + load.toFixed(1));

		if (load > 10) return 10.0;
		if (load < 1) return 1.0;
		// return Math.round(load);
		return load.toFixed(1);
	}

}

G.workload = new SubjectiveMentalWorkload();
	
