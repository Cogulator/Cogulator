class ViewMenuHelper {
	constructor(){

        ipcRenderer.on('Toggle Line Numbers', (sender, arg) => {
			G.viewMenuHelper.toggleLineNumbers();
        })
        
        ipcRenderer.on('Toggle Goal Outline', (sender, arg) => {
			G.viewMenuHelper.toggleGoalOutline();
		})

    }

    toggleLineNumbers()
	{
		if($('#line_numbers_gutter').css('display') == 'block')
		{
			$('#line_numbers_gutter').css('display', 'none');
			$('#code').css('left','232px');
		}
		else
		{
			$('#line_numbers_gutter').css('display', 'block');
			$('#code').css('left','292px');
			G.qutterManager.numberLines();
		}
	}

	toggleGoalOutline()
	{
		if($('#goal_outline').css('display') == 'block')
		{
			$('#sidebar_left').css('height','100%');
			$('#goal_outline').css('display', 'none');
		}
		else
		{
			$('#sidebar_left').css('height','44%');
			$('#goal_outline').css('display', 'block');
			G.goalOutlineManager.updateGoalOutline();
		}
	}
}

G.viewMenuHelper = new ViewMenuHelper();