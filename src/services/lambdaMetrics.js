const getLambdaMetrics = (application, functionName, cloudwatch) => {
  application.endTime = new Date();
  const params = {
    StartTime: application.startTime,
    EndTime: application.endTime,
    MetricDataQueries: [
      {
        Id: "errors",
        MetricStat: {
          Metric: {
            Dimensions: [
              {
                Name: "FunctionName",
                Value: functionName,
              },
              {
                Name: "Resource",
                Value: functionName,
              },
            ],
            MetricName: "Errors",
            Namespace: "AWS/Lambda",
          },
          Period: application.interval,
          Stat: "Sum",
        },
        ReturnData: true,
      },
      {
        Id: "invocations",
        MetricStat: {
          Metric: {
            Dimensions: [
              {
                Name: "FunctionName",
                Value: functionName,
              },
              {
                Name: "Resource",
                Value: functionName,
              },
            ],
            MetricName: "Invocations",
            Namespace: "AWS/Lambda",
          },
          Period: application.interval,
          Stat: "Sum",
        },
        ReturnData: true,
      },
    ],
  };

  return cloudwatch
    .getMetricData(params)
    .promise()
    .catch((error) => console.error(error));
};

module.exports = {
  getLambdaMetrics,
};
