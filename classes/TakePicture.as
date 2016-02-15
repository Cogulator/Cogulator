package classes {
	
	import com.adobe.images.PNGEncoder;
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.MovieClip;
	import flash.utils.ByteArray;
	import flash.filesystem.*;
	import flash.geom.Matrix;
	import flash.display.Sprite;
	import flash.geom.Rectangle;
	import flash.geom.Point;
	
	public class TakePicture {
	
		//static var bitmapData:BitmapData;
		static var bitmapData1:BitmapData;
		static var bitmapData2:BitmapData;
		static var newImage:File;
		static var fileStream:FileStream;
		
		//http://blog.everythingflex.com/2008/02/25/create-images-with-air-and-jpegencoder/
		//and http://help.adobe.com/en_US/AS2LCR/Flash_10.0/help.html?content=00000796.html
		public static function takePic(labels:MovieClip, chart:MovieClip, chartHeight:Number) {
			bitmapData1 = new BitmapData(labels.width + chart.width, chartHeight);
			bitmapData1.draw(labels, new Matrix());	
				
			bitmapData2 = new BitmapData(chart.width, chartHeight);
			bitmapData2.draw(chart, new Matrix());	
				
			bitmapData1.merge(bitmapData2, new Rectangle(0, 0, labels.width + chart.width, chartHeight), new Point(labels.width, 0), 255, 255, 255, 1);
				
			var png:PNGEncoder = new PNGEncoder();
			var ba:ByteArray   = png.encode(bitmapData1);
				
			newImage = File.desktopDirectory.resolvePath("gantt-chart.png");
			fileStream = new FileStream();
			fileStream.open(newImage, FileMode.UPDATE);
			fileStream.writeBytes(ba);
			fileStream.close();
		}

	}
	
}
