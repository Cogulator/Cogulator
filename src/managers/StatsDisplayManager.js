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
		
		$( document ).on( "Subjective_Workload_Processed", function(evt, maxWorkload) {
			G.statsDisplayManager.updateWorkload(maxWorkload);
		});
	}
	
	
	updateTaskTime(taskTimeMS) {
		if (G.errorManager.errors.length > 0) {
			$('#stat_task_time').html("x_x");
		} else if (taskTimeMS == Infinity || taskTimeMS == -Infinity || isNaN(taskTimeMS)) {
			$('#stat_task_time').html("--");
		} else {
			let taskTimeSeconds = Math.round(taskTimeMS / 100)/10;
			$('#stat_task_time').html(taskTimeSeconds + " <span id='stat_task_time_units' class='stat_units'>s</span>");
		}
		
	}
	
	
	updateMemoryLoad(averageWM) {
		if (G.errorManager.errors.length > 0) {
			$('#stat_wm_load').html("x_x");
		} else if (averageWM == 0 || averageWM == Infinity || averageWM == -Infinity || isNaN(averageWM)){
			$('#stat_wm_load').html("--");
		} else {
			let rounded = Math.round(averageWM * 10) / 10;
			$('#stat_wm_load').html(rounded + " <span id='stat_wm_units' class='stat_units'>chunks</span>");
		}
	}
	
	
	updateWorkload(maxWorkload) {
		if (maxWorkload == 0) {
			this.hideWorkload();
		} else if (G.errorManager.errors.length > 0) {
			this.hideWorkload();
			$('#stat_workload').html("x_x");
		} else {
			this.showWorkload();
			//$('#stat_workload').html(maxWorkload + " <span id='stat_workload_units' class='stat_units'>(1-10)</span>");
			// $('#stat_workload').html(this.fuzzyishWorkoad(maxWorkload));
			$('#stat_workload').html(maxWorkload);
		}
	}
	
	
	hideWorkload() {
		if ($('#stat_workload_nav_item').css('display') == 'none') return;
		$('#stat_wm_container').removeClass('right_border');
		$('#stat_workload_nav_item').fadeOut('slow');
	}
	
	showWorkload() {
		if ($('#stat_workload_nav_item').css('display') != 'none') return;
		$('#stat_wm_container').addClass('right_border');
		$('#stat_workload_nav_item').fadeIn('slow');
	}
	
	fuzzyishWorkoad(maxWorkload) {
		if (maxWorkload <= 4) return "Low";
		else if (maxWorkload <= 6) return "Moderate";
		else if (maxWorkload >= 7) return "High";
	}
}



	   
	   
	   
	   
	   