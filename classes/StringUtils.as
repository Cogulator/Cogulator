/************************************
* @author : Manuel Gonzalez			*
* @blog	  : www.codingcolor.com     *
* @email  : design@stheory.com      *
* @www	  : www.stheory.com			*
************************************/
package classes
{
	import flash.text.AntiAliasType;
	import flash.text.Font;
	import flash.text.TextField;
	import flash.text.TextFieldAutoSize;
	import flash.text.TextFormat;
	import flash.text.TextFormatAlign;
	import flash.text.TextLineMetrics;

	public class StringUtils
	{
		public function StringUtils(){}
		
		/*
		Method: getTextLineWidth
		Parameters:
		inStr:String
		inFont:Font
		inTextFormat:TextFormat=null
		Returns:
		Number
		*/
		public static function getTextLineWidth(inStr:String, inFont:Font,inTextFormat:TextFormat=null):Number
		{
			var tFormat:TextFormat;
			
			if(inTextFormat == null){
			tFormat = new TextFormat();
			tFormat.size = 12;
			tFormat.align = TextFormatAlign.LEFT;
			tFormat.font = inFont.fontName;
			tFormat.rightMargin = 1;

			}else{
			
				tFormat = inTextFormat;
				
			}
			
			var testField:TextField = new TextField();
			testField.autoSize = TextFieldAutoSize.LEFT;
			testField.multiline = false;
			testField.wordWrap = false;
			testField.embedFonts = true;
			testField.antiAliasType = AntiAliasType.ADVANCED;
			testField.defaultTextFormat = tFormat;
			testField.text = inStr;
			
			return Math.floor(testField.width);
		}
		/*
		Method: getTextLineHeight
		Parameters:
		inStr:String
		inFont:Font
		inTextFormat:TextFormat=null
		Returns:
		Number
		*/
		public static function getTextLineHeight(inStr:String, inFont:Font,inTextFormat:TextFormat=null):Number
		{
			var tFormat:TextFormat;
			
			if(inTextFormat == null){
			tFormat = new TextFormat();
			tFormat.size = 12;
			tFormat.align = TextFormatAlign.LEFT;
			tFormat.font = inFont.fontName;
			tFormat.rightMargin = 1;

			}else{
			
				tFormat = inTextFormat;
				
			}
			
			var testField:TextField = new TextField();
			testField.autoSize = TextFieldAutoSize.LEFT;
			testField.multiline = false;
			testField.wordWrap = false;
			testField.embedFonts = true;
			testField.antiAliasType = AntiAliasType.ADVANCED;
			testField.defaultTextFormat = tFormat;
			testField.text = inStr;
			
			return Math.floor(testField.height);
		}
		/*
		Method: getTextWidthAndHeight
		Parameters:
		inStr:String
		inFont:Font
		inTextFormat:TextFormat=null
		Returns:
		Object {width:,height:}
		*/
		public static function getTextWidthAndHeight(inStr:String, inFont:Font,inTextFormat:TextFormat=null):Object
		{
			var textObj:Object = {};
			var tFormat:TextFormat;
			
			if(inTextFormat == null){
			tFormat = new TextFormat();
			tFormat.size = 12;
			tFormat.align = TextFormatAlign.LEFT;
			tFormat.font = inFont.fontName;
			tFormat.rightMargin = 1;
			}else{
			
				tFormat = inTextFormat;
				
			}
			
			var testField:TextField = new TextField();
			testField.autoSize = TextFieldAutoSize.LEFT;
			testField.multiline = false;
			testField.wordWrap = false;
			testField.embedFonts = true;
			testField.antiAliasType = AntiAliasType.ADVANCED;
			testField.defaultTextFormat = tFormat;
			testField.text = inStr;
			
			textObj.width = Math.floor(testField.width);
			textObj.height = Math.floor(testField.height);
			
			return textObj;
		}
		/*
		Method: getWidthOfLongestStringInArray
		Parameters:
		inArray:Array
		inFont
		inTextFormat=null
		Returns:
		Number
		*/
		public static function getWidthOfLongestStringInArray(inArray:Array,inFont:Font,inTextFormat=null):Number
		{
			var wResult:Number = 0;
			var tFormat:TextFormat;
			
			if(inTextFormat == null){
			tFormat = new TextFormat();
			tFormat.size = 12;
			tFormat.align = TextFormatAlign.LEFT;
			tFormat.font = inFont.fontName;
			tFormat.rightMargin = 1;
			}else{
			
				tFormat = inTextFormat;
				
			}
			
			var len:int = inArray.length;
			
			for(var i:int =0; i < len; i++)
			{
				var testField:TextField = new TextField();
				testField.autoSize = TextFieldAutoSize.LEFT;
				testField.multiline = false;
				testField.wordWrap = false;
				testField.embedFonts = true;
				testField.antiAliasType = AntiAliasType.ADVANCED;
				testField.defaultTextFormat = tFormat;
				testField.text = inArray[i] as String;
				
				var stringWidth:Number = Math.floor(testField.width);
				
				if(stringWidth > wResult){
					wResult = stringWidth;
				}
				 
				
			}
			
			return wResult;
		}
		
		public static function trim(s:String):String {
			if (s == null) return("");
			else return s.replace(/^[\s|\t|\n]+|[\s|\t|\n]+$/gs, '');
		}
		
		public static function trimtab(s:String):String {
			if (s == null) return("");
			else return s.replace(/(\t)/gi, '')
		}
		
		public static function oneSigDig(num:Number):String {
			//takes a number in ms and rounds it to one significant digit in seconds
			var r:String;
			var indx:int;
			num = num/1000;
			r = String(num);
			indx = r.indexOf(".");
			r = r.substring(0,indx) + "." + r.substring(indx+1,indx+2);
			return r;
		}
		
		public static function capitaliseFirstLetter(s:String):String {
			var f:String = s.substring(0,1);
			f = f.toUpperCase();
			return f + s.substring(1);
		}
		
		
	}
}