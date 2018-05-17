class ReloadManager {
	constructor() {
		$('#reload_model_button_container').click(function() {
			G.modelEvents.triggerSingleline();
			
			var $this = $(this);
			$this.removeClass('rotate_360');
			$this = G.reload.reset($this);
			$this.addClass('rotate_360');
		});
	}
	
	reset($elem) {
		$elem.before($elem.clone(true));
		var $newElem = $elem.prev();
		$elem.remove();
		return $newElem;
	}
}

G.reload = new ReloadManager();