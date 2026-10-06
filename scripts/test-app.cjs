// Run with Electron. An optional Resources/app path checks packaged contents.
const { app, BrowserWindow, dialog } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'cogulator-app-test-'));
for (const name of ['userData', 'documents', 'desktop']) {
  const directory = path.join(temporary, name);
  fs.mkdirSync(directory);
  app.setPath(name, directory);
}
app.setAppPath(root);
const errors = [];
const timeout = setTimeout(() => fail(new Error('App startup test timed out')), 60000);
function fail(error) {
  console.error(error);
  if (errors.length) console.error('Renderer errors:', errors);
  clearTimeout(timeout);
  app.exit(1);
}
process.on('uncaughtException', fail);
process.on('unhandledRejection', fail);
app.on('browser-window-created', (_event, window) => {
  window.webContents.on('console-message', event => {
    if (event.level === 'error') errors.push(event.message);
  });
  window.webContents.on('render-process-gone', (_event, details) => errors.push(JSON.stringify(details)));
});
// Avoid an interactive native dialog while exercising the real export handler.
const exportPath = path.join(temporary, 'export.txt');
dialog.showSaveDialogSync = () => exportPath;
dialog.showErrorBox = (title, message) => { throw new Error(`${title}: ${message}`); };
require(path.join(root, 'src/index.js'));
app.whenReady().then(async () => {
  const window = BrowserWindow.getAllWindows()[0];
  assert.ok(window, 'Main window was created');
  const evaluate = source => window.webContents.executeJavaScript(source);
  // Startup dynamically loads the editor, model engine, and sidebar scripts.
  while (!(await evaluate(`typeof G !== 'undefined' && !!G.magicModels && !!G.modelsManager && !!G.modelsManager.selected && G.quill.getLength() > 1`))) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const model = 'Goal: Respond to alert\n.Look at <alert>\n.Think of <response>\n.Say <response>\n';
  const result = await evaluate(`(() => {
    G.quill.setText(${JSON.stringify(model)});
    G.gomsProcessor.process();
    return { steps: G.gomsProcessor.intersteps.length, time: G.gomsProcessor.totalTaskTime };
  })()`);
  assert.equal(result.steps, 3);
  assert.ok(result.time > 0);
  const files = await evaluate(`(() => {
    const destination = path.join(G.paths.models, 'Upgrade Test.goms');
    fs.writeFileSync(destination, G.quill.getText());
    G.modelsManager.loadModel(destination);
    G.quill.setText(G.quill.getText() + '* saved edit\\n');
    G.modelsManager.saveModel();
    const saved = fs.readFileSync(destination, 'utf8');
    const renamed = path.join(G.paths.models, 'Renamed Test.goms');
    fs.renameSync(destination, renamed);
    G.modelsManager.selected = renamed;
    G.modelsManager.loadModel(renamed);
    const copy = path.join(G.paths.models, 'Copied Test.goms');
    fs.copyFileSync(renamed, copy);
    G.exportManager.exportModel();
    return { saved, reopened: G.quill.getText(), copied: fs.readFileSync(copy, 'utf8') };
  })()`);
  assert.ok(files.saved.includes('* saved edit'));
  assert.equal(files.reopened, files.saved);
  assert.equal(files.copied, files.saved);
  assert.match(fs.readFileSync(exportPath, 'utf8'), /^operator\tlabel/);
  const service = require(path.join(root, 'src/embeddings/service'));
  const vector = await service.embed('Point to a button');
  assert.equal(vector.length, 384);
  const matches = await require(path.join(root, 'src/localRetrieval')).findMatches(vector);
  assert.ok(matches.some(chunk => /point/i.test(chunk.text)));
  service.dispose();
  assert.deepEqual(errors, [], 'No renderer errors');
  console.log(`Electron ${process.versions.electron} (${process.arch}): startup, renderer modeling, save/reopen/rename/copy/export, and bundled embeddings passed (${app.isPackaged ? 'packaged' : 'development'}).`);
  clearTimeout(timeout);
  // Exit directly so cleanup cannot run the app's save-on-window-close hooks.
  app.exit(0);
}).catch(fail);
