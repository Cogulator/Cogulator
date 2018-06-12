class Point {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	
	equals(point) {
		if (this.x == point.x && this.y == point.y) return true;
		return false;
	}
}