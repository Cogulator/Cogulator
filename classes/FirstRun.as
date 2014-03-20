/*******************************************************************************
 * This is the copyright work of The MITRE Corporation, and was produced for the 
 * U. S. Government under Contract Number DTFAWA-10-C-00080.
 * 
 * For further information, please contact The MITRE Corporation, Contracts Office, 
 * 7515 Colshire Drive, McLean, VA  22102-7539, (703) 983-6000.
 * 
 * Copyright 2014 The MITRE Corporation
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
	import flash.events.Event;
	import flash.filesystem.*;
	import flash.events.EventDispatcher;
	
	public class FirstRun extends EventDispatcher{
		
		private var config:File;
		private var settings:File;
		private var ngomslTxt:String;
		private var klmTxt:String;
		private var sundryTxt:String;
		private var mentalMathTxt:String;
		private var cpmTxt:String;
		private var operatorsTxt:String;
		private var initialSettings:String;

		public function FirstRun() {
			// constructor code
			config = File.documentsDirectory; 
			config = config.resolvePath("cogulator/config/config.txt");
			settings = File.documentsDirectory;
			settings = settings.resolvePath("cogulator/config/settings.txt");
		}
		
		public function firstRunTest() {
			if(config.exists) { 
				ready(); 
			} else { 
				itIsTheFirstRun(); 
			} 
		}
		
		
		private function itIsTheFirstRun():void {  
		
			operatorsTxt = "see Look 550 NGOMSL/CPM._Look_at_an_item_at_a_known_position."
							+ "\n" + "see Perceptual_processor 100 Used_in_low_level_MHP_models._Represents_one_cycle_of_the_perceptual_processor."
							+ "\n" + "see Search 1250 Search_for_an_item_at_an_unknown_position."
							+ "\n" + "see Saccade 30 Used_with_CPM-GOMS._A_single_rapid_eye_movement."
							+ "\n" + "hear Hear 400 Listen_to_someone_speaking._Label_should_be_the_text_of_the_speech."
							+ "\n" + "cognitive Attend 50 Used_with_CPM-GOMS._Shifting_of_attention_to_stimuli."
							+ "\n" + "cognitive Cognitive_processor 70 Used_in_low_level_MHP_models._Represents_one_cycle_of_the_cognitive_processor."
							+ "\n" + "cognitive Initiate 50 Used_with_CPM-GOMS._Initiate_motor_process."
							+ "\n" + "cognitive Mental 1250 Generic_operator_for_thinking."
							+ "\n" + "cognitive Recall 550 Retrieve_information_from_LTM_or_WM."
							+ "\n" + "cognitive Store 50 Place_item_in_working_memory."
							+ "\n" + "cognitive Think 1250 Generic_operator_for_thinking."
							+ "\n" + "cognitive Verify 1250 Generic_operator_for_thinking."
							+ "\n" + "hands Click 320 Press_of_a_mouse_button."
							+ "\n" + "hands Grasp 750 Act_of_reaching_with_the_hand_and_grasping_an_object."
							+ "\n" + "hands Hands 450 Move_hands_to_position_(typically_mouse_or_keyboard)."
							+ "\n" + "hands Keystroke 280 Press_a_single_keyboard_key_(e.g.,_Enter_or_Esc)."
							+ "\n" + "hands Motor_processor 70 Used_in_low_level_MHP_models._Represents_one_cycle_of_the_motor_processor."
							+ "\n" + "hands Point 950 Move_cursor_via_the_mouse."
							+ "\n" + "hands Swipe 450 One_swipe_gesture._Associated_with_touchscreen_devices."
							+ "\n" + "hands Touch 750 Press_a_virtual_button._Associated_with_touchscreen_devices."
							+ "\n" + "hands Turn 800 One_turn_of_a_knob_or_dial."
							+ "\n" + "hands Type 280 Press_a_series_of_keyboard_keys._Should_include_label_with_the_typed_text."
							+ "\n" + "speech Say 400 Speech._Label_should_be_the_text_of_the_speech.";
							
			klmTxt = 		"*The Keystroke Level Model is a flat, serial list of all the interactions (operators) you need in order to accomplish some goal. In this example, we're listing the steps necessary to create a new model in Cogulator:"
							+ "\n" + "** 1st:  Click the '+' button to bring up the new model dialog"
							+ "\n" + "** 2nd: Enter a model name"
							+ "\n" + "**  3rd: Enter a collection name"
							+ "\n"  
							+ "\n" + "** 1st:  Click the '+' button, then you enter the collection name"
							+ "\n" + "Look at 'New' button"
							+ "\n" + "Point to 'New' button"
							+ "\n" + "Click 'New' button"
							+ "\n"  
							+ "\n" + "** 2nd: Enter a model name"
							+ "\n" + "Look at 'Model Name' Field"
							+ "\n" + "Think of model name"
							+ "\n" + "Hands to keyboard"
							+ "\n" + "Type KLM"
							+ "\n" + "Verify Correct"
							+ "\n" + "Keystroke Tab key"
							+ "\n"  
							+ "\n" + "**  3rd: Enter a collection name"
							+ "\n" + "Look at 'Collection Name' Field"
							+ "\n" + "Think of collection name"
							+ "\n" + "Type Ex *Only have to enter Ex, 'amples' will autocomplete"
							+ "\n" + "Verify Autocomplete is correct"
							+ "\n" + "Keystroke Enter key"
							+ "\n"  
							+ "\n" + "*For comparison, check out the NGOMSL model.  It's almost identical, but has goal statements. Whether or not you use goal statements will depend on a few things, including the complexity and depth of the task you're trying to model. As a general rule, if any of your goals have subgoals, you'll probably want to include goal statements throughout.";
			
			ngomslTxt =		"*Natural GOMS Language (NGOMSL) allows us to structure our task model around a series of goals to be accomplished to complete some task. In this example, we're modeling someone creating a new model in Cogulator:"
							+ "\n" + "** 1st:  Click the '+' button to bring up the new model dialog"
							+ "\n" + "** 2nd: Enter a model name"
							+ "\n" + "**  3rd: Enter a collection name"
							+ "\n"  
							+ "\n" + "** 1st:  Click the '+' button, then you enter the collection name"
							+ "\n" + "Goal: Press the 'New' Button"
							+ "\n" + ".Look at 'New' button "
							+ "\n" + ".Point to 'New' button"
							+ "\n" + ".Click 'New' button"
							+ "\n"  
							+ "\n" + "** 2nd: Enter a model name"
							+ "\n" + "Goal: Enter model name"
							+ "\n" + ".Look at 'Model Name' Field"
							+ "\n" + ".Think of model name"
							+ "\n" + ".Hands to keyboard"
							+ "\n" + ".Type NGOMSL"
							+ "\n" + ".Verify Correct"
							+ "\n" + ".Keystroke Tab key"
							+ "\n"  
							+ "\n" + "**  3rd: Enter a collection name"
							+ "\n" + "Goal: Enter collection name"
							+ "\n" + ".Look at 'Collection Name' Field"
							+ "\n" + ".Think of collection name"
							+ "\n" + ".Type Ex *Only have to enter Ex, 'amples' will autocomplete"
							+ "\n" + ".Verify Autocomplete is correct"
							+ "\n" + ".Keystroke Enter key"
							+ "\n"  
							+ "\n" + "*For comparison, you might want to check out the KLM model.  It's almost identical, but doesn't have any of the goal statements. Whether or not you use goal statements will depend on a few things, including the complexity and depth of the task you're trying to model. As a general rule, if any of your goals have subgoals, you'll probably want to include goal statements throughout. It'll make your model easier to read and understand."
							+ "\n"  
							+ "\n" + "*The CPM-GOMS example models this same task. In it, you'll see a slightly more detailed version of the model and allowances for multitasking. Note, there's no reason you can't use multitasking in simpler, NGOMSL models. Check out the 'Listen to Lecture' goal in Sundry Methods in the Examples collection for an example of multitasking in a simpler task."
			
			cpmTxt =		"*In the example below - a model of creating a new model in Cogulator - we're using a mixture of NGOMSL and CPM-GOMS operators to complete the following goals:"
							+ "\n" + "** 1st:  Click the '+' button to bring up the new model dialog"
							+ "\n" + "** 2nd: Enter a model name"
							+ "\n" + "**  3rd: Enter a collection name"
							+ "\n" + "* You can see simpler ways to model this task in the 1_KLM and 2_NGOMSL examples"
							+ "\n"
							+ "\n" + "** 1st:  Click the '+' button to bring up the new model dialog"
							+ "\n" + "Goal: Point and click 'New' button"
							+ "\n" + ". Attend to Hand position"
							+ "\n" + ". Initiate Cursor movement"
							+ "\n"
							+ "\n" + ".Also: Attend to New Button as eyes"
							+ "\n" + ".. Attend to 'New' button"
							+ "\n" + ".. Initiate Eye movement to 'New' button"
							+ "\n" + "..Saccade to 'New' button"
							+ "\n" + "..Look at 'New' button (100 ms)"
							+ "\n" + ". Point to 'New' button"
							+ "\n" + ". Cognitive_processor Verify Cursor is over 'New' button"
							+ "\n" + ". Attend to Finger"
							+ "\n" + ". Initiate Click"
							+ "\n" + ". Click (90 ms)"
							+ "\n"
							+ "\n" + "** 2nd: Enter a model name"
							+ "\n" + "Goal: Enter Model Name"
							+ "\n" + ".Attend to 'Model Name' Field"
							+ "\n" + ".Initiate Eye movement to 'Model Name' Field"
							+ "\n" + ". Also: Move Hands to Keyboard as hands"
							+ "\n" + "..Attend to hands"
							+ "\n" + "..Initiate move hands"
							+ "\n" + "..Hands to Keyboard (300 ms)"
							+ "\n" + ".Saccade to 'Model Name' Field"
							+ "\n" + ".Look at 'Model Name' Field (100 ms)"
							+ "\n" + ". Think of Model Name"
							+ "\n" + ". Initiate Typing CPM-GOMS"
							+ "\n" + ". Type CPM-GOMS"
							+ "\n" + ". Attend to Typed Text"
							+ "\n" + ". Initiate Eye movement to Typed Text"
							+ "\n" + ". Saccade to Typed in Text"
							+ "\n" + ". Look at CPM-GOMS for (150 ms) * about 300 ms to proofread a word, including saccade. So, we subtract out the saccade time of 150 ms, leaving us with 150 ms"
							+ "\n" + ". Cognitive_processor Verify Correct"
							+ "\n" + ". Attend to Tab Key"
							+ "\n" + ". Initiate Tab Enter Key"
							+ "\n" + ". Keystroke Tab key"
							+ "\n"
							+ "\n" + "**  3rd: Enter a collection name"
							+ "\n" + "Goal: Enter Collection Name"
							+ "\n" + ".Attend to 'Collection Name' Field"
							+ "\n" + ".Initiate Eye movement to 'Collection Name' Field"
							+ "\n" + ".Also: Saccade to Collection Field as eyes_too"
							+ "\n" + ".. Saccade to 'Collection Name' Field"
							+ "\n" + ".. Look at 'Collection Name' Field (100 ms)"
							+ "\n" + ". Think of  which Collection to place model in"
							+ "\n" + ".Attend to Typing Examples"
							+ "\n" + ". Initiate Typing Examples"
							+ "\n" + ". Type Ex *after typing Ex the user sees the field has autocomplete"
							+ "\n" + ". Attend to autocompleted text"
							+ "\n" + ". Initiate saccade to autocompleted text"
							+ "\n" + ". Saccade to autocompleted text"
							+ "\n" + ". Look at autocompleted text (150 ms) * about 300 ms to proofread a word, including saccade. So, we subtract out the saccade time of 150 ms, leaving us with 150 ms"
							+ "\n" + ". Cognitive_processor Verify autocomplete"
							+ "\n" + ". Attend to Enter Key"
							+ "\n" + ". Initiate Key Enter Key"
							+ "\n" + ". Keystroke Enter key"
							+ "\n" + "*As you build models with multitasking, remember that Cogulator is essentially just a calculator, not a genuine cognitive architecture. One of the ramifications of that is you'll need to check the Gantt chart and make sure the model is generating sensible results. For example, if a multitasked method is not completing before some dependent action in the main method, you'll need to move the multitasked method up a few lines."
			
						
			mentalMathTxt = "*One of the features we're currently working on in Cogulator is an analysis of Working Memory load in the Gantt chart. To simulate working memory load, Cogulator adds chunks to working memory each time certain operators are used. Those operators include: Store, Recall, Look, Search, Perceptual_processor, Listen, or Think. Store can also be used to explicitly force a chunk into working memory. In this example, we model someone adding two, three digit numbers in their head. Each chunk added to working memory is represented as a colored block in the Gantt chart. Over time, those memories begin to decay, until they're no longer accessible. That decay is symbolized in the chart with the use of transparency - the blocks becoming more and more translucent until they leave memory altogether. Where memory load exceeds seven chunks, the display is marked with a red triangle."
							+ "\n" 
							+ "\n" + "Goal: Listen To Problem"
							+ "\n" + "*What is 354 plus 412?"
							+ "\n" + ". Hear What is three"
							+ "\n" + ". Hear fifty"
							+ "\n" + ". Hear four"
							+ "\n" + ". Hear plus"
							+ "\n" + ". Hear four hundred"
							+ "\n" + ". Hear and twelve"
							+ "\n" 
							+ "\n" + "Goal: Calculate Answer"
							+ "\n" + ". Goal: Add 4 plus 2"
							+ "\n" + "*Internal thought"
							+ "\n" + ". . Say Well, 4 plus 2 is 6"
							+ "\n" + ". . Recall 6 (150 ms)"
							+ "\n" 
							+ "\n" + ". Goal: Add_5_plus_1"
							+ "\n" + ". . Say 5 plus 1 is_6"
							+ "\n" + ". . Recall 6 (150 ms)"
							+ "\n" 
							+ "\n" + ". Goal: Add_3_plus_4"
							+ "\n" + ". . Say 3 plus 4_is 7"
							+ "\n" + ". . Recall 7 (150 ms)"
							+ "\n" 
							+ "\n" + ". Goal: Encode Answer"
							+ "\n" + ". . Store 766"
							+ "\n" 
							+ "\n" + "Goal: Speak Answer"
							+ "\n" + ". Say seven hundred and sixty six"
							+ "\n" + ". Verify answer (5 seconds)";
							
							
			sundryTxt = 	"*Generic collection of methods that may be useful for copying and pasting in your models, or just for getting smart about how Cogulator works."
							+ "\n" 
							+ "\n" + "*Generic method for pointing and clicking on a target"
							+ "\n" + "Goal: Point and Click"
							+ "\n" + ". Look at target"
							+ "\n" + ". Point to target"
							+ "\n" + ". Verify cursor over target   *Cognitive_processor might be substituted for Verify when modeling a professional user"
							+ "\n" + ". Click target"
							+ "\n" 
							+ "\n" + "*Generic method for typing with a standard PC keyboard"
							+ "\n" + "Goal: Type"
							+ "\n" + ". Think of text to type *or Recall text to type"
							+ "\n" + ". Hands to keyboard"
							+ "\n" + ". Type Hello World"
							+ "\n" + ". Verify correct *Cognitive_processor might be substituted for Verify when modeling a professional user"
							+ "\n" + ". Keystroke Enter"
							+ "\n" 
							+ "\n" + "*Generic method for swiping through a list of items on iOS/Android"
							+ "\n" + "Goal: Swipe Through List *iPhone"
							+ "\n" + ". Touch  list icon *figure out a reasonable operator here"
							+ "\n" + ". Swipe list"
							+ "\n" + ". Look at list"
							+ "\n" + ". Swipe list"
							+ "\n" + ". Look at list"
							+ "\n" 
							+ "\n" + "* Generic example of multitasking.  In this case, typing notes while someone talks"
							+ "\n" + "*Not, I've interleaved the methods here for readability, but that has no impact on model execution. Everything in the Also: Take Notes method executes independently of the Goal: Listen to Lecture operators. The only exception is when operators are competing for the same resource."
							+ "\n" + "Goal: Listen to Lecture "
							+ "\n" + ". Hear Hello"
							+ "\n" + ". Also: Take Notes"
							+ "\n" + ". . Type Hello"
							+ "\n" + ". Hear I'd like to (3 syllables) *adding the syllable information gives a more precise estimate, but isn't absolutely necessary. If you don't give the number of syllables, make sure to enter exactly what's spoken in the label (black text).  Cogulator will use the word count to come up with the time for this operator."
							+ "\n" + ". . Type I'd like to "
							+ "\n" + ". Hear Welcome you"
							+ "\n" + ". . Type Welcome you"
							+ "\n" + ". Say Hold up, I'm falling behind!"
							+ "\n" 
							+ "\n" + "*Generic example of interaction with a physical object"
							+ "\n" + "*The Grasp operator comes from Codein– A New Notation for GOMS to Handle Evaluations of Reality Based Interaction Style Interfaces by Georgios Christou, Frank Ritter, and Robert Jacob "
							+ "\n" + "Goal: Set Car Handbrake"
							+ "\n" + ". Grasp handbrake *Reach accounts for reaching and grasping. " 
							+ "\n" + ". Hands pull the handbrake up *Using the hands operator to model movement of the handbrake. This may or may not be a reasonable operator to use here, as its original intent is movement of the hands between a mouse and keyboard. This is the sort of informed guess you'll sometimes have to make in creating models"
							+ "\n" + ". Verify handbrake set"
							+ "\n" 
							+ "\n" + "*Generic Model Human Processor (MHP) of reaction time (taken from The Model Human Processor: An Engineering Model of Human Performance. In this example, the user is trying to determine if a visual stimulus matches a previously seen visual stimulus. If the targets match, the user presses a button"
							+ "\n" + "Goal: Visual Match Reaction Time"
							+ "\n" + ". Perceptual_processor *percieve the target"
							+ "\n" + ". Cognitive_processor *determine if the target is a match"
							+ "\n" + ". Cognitive_processor *if there is a match, initiate the motor processor"
							+ "\n" + ". Motor_processor  *initiation of the motor processor to press the 'match' button";
			
			initialSettings = "font-size:16";
			
				
			//create operators folder
			var operatorsFolder:File = File.documentsDirectory.resolvePath("cogulator/operators");
				operatorsFolder.createDirectory(); //if already exists, does nothing
			//create operators file
			var operators:File;
				operators = File.documentsDirectory; 
				operators = operators.resolvePath("cogulator/operators/operators.txt"); 
			//write operators file
			var stream2:FileStream = new FileStream(); 
				stream2.open(operators, FileMode.WRITE); 
				//this should write the location of the launch file
				stream2.writeUTFBytes(operatorsTxt); 
				stream2.close();
			
			//create models folder
			var modelsFolder:File = File.documentsDirectory.resolvePath("cogulator/models");
				modelsFolder.createDirectory(); //if already exists, does nothing
				
			
			//create klm file
			var klm:File;
				klm = File.documentsDirectory; 
				klm = klm.resolvePath("cogulator/models/Examples/1_KLM.goms"); 
			//write models file
			var stream3:FileStream = new FileStream(); 
				stream3.open(klm, FileMode.WRITE); 
				//this should write the location of the launch file
				stream3.writeUTFBytes(klmTxt); 
				stream3.close();
				
			//create ngomsl file
			var ngomsl:File;
				ngomsl = File.documentsDirectory; 
				ngomsl = ngomsl.resolvePath("cogulator/models/Examples/2_NGOMSL.goms"); 
			//write models file
			var stream7:FileStream = new FileStream(); 
				stream7.open(ngomsl, FileMode.WRITE); 
				//this should write the location of the launch file
				stream7.writeUTFBytes(ngomslTxt); 
				stream7.close();
				
			//create cpm file
			var cpm:File;
				cpm = File.documentsDirectory; 
				cpm = cpm.resolvePath("cogulator/models/Examples/3_CPM-GOMS.goms"); 
			//write models file
			var stream4:FileStream = new FileStream(); 
				stream4.open(cpm, FileMode.WRITE); 
				//this should write the location of the launch file
				stream4.writeUTFBytes(cpmTxt); 
				stream4.close();
				
			//create math file
			var maths:File;
				maths = File.documentsDirectory; 
				maths = maths.resolvePath("cogulator/models/Examples/Mental-Math.goms"); 
			//write models file
			var stream5:FileStream = new FileStream(); 
				stream5.open(maths, FileMode.WRITE); 
				//this should write the location of the launch file
				stream5.writeUTFBytes(mentalMathTxt); 
				stream5.close();
				
			//create processor file
			var sundry:File;
				sundry = File.documentsDirectory; 
				sundry = sundry.resolvePath("cogulator/models/Examples/Sundry_Methods.goms"); 
			//write models file
			var stream6:FileStream = new FileStream(); 
				stream6.open(sundry, FileMode.WRITE); 
				//this should write the location of the launch file
				stream6.writeUTFBytes(sundryTxt); 
				stream6.close();
				
			//create config file
			var stream1:FileStream = new FileStream(); 
				stream1.open(config, FileMode.WRITE); 
				//this should write the location of the initial goms file to the config file
				stream1.writeUTFBytes(ngomsl.nativePath); 
				stream1.close();
				
			//create settings file
			var streamSettings:FileStream = new FileStream(); 
				streamSettings.open(settings, FileMode.WRITE); 
				streamSettings.writeUTFBytes(initialSettings); 
				streamSettings.close();
				
			ready();
				
				
		}
		
		private function ready():void {
			dispatchEvent( new Event("ready") );
		}
		
		
	}
}