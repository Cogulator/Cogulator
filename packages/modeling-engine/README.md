# `@cogulator/modeling-engine`

The first programmatic API for Cogulator model profiling.

```js
const { profileModel } = require('@cogulator/modeling-engine');

const result = profileModel({
  source: 'Goal: Respond\n.Look at <alert>\n.Think of response\n.Say response',
});
console.log(result.totalTaskTime, result.memory.averageLoad, result.workload.max);
```

`profileModel` returns JSON-safe task timing, interleaved steps, working-memory data, subjective-workload data, thread order, and modeling errors. Pass `operatorText` when a model depends on a custom Cogulator operator library.

```js
const { profileScenario } = require('@cogulator/modeling-engine');

const scenario = profileScenario({
  tasks: [
    { id: 'alert', source: alertModel, startTime: 15_000 },
    { id: 'reply', source: replyModel, startTime: 35_000 },
  ],
});
```

`profileScenario` schedules all task instances against one participant's shared cognitive, perceptual, manual, and verbal resources. It returns task-instance start/end times plus scenario-wide working-memory and workload results.

## Native implementation

`profileModel` runs the Cogulator processor, working-memory model, and subjective-workload model as native CommonJS modules. The package injects model text, operator definitions, error collection, and callbacks; it does not create a DOM, Electron process, Quill editor, or mutable application `G` state. Cogulator continues to load the same classes in the browser through its existing lifecycle adapter.

The package is now the canonical home for those modules under `src/core/`. Cogulator's startup loader consumes the same files as browser scripts, while the package API imports them directly. The public `profileModel` contract and parity fixtures protect both paths from drifting apart.

## Experimental Task source

`profileModel({ source })` also accepts top-level `Task` containers with absolute start offsets and finish dependencies. This is supported directly in the Cogulator editor. See [Task syntax and runnable examples](../../Docs/Task-construct.md). Task results include `taskInstances` and per-step task identities. The `profileScenario` API compiles its inputs into Task source and profiles that source once with the same processor.

## Scenario compilation

`compileScenario({ tasks })` returns `{ source, tasks, sourceMap }` without profiling. Each input has a unique `id`, GOMS `source`, optional `model` filename, and `startTime` in milliseconds (default zero). `startType` is `absolute` (default), `after_start`, or `after_finish`; relative types require `referenceTask` and treat `startTime` as an offset from that event. Start dependencies follow actual first-operator times, and finish dependencies include all internal branches.

Each invocation gets a generated `task_N` ID, one additional indentation level, and an explicit timing clause. Ordinary Goal/Also source is expected; models already containing Task wrappers are rejected. Internal goal references are resolved within their Task instance. The source can be opened directly in Cogulator.

`profileScenario` returns that generated `source` and `sourceMap` with its profile. Task-instance IDs and step `taskId` fields use the original input IDs; task instances also expose `generatedId`. Step/error `lineNo` values refer to original model lines, and `combinedLineNo` refers to generated source. All line numbers are zero-based. Source-map entries are null for generated comments, and use a null `lineNo` for Task headers.

One combined source uses one operator vocabulary. Supply a scenario-wide `operatorText` for custom operators; incompatible per-task vocabularies are rejected. As with directly authored Task source, GoTo is not supported in Task models yet.
