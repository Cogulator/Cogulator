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

        //copy the goals to a new array for re-ordering
        var goalSteps = [];
        for (var i = 0; i < G.gomsProcessor.goalSteps.length; i++) {
            goalSteps.push(G.gomsProcessor.goalSteps[i][0]);
        }

        //reverse the array to put goals in correct order
        goalSteps.reverse();

		//look at each step
		for (var i = 0; i < goalSteps.length; i++) {

            let step = goalSteps[i];
            // console.log("finding workload for goal " + step.goal);

            //iterate through the chunks to find the activation and load of this goal
            let memory = G.memory.workingmemory;
            let workload = 0.0;
            let timeForGoal = undefined;
            for (var k = 0; k < memory.length; k++) {
                let stack = memory[k];
                for (var j = 0; j < stack.length; j++) {
                    let chunk = stack[j];
                    // console.log(chunk);
                    if(step.goal in chunk.goalMap)
                    {
                        let load = parseFloat(G.workload.getWorkload(chunk.activation));
                        if(load > workload)
                        {
                            workload = load;
                        }

                        if(timeForGoal == undefined || chunk.addedAt < timeForGoal) {
                            timeForGoal = chunk.addedAt;
                        } 

                        // if(workload >= 10.0)
                        // {
                        //     break;
                        // }
                    }
                }
            }

            // console.log("workload for step: " + step.goal + "  is " + workload);
            // console.log(step);

            let lineNo = step.lineNo;

            // console.info("step: " + step.goal + "   goalIndex: " + step.goalIndex + "  ic: " + step.indentCount + "  line: " + lineNo);

            let buttonClass = "goal_button";
            let buttonId = "goal_" + lineNo;

            let indent = 8 * step.indentCount;
            let width = 172 - indent;

            //button
            let html = "<div id='" + buttonId + "' class='" + buttonClass + "'>" +
                        "<div class='goal_label' style='left:"+ indent + "px; width:" + width + "px;'>" + "<span style='color: rgba(0, 0, 0, 1.0)'>(" + workload + ")</span>" + step.goal + "</div>";
                        "</div>";
            $( '#goal_outline' ).append(html);

            $('#' + buttonId).click(function() {
                // console.log("clicked " + buttonId);

                let lines = G.quill.getLines(1, G.quill.getLength());
                let line = lines[parseInt(step.goalLineNo)];
                let index = G.quill.getIndex(line);

                let nextline = lines[parseInt(step.goalLineNo) + 1];
                let nextIndex = G.quill.getIndex(nextline);

                let range = nextIndex - index;

                //show the line in the editor
                G.quill.setSelection(index, range);

                if(timeForGoal > 50)
                {
                    timeForGoal = timeForGoal - 50;
                }

                //scroll the gantt chart to the right spot
                $( document ).trigger( "GANTT_OPEN", [timeForGoal] );
            });

		}
	}
}


G.goalOutlineManager = new GoalOutlineManager();