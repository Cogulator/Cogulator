function createUpdateController({ app, autoUpdater, dialog, updateElectronApp, UpdateSourceType,
  platform = process.platform, logger = console }) {
  let started = false;
  let checking = false;
  let downloading = false;
  let downloaded = false;
  let manual = false;
  let stopUpdates;

  const show = (message, detail = '') => dialog.showMessageBox({
    type: 'info', title: 'Cogulator Updates', message, detail,
  }).catch(error => logger.warn('Unable to show update status:', error));

  function start() {
    if (started || !app.isPackaged || !['darwin', 'win32'].includes(platform)) return;
    started = true;
    autoUpdater.on('checking-for-update', () => { checking = true; });
    autoUpdater.on('update-available', () => {
      checking = false;
      downloading = true;
      if (manual) {
        manual = false;
        void show('A new version is downloading.', 'Cogulator will offer to restart when the download finishes.');
      }
    });
    autoUpdater.on('update-not-available', () => {
      checking = false;
      if (manual) {
        manual = false;
        void show('Cogulator is up to date.', `You are running version ${app.getVersion()}.`);
      }
    });
    autoUpdater.on('update-downloaded', () => {
      checking = false;
      downloading = false;
      downloaded = true;
      manual = false;
    });
    autoUpdater.on('error', error => {
      checking = false;
      downloading = false;
      logger.warn('Cogulator update check failed:', error);
      if (manual) {
        manual = false;
        void show('Unable to check for updates.', 'Please try again later. You can also download releases from github.com/Cogulator/Cogulator/releases.');
      }
    });
    try {
      ({ stopUpdates } = updateElectronApp({
        updateSource: { type: UpdateSourceType.ElectronPublicUpdateService, repo: 'Cogulator/Cogulator' },
        logger, notifyUser: true,
      }));
      // The helper checks immediately, then schedules repeat checks. Cancel
      // its timer while retaining the feed and download/restart listeners.
      stopUpdates();
      stopUpdates = undefined;
    } catch (error) {
      logger.warn('Unable to start Cogulator updates:', error);
      started = false;
    }
  }

  async function checkForUpdates() {
    if (!app.isPackaged) return show('Update checks are disabled during development.');
    if (!['darwin', 'win32'].includes(platform)) {
      return show('Automatic updates are available on macOS and Windows.', 'Download Linux releases from github.com/Cogulator/Cogulator/releases.');
    }
    if (!started) return show('Unable to start update checks.', 'Please restart Cogulator and try again.');
    if (downloaded) {
      const { response } = await dialog.showMessageBox({ type: 'info', title: 'Cogulator Updates',
        message: 'An update is ready to install.', detail: 'Restart Cogulator to apply the update.',
        buttons: ['Restart', 'Later'], defaultId: 1, cancelId: 1 });
      if (response === 0) autoUpdater.quitAndInstall();
      return;
    }
    if (downloading) return show('A new version is downloading.', 'Cogulator will offer to restart when the download finishes.');
    manual = true;
    // A startup check can fulfill the manual request already in progress.
    if (checking) return;
    checking = true;
    try { autoUpdater.checkForUpdates(); }
    catch (error) { autoUpdater.emit('error', error); }
  }

  return { start, checkForUpdates, stop: () => stopUpdates?.() };
}

module.exports = { createUpdateController };
