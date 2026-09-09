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

## Native implementation

`profileModel` runs the Cogulator processor, working-memory model, and subjective-workload model as native CommonJS modules. The package injects model text, operator definitions, error collection, and callbacks; it does not create a DOM, Electron process, Quill editor, or mutable application `G` state. Cogulator continues to load the same classes in the browser through its existing lifecycle adapter.

The package is now the canonical home for those modules under `src/core/`. Cogulator's startup loader consumes the same files as browser scripts, while the package API imports them directly. The public `profileModel` contract and parity fixtures protect both paths from drifting apart.
