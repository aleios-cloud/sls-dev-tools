function updateLogContentsFromEvents(log, events) {
  if (!events || events.length === 0) {
    log.setContent("ERROR: No log streams found for this function.");
  } else {
    log.setContent("");
    events.forEach((event) => {
      log.log(event.message);
    });
  }
}

function checkLogsForErrors(events, application) {
  let logId = "";
  if (events.length > 0) {
    logId = events[0].logStreamName;
  }
  let latestErrorId = "";
  events.forEach((event) => {
    if (event.message.includes("ERROR")) {
      latestErrorId = event.eventId;
    }
  });

  const latestError = {
    errorId: latestErrorId,
    logId,
  };

  if (
    latestError.errorId !== application.prevError.errorId &&
    latestError.logId === application.prevError.logId
  ) {
    application.notifier.bell();
    console.log("Recent lambda error. Check logs for details");
  }

  application.setPrevError(latestError);
}

module.exports = {
  updateLogContentsFromEvents,
  checkLogsForErrors,
};
