/*******************************************************************************
 * This is the copyright work of The MITRE Corporation, and was produced for the 
 * U. S. Government under Contract Number DTFAWA-10-C-00080.
 * 
 * For further information, please contact The MITRE Corporation, Contracts Office, 
 * 7515 Colshire Drive, McLean, VA  22102-7539, (703) 983-6000.
 * 
 * Copyright 2017 The MITRE Corporation
 *
 * Approved for Public Release; Distribution Unlimited. 14-0584
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
 
package classes {
	
	public class OperaterUpdater {
		
		import flash.filesystem.File;
		import flash.filesystem.FileMode;
		import flash.filesystem.FileStream;
		import com.inruntime.utils.*;
		
		private var newOperators:Array = new Array();
		private var modifiedOperators:Array = new Array();
		private var $:Global = Global.getInstance();
		
		public function OperaterUpdater() {
			newOperators.push({resource: "hands", appelation: "Drag", time: 230, description: "Drag_item_across_screen._Associated_with_touchscreen_devices.", labelUse: ""});
			newOperators.push({resource: "hands", appelation: "Tap", time: 450, description: "Touch_a_series_of_virtual_buttons._Should_include_label_if_touchscreen_typing._Associated_with_touchscreen_devices.", labelUse: ""});
			newOperators.push({resource: "hands", appelation: "Write", time: 2000, description: "Time_to_write_a_single_word._Label_Word_count_is_used_to_calculate_total_time.", labelUse: "count_label_words"});
			newOperators.push({resource: "see", appelation: "Read", time: 260, description: "Time_to_read_a_single_word._Label_word_count_is_used_to_calculate_total_time.", labelUse: "count_label_words"});
			newOperators.push({resource: "see", appelation: "Proofread", time: 330, description: "Time_to_carefully_read_a_single_word._Label_word_count_is_used_to_calculate_total_time.", labelUse: "count_label_words"});
			newOperators.push({resource: "cognitive", appelation: "Ignore", time: 50, description: "Removes_item_from_working_memory.", labelUse: ""});
			newOperators.push({resource: "system", appelation: "Wait", time: 1000, description: "User_waiting_for_system._Modify_time_by_adding_'(x_seconds)'_at_end_of_line.", labelUse: ""});
			
			modifiedOperators.push({appelation: "Touch", time: 490});
			modifiedOperators.push({appelation: "Swipe", time: 170});
			
			//addOperators results in duplicated work, but it ensures we don't create new files or mess with existing ones until we know there's a reason to do so
			var addOperators = thereAreNewOperators();
			if (addOperators) { //only modify existing operators if you're adding new modifiers. Trying not to step on changes the user makes
				if (backupOldFile()) {
					addNewOperators();
					updateOldOperators();
					saveNewFile();
				}
			}
		}
		
		private function thereAreNewOperators():Boolean {
			for each (var newOperator in newOperators) {
				var notInFile = true
				for each (var oldOperator in $.operatorArray) {
					if (oldOperator.appelation == newOperator.appelation) {
						notInFile = false;
						break;
					}
				}
				if (notInFile) return true;
			}
			return false;
		}
		
		private function backupOldFile():Boolean {
			var now:Date = new Date();
			var timestamp:String = now.valueOf().toString();
			
			try {
				var oldFile:File = File.documentsDirectory.resolvePath("cogulator/operators/operators.txt"); 
				var newFile:File = File.documentsDirectory.resolvePath("cogulator/operators/operators_bckup_" + timestamp + ".txt"); 
				oldFile.copyTo(newFile, false);
			} catch (error:Error) {
				trace("couldn't backup operators file", error);
				return false;
			}
			
			return true;
		}
		
		private function addNewOperators() {
			for each (var newOperator in newOperators) {
				var notInFile = true
				for each (var oldOperator in $.operatorArray) {
					if (oldOperator.appelation == newOperator.appelation) {
						notInFile = false;
						break;
					}
				}
				if (notInFile) addToOperatorArray(newOperator);
			}
		}
		
		private function updateOldOperators() {
			for each (var modOperator in modifiedOperators) {
				for each (var oldOperator in $.operatorArray) {
					if (oldOperator.appelation == modOperator.appelation) {
						if (oldOperator.time != modOperator.time) {
							var newTime:String = modOperator.time;
							oldOperator.time = newTime;
						}
					}
				}
			}
		}
		
		private function saveNewFile() {
			var newFileText:String = "";
			for each (var operator in $.operatorArray) {
				var resource:String = operator.resource;
				var appelation:String = operator.appelation;
				var time:String = operator.time.toString();
				var description:String = operator.description;
				var labelUse:String = operator.labelUse;
				
				newFileText += resource + " " + appelation + " " + time + " " + description + " " + labelUse + "\n";
			}
					
			try {
				var file:File = File.documentsDirectory.resolvePath("cogulator/operators/operators.txt"); 
				var fileStream:FileStream = new FileStream();
					fileStream.open(file, FileMode.WRITE);
					fileStream.writeMultiByte(newFileText, "utf-8");
					fileStream.close();
			} catch (error:Error) {
				trace("could not save new operators file", error.message);
			}
		}
		
		private function addToOperatorArray (newOperator:Object) {
			var resource:String = newOperator.resource;
			var appelation:String = newOperator.appelation;
			var time:int = newOperator.time;
			var description:String = newOperator.description;
			var labelUse:String = newOperator.labelUse;
			
			$.operatorArray.push({resource: resource, appelation: appelation, time: time, description: description, labelUse: labelUse});
		}
		

	}
	
}
