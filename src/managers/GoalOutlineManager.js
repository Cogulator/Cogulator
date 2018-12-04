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

            //get each goal step and put it in the goalInfos array
            //also calculate the length of the goal by using the start of the next goal as the end time of the current goal
			for (var i = 0; i < threadSteps.length; i++) { //second, remove methods that aren't unique
				let method = threadSteps[i]; //this is actually a step, but all we care about is the method
				if (!indexes.includes(method.goalIndex) && method.goalIndex != 0) {

                    if(goalInfos.length > 0) {
                        //set the previous goalInfo's endTime to the start of this goal
                        goalInfos[goalInfos.length-1].endTime = method.startTime;
                    }                   

					goalInfos.push({goal:method, startTime:method.startTime, endTime:0, threadNum: parseInt(key)});
                    indexes.push(method.goalIndex);
				}
            }

            //iterate over each goal and display it in the outline
            for(var i = 0; i < goalInfos.length; i++)
            {
                let goalInfo = goalInfos[i];
                let goal = goalInfo.goal;

                let workload = 0.0;

                let startTime = goalInfo.startTime;
                let endTime = goalInfo.endTime;

                // get the workload from the chunks
                let memory = G.memory.workingmemory;
                for (var j = 0; j < memory.length; j++) {
                    let stack = memory[j];
                    for (var k = 0; k < stack.length; k++) {
                        let chunk = stack[k];
                        if(chunk == null) {
                            continue;
                        }
                        
                        //stop looping once we're past the goal time
                        if(startTime > chunk.addedAt || endTime < chunk.addedAt)
                        {
                            break;
                        }
                        
                        //update this goal's workload if there's a chunk that is associated with it
                        let stepGoal = goal.goal + "_" + (goal.lineNo - 1);
                        if(stepGoal in chunk.goalMap)
                        {
                            let load = parseFloat(G.workload.getWorkload(chunk.activation));
                            if(load > workload)
                            {
                                workload = load;
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
