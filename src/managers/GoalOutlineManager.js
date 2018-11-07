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

		var goals = [];

		//TODO: instead of going through all the steps, we need a way to just get a list of goals.
		//      maybe we make a goal object to store in the goms processor and use it instead

		//get the intersteps and copy them to a new array
		var intersteps = G.gomsProcessor.intersteps;
		var interleavedSteps = [];
		interleavedSteps.length = 0;
		for (var i = 0; i < intersteps.length; i++) {
			interleavedSteps.push(intersteps[i]);
		}

		//look at each step
		for (var i = 0; i < interleavedSteps.length; i++) {
			let step = interleavedSteps[i];

			if(step.goal != "none" && !goals.includes(step.goal))
			{
				let lineNo = step.lineNo;

				// console.info("step: " + step.goal + "   goalIndex: " + step.goalIndex + "  ic: " + step.indentCount + "  line: " + lineNo);

				let buttonClass = "goal_button";
				let buttonId = "goal_" + lineNo;

				let indent = 8 * step.indentCount;
				let width = 172 - indent;

				//button
				let html = "<div id='" + buttonId + "' class='" + buttonClass + "'>" +
							"<div class='goal_label' style='left:"+ indent + "px; width:" + width + "px;'>" + step.goal + "</div>";
							"</div>";
				$( '#goal_outline' ).append(html);

				$('#' + buttonId).click(function() {
					console.log("clicked " + buttonId);

					let lines = G.quill.getLines(1, G.quill.getLength());
					let line = lines[parseInt(step.goalLineNo)];
					let index = G.quill.getIndex(line);

					let nextline = lines[parseInt(step.goalLineNo) + 1];
					let nextIndex = G.quill.getIndex(nextline);

					let range = nextIndex - index;

					G.quill.setSelection(index, range);
				});

				goals.push(step.goal);
			}
			

		}
	}
}


G.goalOutlineManager = new GoalOutlineManager();