# Task containers in Cogulator

`Task` is an experimental top-level construct for combining independently scheduled work in one GOMS model. It runs in the shared GOMS processor, including the Cogulator desktop editor. The browser scenario profiler compiles CSV schedules and individual models into this same syntax. Its GOMS source tab shows and downloads the exact combined source used for the profile.

## Try it

On the `modeling-package-api` branch, restart Cogulator (`npm start` for the development app). Create a model and paste in one of these examples, or import the `.goms` file:

- [Task-Offsets.goms](Examples/Task-Offsets.goms): two tasks released at 2 seconds. Vision is shared; pointing and looking overlap. Total scenario time: 6 seconds.
- [Task-Dependencies.goms](Examples/Task-Dependencies.goms): a task waits for another task's main thread and internal `Also` branch. Includes a forward dependency and a 1-second offset. Total time: 6 seconds.
- [Task-Parallel-Waits.goms](Examples/Task-Parallel-Waits.goms): two resource-free waits overlap, followed by concurrent visual and verbal work. Total time: 4 seconds.

The comments in each example give expected operator start and end times. Expand the Gantt chart to inspect resource use. Task IDs appear in task-model timeline annotations. The existing detailed chart annotates up to three threads; operators from additional threads still render.

## Syntax

```text
Task: Push a button as button starting_at 2 seconds
. Goal: Accomplish A Button Push
. . Look at Button (1 seconds)
. . Point to Button (1 seconds)
. . Click on Button (1 seconds)

Task: Read status as status starting_at 2 seconds
. Goal: Check Status
. . Look at Status (1 seconds)
. . Think about Status (2 seconds)

Task: Announce completion as announce starting_after status finishes plus 500 ms
. Say Done (1 seconds)
```

- `Task` declarations must be at the top level. The colon is optional.
- `as` introduces a required, unique, case-sensitive task ID. IDs start with a letter or underscore and contain letters, digits, underscores, or hyphens.
- `starting_at number seconds` gives a nonnegative release offset from scenario time zero. Decimal offsets, `second`, `ms`, and `milliseconds` are also accepted.
- Timing keywords require underscores (`starting_at`, `starting_after`). Task offsets use bare numbers and units, without parentheses. Operator durations still use parentheses.
- Omitting the timing clause means `starting_at 0 seconds`.
- `starting_after task_id finishes` releases work after **all** of that task's threads finish. Add `plus number seconds` or `plus number ms` for a further delay. Forward references are allowed; missing IDs and dependency cycles are errors.
- `starting_after task_id starts` follows the referenced task’s actual first-operator start, including any delay for resource access. It accepts the same optional `plus` offset.
- An empty task completes at its release time and can serve as a timing anchor.

## Execution semantics

A release time makes a task eligible; it does not guarantee immediate access to a busy resource. The processor chooses the next runnable operator with the earliest available resource slot. Ties follow task declaration order, then thread declaration order. Operators run to completion without preemption. Cognition, vision, hands, and verbal communication are shared across tasks; hearing and speech share verbal communication. `Wait` uses no shared resource and advances only its own thread.

Nested `Goal` statements inside a task inherit their enclosing thread. An internal `Also` starts a distinct branch at the preceding operator's start, or at task release if there is no preceding operator. Nested goals inside that branch inherit the branch thread. There is no implicit join when indentation returns to the parent; a finish dependency on the containing task waits for all its branches.

Task IDs scope memory chunks and internal thread names. Identical `<item>` labels in different tasks represent separate memory items. Within a task, chunks can be shared across its branches. Explicit `Also` names must be unique within a task; the same name can be used in different tasks.

A source containing `Task` must put all executable work inside task containers. Do not mix unwrapped goals/operators with task containers. The prototype does not support `GoTo` within task models. Existing models without `Task` keep their original goal/thread assignment and interleaving path.

## Processor and API

Task models are passed directly to `profileModel({ source })`. The result includes `taskInstances` with IDs, labels, source line numbers, scheduled release times, actual first-operator times, and completion times. Each step also includes `taskId` and `taskLabel`. Times are in milliseconds and line numbers are zero-based.

Task readiness and dependency handling are implemented in `GomsProcessor`; operator placement uses its shared `findStartEndTime` and `getResourceAvailability` methods, with the same operator durations and cycle-time setting as ordinary models. The resource interval lookup supports non-mutating availability checks and keeps reservations in time order.

The `profileScenario` API calls `compileScenario`, then profiles the combined source once through the shared processor. It returns the source and a line map alongside results, mapping generated task identities and errors back to the original scenario rows and model lines. The browser profiler uses this API; it no longer independently schedules parsed steps.
