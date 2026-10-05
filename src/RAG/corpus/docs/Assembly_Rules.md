Cogulator Model Assembly Rules (Compact)

- Syntax
  - Use "Goal:" lines to declare tasks and sub-tasks.
  - Use periods to indicate hierarchy: each child line has one more period than its parent.
  - Use valid operator names only (e.g., Look, Point, Click, Verify, Type, Hands, Turn, Touch, Swipe, Think, Recall, Store).
  - Any comments or descriptive notes must be placed on their own line starting with "* " (asterisk + space).

- Motor/Perceptual coupling
  - Precede motor actions with Look to visually acquire the target.
  - Use Verify (or Cognitive_processor for experts) to confirm outcomes when appropriate.

- Device transitions
  - Use Hands when switching between devices (e.g., mouse ↔ keyboard, screen ↔ physical controls).

- Memory (Chunking)
  - Add information to memory with <> paired with Recall, Look, Search, Perceptual_processor, Hear, or Think.
  - Referencing a chunk without those operators tests for forgetting.

- Parallelism
  - Use "Also:" for parallel goals; add "as <thread>" to keep tasks serial within the same thread while running parallel to others.

- Examples (patterns)
  - Point and Click
    - Goal: Point and Click <target>
    - . Look at <target>
    - . Point to <target>
    - . Verify cursor over <target>
    - . Click <target>
  - Turn control and verify
    - Goal: Adjust Control <setting>
    - . Look at <control>
    - . Turn <control>
    - . Verify <setting>
  - Comment format example
    - * Note: comments start with an asterisk followed by a space

Keep models concise and consistent with these rules.
