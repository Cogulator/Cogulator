class ScreenShotManager {
	constructor(processingSketch) {
		this.source = processingSketch;
		
		this.destination = document.createElement('canvas');
		this.destination.setAttribute('id', 'screenshot_canvas');
		
		this.context = this.destination.getContext('2d');
	}
	
	
	new(sourceX, sourceY, width, height, scale, time) {
		this.width = width;
		this.height = height;
		this.scale = scale;
		this.time = time;
		this.cycles = Math.ceil(this.time /this.scale);
		
		this.sourceX = sourceX;
		this.sourceY = sourceY;
		
		this.destination.width = this.width * this.cycles + this.sourceX; //this.sourceX allows room for label;
		this.destination.height = this.height;
		
		this.destinationX = 0;
		this.destinationY = 0;
		
		this.context = this.destination.getContext('2d');
		this.sourceTime = 0;
		
		this.ready = false; //ready to save picture
		this.active = false;
		
		this.label();
	}
	
	
	label() {
		this.active = true;
		this.context.drawImage(this.source, 
							   0, 	  			  this.sourceY, 	 this.sourceX, this.height, 
							   this.destinationX, this.destinationY, this.sourceX, this.height);
		this.destinationX += this.sourceX;
	}
	
	
	addTo() {
		if (this.cycles < 0) {
			this.active = false;
			this.ready = true;
			return;
		};
		
		this.context.drawImage(this.source, 
							   this.sourceX, 	  this.sourceY, 	 this.width, 			 this.height, 
							   this.destinationX, this.destinationY, this.width, this.height);
		
		this.destinationX += this.width;
		this.sourceTime += this.scale;
		this.cycles--;
	}
	
	
	save() {
		let dataURL = this.destination.toDataURL('data/png');
		
		let link = document.createElement('a');
		link.download = "gantt_chart.png";
		link.href = dataURL;
		link.click();
		
		this.active = false;
		this.ready = false;
	}
}