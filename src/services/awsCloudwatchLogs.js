function getEventsFromStreams(logGroupName, logStreamNames, cloudwatchLogsAPI) {
  const params = {
    logGroupName,
    logStreamNames,
    limit: 50,
  };
  return cloudwatchLogsAPI.filterLogEvents(params).promise();
}

function getStreams(api, params) {
  return api.describeLogStreams(params).promise();
}

async function getLogEvents(logGroupName, cloudwatchLogsAPI) {
  const params = {
    logGroupName,
    descending: true,
    limit: 5,
    orderBy: "LastEventTime",
  };
  const streams = await getStreams(cloudwatchLogsAPI, params);
  const streamNames = streams.logStreams.map((stream) => stream.logStreamName);

  const data = await getEventsFromStreams(
    logGroupName,
    streamNames,
    cloudwatchLogsAPI
  );

  return data.events;
}

module.exports = {
  getLogEvents,
};
