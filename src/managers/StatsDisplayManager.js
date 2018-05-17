$(function() {
    G.statsDisplayManager = new StatsDisplayManager();
});


class StatsDisplayManager {
	
	constructor() {
		$( document ).on( "GOMS_Processed", function(evt, taskTimeMS) {
		  G.statsDisplayManager.updateTaskTime(taskTimeMS);
		});
		
		$( document ).on( "Memory_Processed", function(evt, averageWM) {
		  G.statsDisplayManager.updateMemoryLoad(averageWM);
		});
	}
	
	
	updateTaskTime(taskTimeMS) {
		if (G.errorManager.errors.length > 0 || taskTimeMS == Infinity || taskTimeMS == -Infinity || isNaN(taskTimeMS)) {
			$('#stat_task_time').html("...");
		} else {
			let taskTimeSeconds = Math.round(taskTimeMS / 100)/10;
			$('#stat_task_time').html(taskTimeSeconds + " <span id='stat_task_time_units' class='stat_units'>s</span>");
		}
		
	}
	
	
	updateMemoryLoad(averageWM) {
		if (G.errorManager.errors.length > 0 || averageWM == Infinity || averageWM == -Infinity || isNaN(averageWM)) {
			$('#stat_wm_load').html("...");
		} else {
			let rounded = Math.round(averageWM * 10) / 10;
			$('#stat_wm_load').html(rounded + " <span id='stat_wm_units' class='stat_units'>chunks</span>");
		}
	}
	
	
	learningTime(seconds) {
		let rounded = Math.round(seconds * 10) / 10;
		$('#stat_learning_time').html(rounded + "<span id='stat_lrning_units' class='stat_units'>s</span>");
	}
}



	   
	   
	   
	   
	   