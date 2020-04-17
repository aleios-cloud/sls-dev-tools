const durationBarChartOptions = {
    barWidth: 6,
    label: 'Lambda Duration (ms) (most recent)',
    barSpacing: 6,
    xOffset: 2,
    maxHeight: 9,
};

const updateDurationBarChart = (fullFunctionName, durationBarChart, application, cloudwatchLogs) => {
    const logGroupName = `/aws/lambda/${fullFunctionName}`;
    const describeLogStreamsParams = {
        logGroupName,
        descending: true,
        limit: 5,
        orderBy: "LastEventTime",
    };
    return cloudwatchLogs
        .describeLogStreams(describeLogStreamsParams, (err, data) => {
            if (err) {
                console.log(err, err.stack); // an error occurred
            } else {
                const logStreamNames = data.logStreams.map((stream) => stream.logStreamName);
                if (logStreamNames.length === 0) {
                    application.lambdaLog.setContent(
                        "ERROR: No log streams found for this function."
                    );
                    return;
                }
                const filterLogEventsParams = {
                    logGroupName,
                    logStreamNames,
                };
                cloudwatchLogs
                    .filterLogEvents(filterLogEventsParams)
                    .promise()
                    .then(
                        (logs) => {
                            const { events } = logs;
                            application.lambdaLog.setContent("");
                            events.forEach((event) => {
                                application.lambdaLog.log(event.message);
                            });
                            setBarChartDataFromLogContent(durationBarChart, application.lambdaLog.content);
                        },
                        (err) => {
                            console.log(err, err.stack);
                        }
                    );
            }
        })
        .promise();
}

const setBarChartDataFromLogContent = (lambdaInfoBar, lambdaLogContent) => {
    const regex = /RequestId:(\s)*(\w|-)*(\s)*Duration:(\s)*(\d|\.)*(\s)*ms/gm;
    // Extract reports from the server logs
    const matches = lambdaLogContent.match(regex);
    const splits = [];
    if (matches !== null) {
        for (let i = 0; i < matches.length; i++) {
            // Split report into fields using tabs (or 4 spaces)
            splits.push(matches[i].split(/\t|\s\s\s\s/));
        }
        lambdaInfoBar.setData({
            titles: ['1', '2', '3', '4', '5'],
            // Extract numerical value from field by splitting on spaces, and taking second value
            data: splits.map((s) => s[1].split(' ')[1]).slice(-5),
        });
    }
}

module.exports = {
    durationBarChartOptions,
    updateDurationBarChart,
};
