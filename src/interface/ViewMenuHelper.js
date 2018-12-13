class ViewMenuHelper {
	
	constructor(){

		this.lineNumberMatches = [];
		this.currentShowingMatch = 0;
		this.currentTextToMatch = "";

		this.findTextMatchCase = false;
		this.findTextMatchWhole = false;

        ipcRenderer.on('Toggle Line Numbers', (sender, arg) => {
			G.viewMenuHelper.toggleLineNumbers();
        })
        
        ipcRenderer.on('Toggle Goal Outline', (sender, arg) => {
			G.viewMenuHelper.toggleGoalOutline();
		})

		ipcRenderer.on('Toggle WM Operator Workloads', (sender, arg) => {
			G.viewMenuHelper.toggleWMWorkloads();
		})

		ipcRenderer.on('Find in Editor', (sender, arg) => {
			G.viewMenuHelper.showFindControls();
		})

		ipcRenderer.on('Close find', (sender, arg) => {
			G.viewMenuHelper.hideFindControls();
		})

		//init find text controls callbacks
		$('#find_text_input').keyup(function(e){
			if(e.keyCode == 13)
			{
				G.viewMenuHelper.findTextInEditor($('#find_text_input').val());
			}
		});

		$('#find_text_match_case').click(function() {
			if(!$('#find_text_match_case').hasClass('selected_border')) {
				$('#find_text_match_case').addClass('selected_border');
				G.viewMenuHelper.findTextMatchCase = true;
			} else {
				$('#find_text_match_case').removeClass('selected_border');
				G.viewMenuHelper.findTextMatchCase = false;
			}
			G.viewMenuHelper.findTextInEditor($('#find_text_input').val());
		});

		$('#find_text_match_whole').click(function() {
			if(!$('#find_text_match_whole').hasClass('selected_border')) {
				$('#find_text_match_whole').addClass('selected_border');
				G.viewMenuHelper.findTextMatchWhole = true;
			} else {
				$('#find_text_match_whole').removeClass('selected_border');
				G.viewMenuHelper.findTextMatchWhole = false;
			}
			G.viewMenuHelper.findTextInEditor($('#find_text_input').val());
		});

		$('#find_text_prev').click(function() {
			G.viewMenuHelper.showPreviousMatch();
		});

		$('#find_text_next').click(function() {
			G.viewMenuHelper.showNextMatch();
		});

		$('#find_text_close').click(function() {
			G.viewMenuHelper.hideFindControls();
		});

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

	toggleWMWorkloads()
	{
		$( document ).trigger( "WM_OPERATOR_WORKLOADS" );
	}

	showFindControls()
	{
		$( "#find_text_container" ).slideDown( "fast" );
		$('#find_text_input').focus();
	}

	hideFindControls()
	{
		$( "#find_text_container" ).hide();
	}

	findTextInEditor(text)
	{
		if(text == undefined || text == "") 
		{
			return;
		}

		//save to check for changes later when using the next and prev buttons
		this.currentTextToMatch = text;

		var regex = this.buildRegex(text, true);

		this.lineNumberMatches = [];
		this.currentShowingMatch = 0;

		//try to match each line of code
		var codeLines = G.quill.getText().split("\n");
		for (var lineIndex = 0; lineIndex < codeLines.length; lineIndex++) {
			let line = codeLines[lineIndex];
			
			//if this line is empty, continue
			if (line.match(/[a-z]/gmi) == null) {
				continue;
			}

			//find matches on each line
			let matches = line.match(regex);
			if(matches != null) {
				let offset = 0;
				for(var i = 0; i < matches.length; i++) {

					let linePart = line.substring(offset);
					let regexForLine = this.buildRegex(text, false);
					let match = linePart.match(regexForLine);

					this.lineNumberMatches.push({text:text, lineIndex:lineIndex, index:(match.index + offset)});

					offset += match.index + text.length;
				}
			}
		}

		
		if(this.lineNumberMatches.length > 0) 
		{
			//update the results text
			$('#find_text_results').text((this.currentShowingMatch + 1) + " of " + this.lineNumberMatches.length);

			//show the first match
			let lineNumberMatch = this.lineNumberMatches[0];

			G.quillManager.selectText(lineNumberMatch.lineIndex, lineNumberMatch.index, lineNumberMatch.text.length); //TODO: change this to highlight the text instead of select it
		}
		else
		{
			//update the results text
			$('#find_text_results').text("0 of 0");
		}
	}

	buildRegex(text, global) {

		let regexText = text;
		//if match whole selected
		if(this.findTextMatchWhole) {
			regexText = "\\b" + text + "\\b";
		}

		if(global) {
			//default: case insensitive
			var regex = new RegExp(regexText, 'ig');

			//if match case selected
			if(this.findTextMatchCase) {
				regex = new RegExp(regexText, 'g');
			}

			return regex;
		} else {
			//default: case insensitive
			var regex = new RegExp(regexText, 'i');

			//if match case selected
			if(this.findTextMatchCase) {
				regex = new RegExp(regexText);
			}

			return regex;
		}
		
	}

	showNextMatch()
	{
		//if someone types in the input, then clicks next, this will find that value
		if($('#find_text_input').val() != this.currentTextToMatch) {
			this.findTextInEditor($('#find_text_input').val());
			return;
		}

		//find the next match
		if(this.lineNumberMatches.length > 0) {
			let matchToShow = this.currentShowingMatch + 1;
			if(matchToShow >= this.lineNumberMatches.length) {
				matchToShow = 0;
			}

			let match = this.lineNumberMatches[matchToShow];
			G.quillManager.selectText(match.lineIndex, match.index, match.text.length); //TODO: change this to highlight the text instead of select it
			this.currentShowingMatch = matchToShow;

			//update the results text
			$('#find_text_results').text((this.currentShowingMatch + 1) + " of " + this.lineNumberMatches.length);
		}
	}

	showPreviousMatch()
	{
		//if someone types in the input, then clicks next, this will find that value
		if($('#find_text_input').val() != this.currentTextToMatch) {
			this.findTextInEditor($('#find_text_input').val());
			return;
		}

		//find the previous match
		if(this.lineNumberMatches.length > 0) {

			let matchToShow = this.currentShowingMatch - 1;
			if(matchToShow < 0) {
				matchToShow = this.lineNumberMatches.length - 1;
			}

			let match = this.lineNumberMatches[matchToShow];
			G.quillManager.selectText(match.lineIndex, match.index, match.text.length); //TODO: change this to highlight the text instead of select it
			this.currentShowingMatch = matchToShow;
		
			//update the results text
			$('#find_text_results').text((this.currentShowingMatch + 1) + " of " + this.lineNumberMatches.length);
		}
	}
}

G.viewMenuHelper = new ViewMenuHelper();