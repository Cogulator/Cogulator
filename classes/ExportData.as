package classes {
	
	public class ExportData {
		import flash.filesystem.File;
		import flash.filesystem.FileMode;
		import flash.filesystem.FileStream;
		import com.inruntime.utils.*;
		
		public static function export(modelName:String) {
			
			var $:Global = Global.getInstance();
			
		//Export Steps
			var exportTxt = "operator" + "\t" + "label" + "\t" + "line_number" + "\t" + "resource" + "\t" + "thread" + "\t" + "operator_time" + "\t" + "step_start_time" + "\t" + "step_end_time" + "\r\n";
			for each (var step in $.exportIntersteps) {
				exportTxt += step.operator + "\t" + step.label + "\t" + step.lineNo + "\t" + step.resource + "\t" + step.thred + "\t" + step.time + "\t" + step.srtTime + "\t" + step.endTime + "\r\n";
			}
			
			var localFile = new File(File.desktopDirectory.nativePath); 
				localFile = localFile.resolvePath(modelName + "_steps_export.txt"); 
			var localFileStream:FileStream = new FileStream();
				localFileStream.open(localFile, FileMode.WRITE);
				localFileStream.writeMultiByte(exportTxt, "utf-8");
				localFileStream.close();
			
		//Export Working Memory
			// stack height
			exportTxt = "time" + "\t" + "items_in_memory" + "\r\n";
			var time = 0;
			for each (var stack in $.memory.workingmemory) {
				exportTxt += time + "\t" + stack.length + "\r\n";
				time += 50;
			}
			
			// probability of recall
			exportTxt += "time" + "\t" + "chunk_name" + "\t"  + "rehearsals" + "\t"  + "probability_of_recall" + "\r\n";
			var recallTime = 0;
			for each (var stck in $.memory.workingmemory) {
				for each (var chunk in stck) {
					exportTxt += recallTime + "\t" + chunk.chunkName + "\t" + chunk.rehearsals + "\t" + chunk.probabilityOfRecall + "\r\n";
				}
				recallTime += 50;
			}
			
			localFile = new File(File.desktopDirectory.nativePath); 
			localFile = localFile.resolvePath(modelName + "_working_memory_export.txt"); 
			localFileStream.open(localFile, FileMode.WRITE);
			localFileStream.writeMultiByte(exportTxt, "utf-8");
			localFileStream.close();
		}
	}
}
