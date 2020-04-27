function updateLogContentsFromEvents(log, events) {
  if (events.length === 0) {
    log.setContent("ERROR: No log streams found for this function.");
  } else {
    log.setContent("");
    events.forEach((event) => {
      log.log(event.message);
    });
  }
}

function checkLogsForErrors(events, application) {
  let latestErrorId = "";
  events.forEach((event) => {
    if (event.message.includes("ERROR")) {
      latestErrorId = event.eventId;
    }
  });
  if (latestErrorId !== application.prevErrorId) {
    application.setPrevErrorId(latestErrorId);
    if (application.firstLogsRetrieved) {
      application.notifier.bell();
      console.log("Recent lambda error. Check logs for details");
    }
  }
}

module.exports = {
  updateLogContentsFromEvents,
  checkLogsForErrors,
};
