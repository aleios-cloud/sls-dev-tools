const watchman = require("fb-watchman");

class DiffDetection {
  constructor(location) {
    this.watchmanClient = new watchman.Client();
    this.location = location;
    this.createWatch();
  }

  createWatch() {
    this.watchmanClient.capabilityCheck(
      { optional: [], required: ["relative_root"] },
      (checkError) => {
        if (checkError) {
          console.error("Diff Detection not supported on your system");
          this.watchmanClient.end();
        } else {
          this.watchmanClient.command(
            ["watch-project", this.location],
            (watchError, watchResp) => {
              if (watchError) {
                console.error("Error initiating diff detection:", watchError);
                return;
              }
              if ("warning" in watchResp) {
                console.log("Diff detection warning: ", watchResp.warning);
              }
              console.log(
                "watch established on ",
                watchResp.watch,
                " relative_path",
                watchResp.relative_path
              );
            }
          );
        }
      }
    );
  }
}

module.exports = {
  DiffDetection,
};
