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

## Compatibility implementation

This version runs the existing Cogulator processor in an isolated runtime. It is intentionally a behavior-preserving bridge: it removes the caller's dependence on Quill, jQuery, Electron, and the application's mutable `G` state while retaining the established algorithms. The next phase moves the legacy classes into native package modules; consumers will not need to change their use of `profileModel`.
