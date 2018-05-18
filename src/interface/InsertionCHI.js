class InsertionCHI {
	constructor() {
		$(document).on("click", ".insertion_marker", function() {
			let lineNumber =  $(this).data("line");
			G.insertionCHI.show(lineNumber);
		});
		
		//set up to hide on resize or scroll
		$( window ).resize(function() {
			G.insertionCHI.hide();
		});
	}
	
	
	show(atLine) {
		let offset = $(".insertion_marker").offset();
		let top = offset.top + 20;
		let left = offset.left - 10;
		let width = G.insertionCHI.getWidth();
		
		$('#insertion_container').offset({top: top, left: left});
		$('#insertion_container').css({"width": width + "px"});
		$('#insertion_container').css({"visibility": "visible"});
		
	}
	
	
	hide() {
		$('#insertion_container').css({"visibility": "hidden"});
	}
	
	
	getHTML() {
		return html;
		
	}
	
	
	getWidth() {
		var visibleScrollbars = window.scrollbars.visible;
		console.log(visibleScrollbars);
		if ($('#gutter').hasScrollBar()) return $("#gutter").width() + $("#code").width() - 10;
		return ($("#gutter").width() + $("#code").width() + 18);
	}
}
	
G.insertionCHI = new InsertionCHI();


(function($) {
    $.fn.hasScrollBar = function() {
        return this.get(0).scrollHeight > this.height();
    }
})(jQuery);
