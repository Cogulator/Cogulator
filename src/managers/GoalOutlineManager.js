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

        ///////
        // doing this block finds some goals that are skipped by the threadSteps list below 
        // like the first goal of the forgetting file and goals that have an immediate subgoal
        var goalTimeMap = [];
        var goalsIdsOrdered = [];

        //copy the goals to a new array for re-ordering
        var goalSteps = [];
        for (var i = 0; i < G.gomsProcessor.goalSteps.length; i++) {
            goalSteps.push(G.gomsProcessor.goalSteps[i][0]);
        }

        //reverse the array to put goals in correct order
        goalSteps.reverse();

        for (var i = 0; i < goalSteps.length; i++) {
            let step = goalSteps[i];

            //save the step order
            goalsIdsOrdered.push(step.goal + "_" + (step.lineNo));

            //add this goal to the map for tracking how long a goal actually is
            goalTimeMap[step.goal + "_" + (step.lineNo)] = {goal:step, start:step.startTime, end:step.endTime};
        }
        ///////

        //loop through each thread
        for (var key in G.gomsProcessor.thrdOrdr) {
			if (parseInt(key) > 2) continue; // right now only handle 3 threads, indexed at 0
            
			let threadSteps = G.gomsProcessor.intersteps.filter( function( step ) {
				let thread = G.gomsProcessor.thrdOrdr[key]
				return step.thread == thread; 
			});
			
            var indexes = [];
            var outlineMap = [];
            var outlineList = [];

            //loop through each step
            //
            //get each goal step and put it in the goalInfos array, goals are unique by goalIndex
			for (var i = 0; i < threadSteps.length; i++) { //second, remove steps that aren't unique
                
                let step = threadSteps[i];
                // console.log(step);
                //this is a goal step that isn't in the goalInfos list yet
				if (!indexes.includes(step.goalIndex)) {

                    //mark this goalIndex as found so we don't add it again
                    indexes.push(step.goalIndex);

                    //add this goal to the map for tracking how long a goal actually is
                    //since the step is not the goal, but the first step inside the goal, 
                    //the line number of goal may be any number of lines back (comments etc).
                    //check back using decrementing line number values to try and find the goal key in the map.
                    for(var lineNum = step.lineNo - 1; lineNum > 0; lineNum = lineNum - 1) {
                        let goalId = step.goal + "_" + lineNum;
                        if(goalId in goalTimeMap) {
                            goalTimeMap[goalId] = {goal:step, start:step.startTime, end:step.endTime};
                            break;
                        }
                    }

				} else { //this is a step that isn't a goal
                    //update the end time for each goal of this step
                    Object.keys(step.goalMap).forEach(function(key) {
                        if(key in goalTimeMap) {
                            goalTimeMap[key].end = step.endTime;
                        }
                    });
                }
            }

            //iterate over each goal and display it in the outline
            for(var i = 0; i < goalsIdsOrdered.length; i++)
            {
                let goalId = goalsIdsOrdered[i];
                let goal = goalTimeMap[goalId].goal;

                let startTime = goalTimeMap[goalId].start;
                let endTime = goalTimeMap[goalId].end;

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
                        let stepGoal = goalId;
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
                let stepGoalID = goalId;
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
                    if(timeForGoal == undefined) { 
                        //TODO: there is a bug in the code that interleaves the steps and calculates their start and end times.
                        //      this check is here to make sure any steps with undefined times don't break displaying the gantt chart
                        timeForGoal = 0;
                    }
                    else if(timeForGoal > 150) {
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
