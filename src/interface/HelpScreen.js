class HelpScreen {
	constructor(){
		this.images = ['./images/help_1.png', './images/help_2.png', './images/help_3.png', './images/help_4.png', './images/help_5.png', './images/help_6.png','./images/help_7.png'];
		this.index = 0;
		
		this.leftNavHTML = "<div id='help_left_nav_button' class='circle_button help_nav_button'>&lt;</div>";
		this.rightNavHTML = "<div id='help_right_nav_button' class='circle_button help_nav_button'>&gt;</div>";
		
		ipcRenderer.on('Help->Quick Start', (sender, arg) => {
			G.helpScreen.show();
		})
		
		$('#help_close_button').click(function() {
			G.helpScreen.hide();
		});
		
		$( document ).on( "click", "#help_left_nav_button", function() {
		  	G.helpScreen.previous();
		});
		
		$( document ).on( "click", "#help_right_nav_button", function() {
			G.helpScreen.next();
		});
	}
	
	setImage(){
		let style = "max-height: 90%; max-width: 90%; position: flex; top: 0; bottom: 0; left: 0; right: 0; margin: auto";
		$('#help_image').html("<img src='" + this.images[this.index] + "' style='" + style + "'>");
		$('#help_nav').html(this.leftNavHTML + " " + (this.index + 1) + " of " + this.images.length + " " + this.rightNavHTML);
	}
	
	show() {
		$('#help_container').css("visibility", "visible");
		this.setImage();
	}
				
	next() {
		this.index++;
		if (this.index >= this.images.length) this.index = 0;
		this.setImage();
	}
	
	previous() {
		this.index--;
		if (this.index < 0) this.index = this.images.length - 1;
		this.setImage();
	}
	
	hide() {
		$('#help_image').empty();
		$('#help_container').css("visibility", "hidden");
	}
}

G.helpScreen = new HelpScreen();
