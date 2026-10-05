Based on the primer, here is a condensed guide containing only the essential syntax, rules, and operators needed to produce an accurate and effective Cogulator model:

### 1. Model Structure & Syntax

The best Cogulator models use CMN-GOMS syntax, which creates a hierarchical outline of the tasks.

* **Goal Statements:** Define the task or subtask being completed (e.g., `Goal: Point Click`).
* **Hierarchy:** Use periods (`.`) to convey the task's hierarchy. Each operator or subgoal is preceded by one more period than its parent goal.

*Example:*

```text
Goal: Point Click
. Look at target
. Point to target
. Verify cursor over target
. Goal: Subgoal Point Click

```

### 2. Operators & Modifiers

Each line of action consists of an operator, an optional label, and an optional modifier.

* **Operator Name:** The action itself (e.g., `Look`, `Point`, `Think`, `Type`).
* **Label:** Describes how the operator is used (e.g., `to Save Button`). Operators like `Type`, `Hear` (Listen), and `Say` require a label to calculate the time.
* **Modifier:** Used to override the default task time. It is placed in parentheses at the end of the line using units like `ms`, `seconds`, or `syllables`. Example: `Point to Save Button (300 ms)` or `Say clearance (12 syllables)`.

**Key Built-in Operators:**

* **Visual:** `Look` (550 ms), `Search` (1250 ms), `Read` (260 ms/word).
* **Audition & Speech:** `Hear` (400 ms/syllable), `Say` (400 ms/syllable).
* **Cognitive:** `Think` (1250 ms), `Verify` (1250 ms), `Recall` (550 ms), `Store` (50 ms).
* **Motor:** `Point` (950 ms), `Click` (320 ms), `Type` (280 ms/key), `Keystroke` (280 ms), `Hands` (450 ms), `Turn` (800 ms), `Touch` (490 ms), `Swipe` (170 ms).

### 3. Simulating Working Memory (Chunking)

Cogulator models working memory load and decay using "chunk naming".

* **Adding to Memory:** Enclose a chunk of information in angled brackets (e.g., `<fred@cog.com>`). To add it to memory, it must be paired with specific operators: `Recall`, `Look`, `Search`, `Perceptual_processor`, `Hear`, or `Think`.
* **Testing Memory:** Using a named chunk *without* one of the operators above tests whether the item has decayed/been forgotten. If too much time has passed between storing the chunk and using it, Cogulator will flag it as forgotten.

### 4. Multitasking (Parallel Execution)

To model a user doing two things at once (e.g., talking while typing), use the `Also:` statement.

* Replace `Goal:` with `Also:` to execute tasks in parallel.
* **Threads:** Add `as [thread_name]` to the end of the `Also:` statement (e.g., `Also: Point and Click as hands`) to assign tasks to specific serial threads while allowing them to run parallel to other threads.

### 5. Modeling Best Practices & Tips

* **Hand Movements:** Do not forget to include the `Hands` operator when a user must move their hands between devices, such as from a mouse to a keyboard.
* **Visual confirmation:** A `Look` operator should generally precede a motor action (like swiping or pointing to a target) to establish visual acquisition.