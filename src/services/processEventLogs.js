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
      console.log(`Error id is ${latestErrorId}`);
    }
  }
}

module.exports = {
  updateLogContentsFromEvents,
  checkLogsForErrors,
};
