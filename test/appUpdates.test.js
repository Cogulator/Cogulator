const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createUpdateController } = require('../src/appUpdates');

function harness({ packaged = true, platform = 'darwin', failStart = false } = {}) {
  const updater = new EventEmitter();
  let checks = 0, installs = 0, stops = 0;
  const dialogs = [], starts = [], warnings = [];
  let response = 1;
  updater.checkForUpdates = () => { checks++; updater.emit('checking-for-update'); };
  updater.quitAndInstall = () => { installs++; };
  const controller = createUpdateController({
    app: { isPackaged: packaged, getVersion: () => '5.0.0' }, platform,
    autoUpdater: updater,
    dialog: { showMessageBox: async options => { dialogs.push(options); return { response }; } },
    logger: { log() {}, warn: (...args) => warnings.push(args) },
    UpdateSourceType: { ElectronPublicUpdateService: 0 },
    updateElectronApp: options => {
      starts.push(options);
      if (failStart) throw new Error('Unsigned app');
      updater.checkForUpdates();
      return { stopUpdates: () => stops++ };
    },
  });
  return { controller, updater, dialogs, starts, warnings,
    get checks() { return checks; }, get installs() { return installs; }, get stops() { return stops; },
    chooseRestart() { response = 0; },
  };
}

test('packaged apps check once at startup and immediately cancel repeat checks', () => {
  const h = harness();
  h.controller.start(); h.controller.start();
  assert.equal(h.starts.length, 1);
  assert.equal(h.starts[0].updateSource.repo, 'Cogulator/Cogulator');
  assert.equal(h.starts[0].updateInterval, undefined);
  assert.equal(h.starts[0].notifyUser, true);
  assert.equal(h.checks, 1);
  assert.equal(h.stops, 1);
  h.controller.stop();
  assert.equal(h.stops, 1);
});

test('development and unsupported platforms do not call the native updater', async () => {
  for (const options of [{ packaged: false }, { platform: 'linux' }]) {
    const h = harness(options);
    h.controller.start();
    await h.controller.checkForUpdates();
    assert.equal(h.starts.length, 0);
    assert.equal(h.checks, 0);
    assert.equal(h.dialogs.length, 1);
  }
});

test('background no-update and network failures remain quiet; manual checks report outcomes', async () => {
  const h = harness();
  h.controller.start();
  h.updater.emit('update-not-available');
  h.updater.emit('error', new Error('Network unavailable'));
  assert.equal(h.dialogs.length, 0);
  await h.controller.checkForUpdates();
  h.updater.emit('update-not-available');
  assert.match(h.dialogs[0].message, /up to date/);
  assert.match(h.dialogs[0].detail, /5.0.0/);
  await h.controller.checkForUpdates();
  h.updater.emit('error', new Error('Network unavailable'));
  assert.match(h.dialogs[1].message, /Unable to check/);
});

test('manual requests reuse a running check and do not redownload a ready update', async () => {
  const h = harness({ platform: 'win32' });
  h.controller.start();
  await h.controller.checkForUpdates();
  await h.controller.checkForUpdates();
  assert.equal(h.checks, 1);
  h.updater.emit('update-available');
  assert.match(h.dialogs[0].message, /downloading/);
  await h.controller.checkForUpdates();
  assert.equal(h.checks, 1);
  h.updater.emit('update-downloaded');
  await h.controller.checkForUpdates();
  assert.equal(h.installs, 0);
  h.chooseRestart();
  await h.controller.checkForUpdates();
  assert.equal(h.installs, 1);
  assert.equal(h.checks, 1);
});

test('updater setup and synchronous check failures do not crash the app', async () => {
  const failed = harness({ failStart: true });
  assert.doesNotThrow(() => failed.controller.start());
  await failed.controller.checkForUpdates();
  assert.match(failed.dialogs[0].message, /Unable to start/);
  const h = harness();
  h.controller.start(); h.updater.emit('update-not-available');
  h.updater.checkForUpdates = () => { throw new Error('Feed unavailable'); };
  await h.controller.checkForUpdates();
  assert.match(h.dialogs[0].message, /Unable to check/);
});
