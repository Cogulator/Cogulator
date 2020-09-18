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
 
class FirstRunManager {

	constructor() {
		if (G.io.pathExists(G.paths.cogulator)) {
			G.startUp.load();
		} else { 
			G.helpScreen.show();
			this.itIsTheFirstRun(); 
		} 

	}
	

	itIsTheFirstRun() {
		this.setText();
		
		//CREATE REQUIRED DIRECTORIES
		G.io.newDirectory(G.paths.cogulator);
		G.io.newDirectory(G.paths.models);
		G.io.newDirectory(G.paths.methods);
		G.io.newDirectory(G.paths.operators);
		G.io.newDirectory(G.paths.config);

		//CREATE OPERATORS FILE
		G.io.newFile(G.paths.operators, "operators.txt", this.operatorsTxt, this.writeFile);
	
		//CREATE EXAMPLE MODELS
		let examplesPath = path.join(G.paths.models, "Examples");
		G.io.newFile(examplesPath, "1_KLM.goms", this.klmTxt, this.writeFile);
		G.io.newFile(examplesPath, "2_NGOMSL.goms", this.ngomslTxt, this.writeFile);
		G.io.newFile(examplesPath, "3_CPM-GOMS.goms", this.cpmTxt, this.writeFile);
		G.io.newFile(examplesPath, "Mental-Math.goms", this.mentalMathTxt, this.writeFile);
		G.io.newFile(examplesPath, "Sundry_Methods.goms", this.sundryTxt, this.writeFile);
		G.io.newFile(examplesPath, "Forgetting.goms", this.chunkTxt, this.writeFile);
		G.io.newFile(examplesPath, "Selection_Rules.goms", this.selectionRules, this.writeFile);
		
		//CREATE DEFAULT METHODS
		G.io.newFile(G.paths.methods, "Point_and_Click.goms", this.pointAndClick, this.writeFile);
		G.io.newFile(G.paths.methods, "File_Save_As.goms", this.fileSaveAs, this.writeFile);
		G.io.newFile(G.paths.methods, "Copy_And_Paste.goms", this.copyAndPaste, this.writeFile);
		G.io.newFile(G.paths.methods, "Point_and_Touch.goms", this.screenTouch, this.writeFile);
		G.io.newFile(G.paths.methods, "Search_and_Swipe.goms", this.screenSwipe, this.writeFile);
		G.io.newFile(G.paths.methods, "Perceive_Info_CPM.goms", this.perceiveInfo, this.writeFile);
		G.io.newFile(G.paths.methods, "Slow_Click_CPM.goms", this.slowPoint, this.writeFile);
		G.io.newFile(G.paths.methods, "Fast_Click_CPM.goms", this.fastPoint, this.writeFile);
		G.io.newFile(G.paths.methods, "Hear_and_Respond.goms", this.hearAndRespond, this.writeFile); 

		//CREATE CONFIG FILE
		let configText = path.join(examplesPath, "1_KLM.goms");
		G.io.newFile(G.paths.config, "config.txt", configText, this.lastLoad); //default open to KLM example 
	}
	
	
	writeFile(path, text) { //callback passed to io
		G.io.writeToFile(path, text);
	}
	
	
	lastLoad(path, text) {
		G.io.writeToFile(path, text);
		G.startUp.load();
	}


	setText() {
		this.operatorsTxt = "see Look 550 NGOMSL/CPM._Look_at_an_item_at_a_known_position."
							+ "\n" + "see Perceptual_processor 100 Used_in_low_level_MHP_models._Represents_one_cycle_of_the_perceptual_processor."
							+ "\n" + "see Proofread 330 Time_to_carefully_read_a_single_word._Label_word_count_is_used_to_calculate_total_time. count_label_words"
							+ "\n" + "see Read 260 Time_to_read_a_single_word._Label_word_count_is_used_to_calculate_total_time. count_label_words"
							+ "\n" + "see Search 1250 Search_for_an_item_at_an_unknown_position."
							+ "\n" + "see Saccade 30 Used_with_CPM-GOMS._A_single_rapid_eye_movement."
							+ "\n" + "hear Hear 400 Listen_to_someone_speaking._Label_should_be_the_text_of_the_speech."
							+ "\n" + "cognitive Attend 50 Used_with_CPM-GOMS._Shifting_of_attention_to_stimuli."
							+ "\n" + "cognitive Cognitive_processor 70 Used_in_low_level_MHP_models._Represents_one_cycle_of_the_cognitive_processor."
							+ "\n" + "cognitive Initiate 50 Used_with_CPM-GOMS._Initiate_motor_process."
							+ "\n" + "cognitive Ignore 50 Removes_item_from_working_memory."
							+ "\n" + "cognitive Mental 1250 Generic_operator_for_thinking."
							+ "\n" + "cognitive Recall 550 Retrieve_information_from_LTM_or_WM."
							+ "\n" + "cognitive Store 50 Place_item_in_working_memory."
							+ "\n" + "cognitive Think 1250 Generic_operator_for_thinking."
							+ "\n" + "cognitive Verify 1250 Generic_operator_for_thinking."
							+ "\n" + "hands Click 320 Press_of_a_mouse_button."
							+ "\n" + "hands Drag 230 Drag_item_across_screen._Associated_with_touchscreen_devices."
							+ "\n" + "hands Grasp 750 Act_of_reaching_with_the_hand_and_grasping_an_object."
							+ "\n" + "hands Hands 450 Move_hands_to_position_(typically_mouse_or_keyboard)."
							+ "\n" + "hands Keystroke 280 Press_a_single_keyboard_key_(e.g.,_Enter_or_Esc)."
							+ "\n" + "hands Motor_processor 70 Used_in_low_level_MHP_models._Represents_one_cycle_of_the_motor_processor."
							+ "\n" + "hands Point 950 Move_cursor_via_the_mouse._Can_be_used_for_dragging."
							+ "\n" + "hands Swipe 170 One_swipe_gesture._Should_usually_be_preceeded_by_Touch._Associated_with_touchscreen_devices."
							+ "\n" + "hands Tap 450 Touch_a_series_of_virtual_buttons._Should_include_label_if_touchscreen_typing._Associated_with_touchscreen_devices."
							+ "\n" + "hands Touch 490 Press_a_virtual_button._Associated_with_touchscreen_devices."
							+ "\n" + "hands Turn 800 One_turn_of_a_knob_or_dial."
							+ "\n" + "hands Type 280 Press_a_series_of_keyboard_keys._Should_include_label_with_the_typed_text."
							+ "\n" + "hands Write 2000 Time_to_write_a_single_word._Label_Word_count_is_used_to_calculate_total_time. count_label_words"
							+ "\n" + "speech Say 400 Speech._Label_should_be_the_text_of_the_speech." 
							+ "\n" + "system Wait 1000 User_waiting_for_system._Modify_time_by_adding_'(x_seconds)'_at_end_of_line.";

		this.klmTxt = 		"*The Keystroke Level Model is a flat, serial list of all the interactions (operators) you need in order to accomplish some goal. In this example, we're listing the steps necessary to create a new model in Cogulator:"
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

		this.ngomslTxt =		"*Natural GOMS Language (NGOMSL) allows us to structure our task model around a series of goals to be accomplished to complete some task. In this example, we're modeling someone creating a new model in Cogulator:"
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

		this.cpmTxt =		"*In the example below - a model of creating a new model in Cogulator - we're using a mixture of NGOMSL and CPM-GOMS operators to complete the following goals:"
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


		this.mentalMathTxt = "*To simulate working memory load, Cogulator adds chunks to working memory each time certain operators are used. Those operators include: Store, Recall, Look, Search, Perceptual_processor, Listen, or Think. Store can also be used to explicitly force a chunk into working memory. In this example, we model someone adding two, three digit numbers in their head. Each chunk added to working memory is represented as a colored block in the Gantt chart. Over time, those memories begin to decay, until they're no longer accessible. That decay is symbolized in the chart with the use of transparency - the blocks becoming more and more translucent until they leave memory altogether. \n\n*For more precise working memory and workload modeling, we suggest using Chunk Naming. The built-in Forgetting example demonstrates how chunk naming works."
						+ "\n" 
						+ "\n" + "Goal: Listen To Problem"
						+ "\n" + "*What is 354 plus 412?"
						+ "\n" + ". Store What is three"
						+ "\n" + ". Store fifty"
						+ "\n" + ". Store four"
						+ "\n" + ". Store plus"
						+ "\n" + ". Store four hundred"
						+ "\n" + ". Store and twelve"
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


		this.sundryTxt = 	"*Generic collection of methods that may be useful for copying and pasting in your models, or just for getting smart about how Cogulator works."
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

		this.selectionRules = "*Demonstration of selection rules in Cogulator. If you don't have the basics down yet, come back to this later. You don't need selection rules to build useful models."
						+ "\n" 
						+ "\n" + "CreateState Room isDark"
						+ "\n" 
						+ "\n" + "If Room isDark"
						+ "\n" + ". Hands to light switch"
						+ "\n" + ". Turn light switch on"
						+ "\n" + ". SetState Room isLight"
						+ "\n" + "EndIf";

		this.chunkTxt = 		"* In the Mental-Math example, we demonstrate automated working memory modeling. This model is very similar, but we use the more powerful Chunk Naming tool. Chunk Naming is simply the process of putting memory items inside angled brackets. For an example, a number that is familiar to you would be a single chunk like so: <123-4567>.An unfamiliar number would be consider seven chunks: <1><2><3> - <4><5><6><7>. Chunk naming allows for a couple of cool things, including forgetting. In this example, the model shows the user forgetting one of the numbers they are asked to add in their head.  The forgotten chunk is marked in red. Check out the primer at cogulator.io for more information."
						+ "\n" 
						+ "\n" + "Goal: Listen To Problem"
						+ "\n" + "*What is 354 plus 412?"
						+ "\n" + ". Hear What is <3[354]> *retain the number 3 in 354"
						+ "\n" + ". Hear <5[354]> *fifty"
						+ "\n" + ". Hear <4[354]> * four"
						+ "\n" + ". Hear plus"
						+ "\n" + ". Hear <4[412]>"
						+ "\n" + ". Hear and <1[412]>"
						+ "\n" + ". Hear and <2[412]>"
						+ "\n" 
						+ "\n" + "Goal: Calculate Answer"
						+ "\n" + ". Goal: Add 4 plus 2"
						+ "\n" + "*Internal thought"
						+ "\n" + ". . Say Well, <4[354]> plus <2[412]> is 6"
						+ "\n" + ". . Recall <1st6_of766>  (150 ms)"
						+ "\n" + ". Goal: Add_5_plus_1"
						+ "\n" + ". . Say <5[354]> plus <1[412]> is 6"
						+ "\n" + ". . Recall <2nd6_of766>  (150 ms)"
						+ "\n" + ". Goal: Add_3_plus_4"
						+ "\n" 
						+ "\n" + "*. . Goal: Ask for Forgetten Number"
						+ "\n" + "*. . . Say What was that second number again?"
						+ "\n" + "*. . . Hear <4[412]> <1[412]> <2[412]>"
						+ "\n" 
						+ "\n" + ". . Say <3[354]> plus <4[412]> is 7 *4[412] is red because the it's been forgotten. Resolve by removing the *'s before the Ask for Forgetten Number method above."
						+ "\n" + ". . Recall <7_of766> (150 ms)"
						+ "\n" 
						+ "\n" + "Goal: Encode Answer"
						+ "\n" + ".Store <766>"
						+ "\n" 
						+ "\n" + "Goal: Speak Answer"
						+ "\n" + ". Verify answer (5 seconds)"
						+ "\n" + ". Say <7_of766> <2nd6_of766>  <1st6_of766> 766";
		
		//METHODS
		this.pointAndClick = "Goal: Point and Click \n. Look at <target> \n. Point to <target> \n. Cognitive_processor verify cursor over <target> \n. Click <target> \n. Ignore <target> \n"
		
		this.fileSaveAs = "Goal: File Save As \n.Goal: Select File Button \n..Look at <file-button> \n..Point to <file-button> \n..Cognitive_processor verify cursor over <file-button> \n..Click <file-button> \n..Ignore <file-button> \n.Goal: Select Save As Button \n..Look at <save-as> \n..Point to <save-as> \n..Cognitive_processor verify cursor over <save-as> \n..Click <save-as> \n..Ignore <save-as> \n.Goal: Enter File Name \n..Think of <file-name> \n..Look at <file name field> \n..Hands to keyboard \n..Type <file-name> \n..Cognitive_processor verify <file-name> is correct \n..Keystroke Enter  \n..Ignore  <file name field> \n"
			
		this.copyAndPaste ="Goal: Copy and Paste \n.Goal: Start of Selection \n..Look at <start-target> \n..Point to <start-target> \n..Cognitive_processor  verify cursor over <start-target> \n..Click down on <start-target> (150 milliseconds) *half of a click  \n..Ignore <start-target> \n.Goal: End of Selection \n..Look at <end-target> \n..Point to <end-target> \n..Cognitive_processor cursor over <end-target> \n..Click up on <end-target> (150 milliseconds) *half of a click  \n..Ignore <end-target> \n.Goal: Copy Keystrokes \n..Hands to Keyboard \n..Keystroke CONTROL \n..Keystroke C \n.Goal: Point to Destination \n* Assuming hand was left on mouse while selecting CTRL+C \n..Look at <destination-target> \n..Point to <destination-target> \n..Cognitive_processor <destination-target> \n..Click on <destination-target>  \n..Ignore <destination-target> \n.Cognitive_processor text pasted correctly \n"
			
		this.screenTouch = "Goal:  Touch Screen Target \n.Look at <target> \n.Point to <target> \n.Cognitive_processor verify finger is over <target> \n.Touch target \n. Ignore <target> \n";
			
		this.screenSwipe = "Goal:  Swipe & Search * Touch screen \n.Store looking for <Fred> \n. Goal: Swipe \n.. Look at <target> \n.. Point to <target> \n.. Cognitive_processor verify finger is over <target> \n.. Swipe <target> \n.. Ignore <target> \n.Search for <Fred> \n. Goal: Swipe \n.. Look at <target> \n.. Point to <target> \n.. Cognitive_processor verify finger is over <target> \n.. Swipe <target> \n.. Ignore <target> \n.Search for <Fred> * assume found after two swipes \n"
			
		this.perceiveInfo = "Goal: Perceive Info *CPM-GOMS implementation \n.Attend <info> \n.Initiate eye movement \n.Saccade to <info> * (290 ms) if something like a 6 letter word \n.Perceptual_processor perceive <info> \n.Cognitive_processor verify <info>  \n"
			
		this.slowPoint = "Goal: Slow Point and Click \n.Goal: Move Cursor \n..Initiate move <cursor> to <target> \n..Point to <target> (550 ms) \n.. Also: Attend to Target \n...Attend to <target> \n...Initiate gaze to <target> \n...Saccade to <target> \n...Attend to <cursor> at <target>   \n..Perceptual_processor perceive <cursor> at <target>   \n..Cognitive_processor verify <cursor> at <target> \n.Goal: Click \n..Initiate mouse down \n..Click (100 ms) \n"
			
		this.fastPoint = "Goal: Fast Point and Click \n.Goal: Move Cursor \n..Initiate move <cursor> to <target> \n..Point to <target> (550 ms) \n.. Also: Attend to Target \n...Attend to <target> \n...Initiate gaze to <target> \n...Saccade to <target> \n...Look at <target> (100 ms)  \n...Cognitive_processor verify cursor over <target> (100 ms)  \n.Goal: Click \n..Initiate mouse down \n..Click (100 ms) \n "
			
		this.hearAndRespond = "Goal: Hear and Respond \n .Hear Hello. How are you? \n .Perceptual_processor  perceive silence \n .Say I'm find, how about you?  \n"
	}
}

G.firstRun = new FirstRunManager();
