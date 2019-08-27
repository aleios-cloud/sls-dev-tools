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
  const params = {
    EndTime: new Date() || 'Wed Dec 31 1969 16:00:00 GMT-0800 (PST)' || 123456789, /* required */
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
          Stat: 'Sum', /* required */
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
    StartTime: '2019-08-18T17:10:00.000Z',
  };
  cloudwatch.getMetricData(params, (err, data) => {
    if (err) console.log(err, err.stack); // an error occurred
    else cb(data); // successful response
  });
};


// create layout and widgets

const grid = new contrib.grid({ rows: 12, cols: 12, screen });

/**
 * Donut Options
  self.options.radius = options.radius || 14; // how wide is it? over 5 is best
  self.options.arcWidth = options.arcWidth || 4; //width of the donut
  self.options.yPadding = options.yPadding || 2; //padding from the top
 */
const donut = grid.set(8, 8, 4, 2, contrib.donut,
  {
    label: 'Percent Donut',
    radius: 16,
    arcWidth: 4,
    yPadding: 2,
    data: [{ label: 'Storage', percent: 87 }],
  });

const gaugeTwo = grid.set(8, 10, 2, 2, contrib.gauge, { label: 'Deployment Progress', percent: 80 });

const sparkline = grid.set(10, 10, 2, 2, contrib.sparkline,
  {
    label: 'Throughput (bits/sec)',
    tags: true,
    style: { fg: 'blue', titleFg: 'white' },
  });

const bar = grid.set(4, 6, 4, 3, contrib.bar,
  {
    label: 'Server Utilization (%)',
    barWidth: 4,
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


// var errorsLine = grid.set(4, 9, 4, 3, contrib.line,
//   { style:
//     { line: "red"
//     , text: "white"
//     , baseline: "black"}
//   , label: 'Errors Rate'
//   , maxY: 60
//   , showLegend: true })

const invocationsLineGraph = grid.set(2, 0, 6, 6, contrib.line,
  {
    maxY: 0,
    label: 'Function Metrics',
    showLegend: true,
    xPadding: 10,
    legend: { width: 50 },
  });

const map = grid.set(4, 9, 4, 3, contrib.map, { label: 'Servers Location' });

const log = grid.set(8, 0, 4, 8, blessed.log,
  {
    fg: 'green',
    selectedFg: 'green',
    label: 'Server Log',
    interactive: true,
    scrollbar: { bg: 'blue' },
    mouse: true,
  });


// dummy data
const servers = ['US1', 'US2', 'EU1', 'AU1', 'AS1', 'JP1'];


let gaugePercentTwo = 0;
setInterval(() => {
  gaugeTwo.setData(gaugePercentTwo);
  gaugePercentTwo++;
  if (gaugePercentTwo >= 100) gaugePercentTwo = 0;
}, 200);


// set dummy data on bar chart
function fillBar() {
  const arr = [];
  for (let i = 0; i < servers.length; i++) {
    arr.push(Math.round(Math.random() * 10));
  }
  bar.setData({ titles: servers, data: arr });
}
fillBar();
setInterval(fillBar, 2000);

const getLogEvents = (logGroupName, logStreamNames) => {
  if (logStreamNames.length === 0) {
    log.setContent('ERROR: No log streams found for this function.');
    return;
  }
  const params = {
    logGroupName,
    interleaved: true,
    logStreamNames,
    limit: 10,
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
        log.log(JSON.stringify(metrics.MetricDataResults));
        // const functionDuration = {
        //   title: 'duration',
        //   style: { line: 'blue' },
        //   x: metrics.MetricDataResults[0].Timestamps,
        //   y: metrics.MetricDataResults[0].Values,
        // different graph
        // };
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

// set spark dummy data
// eslint-disable-next-line max-len
const spark1 = [1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5, 4, 4, 5, 4, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5];
// eslint-disable-next-line max-len
const spark2 = [4, 4, 5, 4, 1, 5, 1, 2, 5, 2, 1, 5, 4, 4, 5, 4, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5, 1, 2, 5, 2, 1, 5];

function refreshSpark() {
  spark1.shift();
  spark1.push(Math.random() * 5 + 1);
  spark2.shift();
  spark2.push(Math.random() * 5 + 1);
  sparkline.setData(['Server1', 'Server2'], [spark1, spark2]);
}

refreshSpark();
setInterval(refreshSpark, 1000);


// set map dummy markers
let marker = true;
setInterval(() => {
  if (marker) {
    map.addMarker({
      lon: '-79.0000', lat: '37.5000', color: 'yellow', char: 'X',
    });
    map.addMarker({ lon: '-122.6819', lat: '45.5200' });
    map.addMarker({ lon: '-6.2597', lat: '53.3478' });
    map.addMarker({ lon: '103.8000', lat: '1.3000' });
  } else {
    map.clearMarkers();
  }
  marker = !marker;
  screen.render();
}, 1000);

// set line charts dummy data

let pct = 0.00;

function updateDonut() {
  if (pct > 0.99) pct = 0.00;
  let color = 'green';
  if (pct >= 0.25) color = 'cyan';
  if (pct >= 0.5) color = 'yellow';
  if (pct >= 0.75) color = 'red';
  donut.setData([
    { percent: parseFloat((pct + 0.00) % 1).toFixed(2), label: 'storage', color },
  ]);
  pct += 0.01;
}

setInterval(() => {
  updateDonut();
  screen.render();
}, 500);


screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

// fixes https://github.com/yaronn/blessed-contrib/issues/10
screen.on('resize', () => {
  donut.emit('attach');
  gaugeTwo.emit('attach');
  sparkline.emit('attach');
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
