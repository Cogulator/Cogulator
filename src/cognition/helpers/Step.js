﻿/*******************************************************************************
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

class Step {
		
	constructor (ic, gl, thrd, indx, oprtr, tm, rsrce, lbl, ln, pln, cn) {
		// constructor code
		this.indentCount = ic;
		this.goal = gl;
		this.thread = thrd;
		this.goalIndex = indx;
		this.operator = oprtr;
		this.time = tm;
		this.resource = rsrce;
		this.label = lbl;
		this.lineNo = ln;
		this.prevLineNo = pln;
		this.chunkNames = [];
		
		if (cn == null) return;
		for (var i = 0; i < cn.length; i ++) { //create new array to save value and not reference to array
			this.chunkNames.push(cn[i]);
		}
	}

}
