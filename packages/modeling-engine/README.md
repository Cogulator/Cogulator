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

For this migration stage, the package imports those canonical modules from Cogulator's `src/` directory. The next extraction step moves their physical ownership beneath this package and changes Cogulator's script loader to consume them from there. The public `profileModel` contract and its parity fixtures are already in place, so that move can be made without changing consumers.
