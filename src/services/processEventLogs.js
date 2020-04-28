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

function checkLogsForErrors(events, application, program) {
  let latestErrorId = "";
  events.forEach((event) => {
    if (event.message.includes("ERROR")) {
      latestErrorId = event.eventId;
    }
  });

  const latestError = {
    id: latestErrorId,
    region: program.region,
    funcName: application.resourceTable.fullFuncName,
  };

  if (
    latestError.id !== application.prevError.id &&
    latestError.region === application.prevError.region &&
    latestError.funcName === application.prevError.funcName
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
