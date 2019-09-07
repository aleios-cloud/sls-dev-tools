/* eslint-disable no-plusplus */
/* eslint-disable no-console */
/* eslint-disable new-cap */
import AWS from 'aws-sdk';

const blessed = require('blessed');
const contrib = require('blessed-contrib');

const screen = blessed.screen({ smartCSR: true });
const cloudformation = new AWS.CloudFormation({ region: process.argv[3] });
const cloudwatch = new AWS.CloudWatch({ region: process.argv[3] });
const cloudwatchLogs = new AWS.CloudWatchLogs({ region: process.argv[3] });

const getLambdaMetrics = (functionName, cb) => {
  let startTime;
  if (process.argv[4]) {
    // eslint-disable-next-line prefer-destructuring
    startTime = new Date(process.argv[4]);
  } else {
    startTime = new Date();
    const dateOffset = (24 * 60 * 60 * 1000); // 1 day
    startTime.setTime(startTime.getTime() - dateOffset);
  }

  const params = {
    EndTime: new Date(),
    MetricDataQueries: [ /* required */
      {
        Id: 'duration', /* required */
        MetricStat: {
          Metric: { /* required */
            Dimensions: [
              {
                Name: 'FunctionName',
                Value: functionName,
              },
              {
                Name: 'Resource',
                Value: functionName,
              },
              /* more items */
            ],
            MetricName: 'Duration',
            Namespace: 'AWS/Lambda',
          },
          Period: '300', /* required */
          Stat: 'Maximum', /* required */
        },
        ReturnData: true,
      },
      {
        Id: 'errors', /* required */
        MetricStat: {
          Metric: { /* required */
            Dimensions: [
              {
                Name: 'FunctionName',
                Value: functionName,
              },
              {
                Name: 'Resource',
                Value: functionName,
              },
              /* more items */
            ],
            MetricName: 'Errors',
            Namespace: 'AWS/Lambda',
          },
          Period: '300', /* required */
          Stat: 'Sum', /* required */
        },
        ReturnData: true,
      },
      {
        Id: 'invocations', /* required */
        MetricStat: {
          Metric: { /* required */
            Dimensions: [
              {
                Name: 'FunctionName',
                Value: functionName,
              },
              {
                Name: 'Resource',
                Value: functionName,
              },
              /* more items */
            ],
            MetricName: 'Invocations',
            Namespace: 'AWS/Lambda',
          },
          Period: '300', /* required */
          Stat: 'Sum', /* required */
        },
        ReturnData: true,
      },
    ],
    StartTime: startTime,
    ScanBy: 'TimestampDescending',
  };
  cloudwatch.getMetricData(params, (err, data) => {
    if (err) console.log(err, err.stack); // an error occurred
    else cb(data); // successful response
  });
};


// create layout and widgets

const grid = new contrib.grid({ rows: 12, cols: 12, screen });

const bar = grid.set(4, 6, 4, 3, contrib.bar,
  {
    label: 'Lambda Duration (most recent)',
    barWidth: 5,
    barSpacing: 6,
    xOffset: 2,
    maxHeight: 9,
  });

const table = grid.set(0, 6, 4, 6, contrib.table,
  {
    keys: true,
    fg: 'green',
    label: 'Lambda Functions',
    columnSpacing: 1,
    columnWidth: [44, 60],
  });


const getLambdasForStackName = (stackName, setData) => cloudformation.listStackResources(
  { StackName: stackName },
  (err, data) => {
    if (err) {
      console.log(err, err.stack);
    } else {
      setData(data.StackResourceSummaries.filter(
        (res) => res.ResourceType === 'AWS::Lambda::Function',
      ).map((lam) => [lam.PhysicalResourceId, lam.LastUpdatedTimestamp]));
      screen.render();
    }
  },
);

const invocationsLineGraph = grid.set(2, 0, 6, 6, contrib.line,
  {
    maxY: 0,
    label: 'Function Metrics',
    showLegend: true,
    xPadding: 10,
    wholeNumbersOnly: true,
    legend: { width: 50 },
  });

const map = grid.set(4, 9, 4, 3, contrib.map, { label: `Servers Location (${process.argv[3]})` });

const log = grid.set(8, 0, 4, 12, blessed.log,
  {
    fg: 'green',
    selectedFg: 'green',
    label: 'Server Log',
    interactive: true,
    scrollbar: { bg: 'blue' },
    mouse: true,
  });


const getLogEvents = (logGroupName, logStreamNames) => {
  if (logStreamNames.length === 0) {
    log.setContent('ERROR: No log streams found for this function.');
    return;
  }
  const params = {
    logGroupName,
    interleaved: true,
    logStreamNames,
    limit: 100,
  };
  cloudwatchLogs.filterLogEvents(params, (err, data) => {
    if (err) {
      console.log(err, err.stack);
    } else {
      const { events } = data;
      log.setContent('');
      events.forEach((event) => { log.log(event.message); });
    }
  });
};

const getLogStreams = (logGroupName) => {
  const params = {
    logGroupName,
    descending: true,
    limit: 5,
    orderBy: 'LastEventTime',
  };
  cloudwatchLogs.describeLogStreams(params, (err, data) => {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      getLogEvents(logGroupName, data.logStreams.map((stream) => stream.logStreamName));
    }
  });
};

function generateTable() {
  getLambdasForStackName(process.argv[2], ((lambdaFunctions) => {
    table.setData({ headers: ['logical', 'updated'], data: lambdaFunctions });
    table.rows.on('select', (item) => {
      const funcName = item.content.split('   ')[0];
      getLambdaMetrics(funcName, (metrics) => {
        const durations = metrics.MetricDataResults[0];
        durations.Timestamps = durations.Timestamps.splice(0, 6);
        durations.Values = durations.Values.splice(0, 6);
        bar.setData({
          titles: durations.Timestamps.map((t, i) => i.toString()),
          data: durations.Values.map((t) => Math.round(t)),
        });
        const functionError = {
          title: 'errors',
          style: { line: 'red' },
          x: metrics.MetricDataResults[1].Timestamps,
          y: metrics.MetricDataResults[1].Values,
        };
        const functionInvocations = {
          title: 'invocations',
          style: { line: 'green' },
          x: metrics.MetricDataResults[2].Timestamps,
          y: metrics.MetricDataResults[2].Values,
        };
        invocationsLineGraph.options.maxY = Math.max([functionInvocations.y, functionError.y]);
        invocationsLineGraph.setData([functionError, functionInvocations]);
      });
      getLogStreams(`/aws/lambda/${funcName}`);
    });
  }));
}

const logo = `
 ___  __    ___      ____  ____  _  _     ____  _____  _____  __    ___
/ __)(  )  / __) ___(  _ \\( ___)( \\/ )___(_  _)(  _  )(  _  )(  )  / __)
\\__ \\ )(__ \\__ \\(___))(_) ))__)  \\  /(___) )(   )(_)(  )(_)(  )(__ \\__ \\
(___/(____)(___/    (____/(____)  \\/      (__) (_____)(_____)(____)(___/
`;

const titleBox = grid.set(0, 0, 2, 6, blessed.box, {
  tags: true,
  content: `${logo
  }\n Chrome Dev Tools for the Serverless World.`
    + '\n    - Select a function from the list on the right',
  style: {
    fg: 'green',
    border: {
      fg: 'green',
    },
  },
});


generateTable();
table.focus();

const awsRegionLocations = {
  'us-east-1': { lat: 38.13, lon: -78.45 },
  'us-east-2': { lat: 39.96, lon: -83 },
  'us-west-1': { lat: 37.35, lon: -121.96 },
  'us-west-2': { lat: 46.15, lon: -123.88 },
  'eu-west-1': { lat: 53, lon: -8 },
  'eu-west-2': { lat: 51, lon: -0.1 },
  'eu-west-3': { lat: 48.86, lon: 2.35 },
  'eu-central-1': { lat: 50, lon: 8 },
  'sa-east-1': { lat: -23.34, lon: -46.38 },
  'ap-southeast-1': { lat: 1.37, lon: 103.8 },
  'ap-southeast-2': { lat: -33.86, lon: 151.2 },
  'ap-northeast-1': { lat: 35.41, lon: 139.42 },
  'ap-northeast-2': { lat: 37.56, lon: 126.98 },
  'ap-south-1': { lat: 19.08, lon: 72.88 },
  'ca-central-1': { lat: 45.5, lon: -73.6 },
};

// set map dummy markers
let marker = false;
setInterval(() => {
  if (marker) {
    map.addMarker({
      ...awsRegionLocations[process.argv[3]],
      color: 'red',
      char: 'X',
    });
  } else {
    map.clearMarkers();
    Object.keys(awsRegionLocations).forEach((key) => {
      if (key !== process.argv[3]) {
        map.addMarker({
          ...awsRegionLocations[key],
          color: 'yellow',
          char: 'X',
        });
      }
    });
  }
  marker = !marker;
  screen.render();
}, 1000);

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

// fixes https://github.com/yaronn/blessed-contrib/issues/10
screen.on('resize', () => {
  bar.emit('attach');
  table.emit('attach');
  // errorsLine.emit('attach');
  titleBox.emit('attach');
  invocationsLineGraph.emit('attach');
  map.emit('attach');
  log.emit('attach');
});

screen.title = 'sls-dev-tools';

screen.render();
