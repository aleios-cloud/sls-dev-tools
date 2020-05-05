const updateNotifier = require("update-notifier");
const pkg = require("../../package.json");

function checkForUpdates() {
  const notifier = updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60 * 60 * 24, // 1 day
    shouldNotifyInNpmScript: true,
  });

  notifier.notify();

  if (notifier.update && notifier.update.current !== notifier.update.latest) {
    // TODO: Instead of console.log, this could return a status which can be shown in a program dialog
    console.log(
      `Update for sls-dev-tools available: 
  Current: ${notifier.update.current}
  Latest: ${notifier.update.latest}`
    );
  }
}

module.exports = checkForUpdates;
