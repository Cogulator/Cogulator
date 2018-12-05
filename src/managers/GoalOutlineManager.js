class GoalOutlineManager
{
    constructor() {
        
		//update the goal outline when the editor changes
		G.quill.on('editor-change', function(eventName) {
			G.goalOutlineManager.updateGoalOutline();
        });

    }

    updateGoalOutline()
    {
        $( '#goal_outline' ).empty();

		let titleHtml = "<div class='goal_outline_label'>GOAL OUTLINE</div>";
        $( '#goal_outline' ).append(titleHtml);

        //loop through each thread
        for (var key in G.gomsProcessor.thrdOrdr) {
			if (parseInt(key) > 2) continue; // right now only handle 3 threads, indexed at 0
            
			let threadSteps = G.gomsProcessor.intersteps.filter( function( step ) {
				let thread = G.gomsProcessor.thrdOrdr[key]
				return step.thread == thread; 
			});
            
			var goalInfos = [];
            var indexes = [];
            var outlineMap = [];
            var outlineList = [];

            var goalTimeMap = [];

            //loop through each step
            //
            //get each goal step and put it in the goalInfos array, goals are unique by goalIndex
            //
            //also calculate the length of the goal by using the start of the next goal as the end time of the current goal
			for (var i = 0; i < threadSteps.length; i++) { //second, remove steps that aren't unique
                
                let step = threadSteps[i];
                //this is a goal step that isn't in the goalInfos list yet
				if (!indexes.includes(step.goalIndex) && step.goalIndex != 0) {

                    // if(goalInfos.length > 0) {
                    //     //set the previous goalInfo's endTime to the start of this goal
                    //     goalInfos[goalInfos.length-1].endTime = step.startTime;
                    // }                   

                    //save this step as a goalInfo
                    goalInfos.push({goal:step, startTime:step.startTime, endTime:0, threadNum: parseInt(key)});
                    
                    //mark this goalIndex as found so we don't add it again
                    indexes.push(step.goalIndex);

                    //add this goal to the map for tracking how long a goal actually is
                    goalTimeMap[step.goal + "_" + (step.lineNo -1)] = {start:step.startTime, end:step.endTime};

				} else { //this is a step that isn't a goal
                    //update the end time for each goal of this step
                    // console.log(goalTimeMap);
                    Object.keys(step.goalMap).forEach(function(key) {
                        // console.log("updating goal: " + key);
                        if(key in goalTimeMap) {
                            goalTimeMap[key].end = step.endTime;
                        }
                    });
                }
            }

            //iterate over each goal and display it in the outline
            for(var i = 0; i < goalInfos.length; i++)
            {
                let goalInfo = goalInfos[i];
                let goal = goalInfo.goal;

                // let startTime = goalInfo.startTime;
                // let endTime = goalInfo.endTime;
                let startTime = goalTimeMap[goal.goal + "_" + (goal.lineNo -1)].start;
                let endTime = goalTimeMap[goal.goal + "_" + (goal.lineNo -1)].end;

                // console.log(goal.goal + "  start: " + startTime + "  end: " + endTime);

                let workload = 0.0;

                // get the workload from the chunks
                let memory = G.memory.workingmemory;
                for (var j = 0; j < memory.length; j++) {
                    let stack = memory[j];
                    
                    let time = j * 50;
                    
                    if(startTime > time) {
                        continue;
                    }
                    
                    //stop looping once we're past the goal time
                    if(endTime < time)
                    {
                        break;
                    }
                    
                    for (var k = 0; k < stack.length; k++) {
                        let chunk = stack[k];
                        
                        //update this goal's workload if there's a chunk that is associated with it
                        let stepGoal = goal.goal + "_" + (goal.lineNo - 1);
                        let load = parseFloat(G.workload.getWorkload(chunk.activation));
                        if(stepGoal in chunk.goalMap)
                        {
                            if(!isNaN(load))
            				{   
                                if(load > workload)
                                {
                                    workload = load;
                                }
                            }
                        }

                    }
                }

                //build a list of the outline order and a map of the outline data for later display
                let stepGoalID = goal.goal + "_" + (goal.lineNo - 1);
                outlineList.push(stepGoalID);  //ordered list of the outline
                outlineMap[stepGoalID] = {goal:goal, workload:workload, startTime:startTime, endTime:endTime};
                // console.log(goal);

                //update the workloads of the parent goals in the outline data map
                Object.keys(goal.goalMap).forEach(function(key) {
                    let value = goal.goalMap[key];
                    if(key in outlineMap && outlineMap[key].workload < workload) {
                        let newInfo = {goal:outlineMap[key].goal, workload:workload, startTime:outlineMap[key].startTime, endTime:outlineMap[key].endTime};
                        outlineMap[key] = newInfo;
                    }
                });
            }

            //itearte the outline data list to display the outline 
            for(var i = 0; i < outlineList.length; i++) {

                let outlineInfo = outlineMap[outlineList[i]];
                let goal = outlineInfo.goal;
                let workload = outlineInfo.workload;
                let startTime = outlineInfo.startTime;
                let endTime = outlineInfo.endTime;

                let lineNo = goal.lineNo;
                
                let buttonClass = "goal_button";
                let buttonId = "goal_" + lineNo;
                let title = "Line " + lineNo + "  Start: " + startTime + "ms  End: " + endTime;
        
                let indent = 8 * goal.indentCount;
                let width = 172 - indent;

                //button
                let html = "<div id='" + buttonId + "' class='" + buttonClass + "' title='" + title + "'>" +
                            "<div class='goal_label' style='left:"+ indent + "px; width:" + width + "px;'>" + "<span style='color: rgba(0, 0, 0, 1.0)'>(" + workload + ")</span>" + goal.goal + "</div>";
                            "</div>";
                $( '#goal_outline' ).append(html);
        
                $('#' + buttonId).click(function() {
                    // console.log("clicked " + buttonId);
        
                    let lines = G.quill.getLines(1, G.quill.getLength());
                    let line = lines[parseInt(goal.goalLineNo)];
                    let index = G.quill.getIndex(line);
        
                    let nextline = lines[parseInt(goal.goalLineNo) + 1];
                    let nextIndex = G.quill.getIndex(nextline);
        
                    let range = nextIndex - index;
        
                    //show the line in the editor
                    G.quill.setSelection(index, range);
        
                    let timeForGoal = startTime;
                    if(timeForGoal > 150)
                    {
                        timeForGoal = timeForGoal - 150;
                    }
        
                    //scroll the gantt chart to the right spot
                    $( document ).trigger( "GANTT_OPEN", [timeForGoal] );
                });
            }
        }
    }

}

G.goalOutlineManager = new GoalOutlineManager();
