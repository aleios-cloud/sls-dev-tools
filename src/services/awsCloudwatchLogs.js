function getEventsFromStreams(logGroupName, logStreamNames, cloudwatchLogsAPI) {
  const params = {
    logGroupName,
    logStreamNames,
    limit: 50,
  };
  return cloudwatchLogsAPI
    .filterLogEvents(params)
    .promise()
    .catch((err) => {
      console.error(err);
    });
}

function getStreams(api, params) {
  return api
    .describeLogStreams(params)
    .promise()
    .catch((err) => {
      console.error(err);
    });
}

async function getLogEvents(logGroupName, cloudwatchLogsAPI) {
  const params = {
    logGroupName,
    descending: true,
    limit: 5,
    orderBy: "LastEventTime",
  };
  const streams = await getStreams(cloudwatchLogsAPI, params);
  if (streams) {
    const streamNames = streams.logStreams.map(
      (stream) => stream.logStreamName
    );
    if (streamNames.length === 0) {
      return [];
    }

    const data = await getEventsFromStreams(
      logGroupName,
      streamNames,
      cloudwatchLogsAPI
    );

    return data.events;
  }
  return null;
}

module.exports = {
  getLogEvents,
};
