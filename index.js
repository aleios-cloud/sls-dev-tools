/* eslint-disable no-plusplus */
/* eslint-disable no-console */
/* eslint-disable new-cap */
import AWS from 'aws-sdk';

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const moment = require('moment');

const screen = blessed.screen({ smartCSR: true });
const cloudformation = new AWS.CloudFormation({ region: process.argv[3] });
const cloudwatch = new AWS.CloudWatch({ region: process.argv[3] });
const cloudwatchLogs = new AWS.CloudWatchLogs({ region: process.argv[3] });

const logo = `
____  __    ____      ____  ____  _  _      ____  __    __   __    ____
/ ___)(  )  / ___) ___(    \\(  __)/ )( \\ ___(_  _)/  \\  /  \\ (  )  / ___)
\\___ \\/ (_/\\\\___ \\(___)) D ( ) _) \\ \\/ /(___) )( (  O )(  O )/ (_/\\\\___ \\
(____/\\____/(____/    (____/(____) \\__/      (__) \\__/  \\__/ \\____/(____/
`;

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLambdasForStackName(stackName) {
  return cloudformation.listStackResources({ StackName: stackName }).promise();
}

function getLambdaMetrics(functionName) {
  const period = process.argv[4] ? '86400' : '300'; // Precision of times that come back from query.
  // const period = 1;
  let startTime;
  if (process.argv[4]) {
    // eslint-disable-next-line prefer-destructuring
    startTime = new Date(process.argv[4]);
  } else {
    startTime = new Date(Math.round(new Date().getTime() / period) * period);
    // Round to closest period to make query faster.
    const dateOffset = (24 * 60 * 60 * 1000 * 2); // 2 day
    startTime.setTime(startTime.getTime() - dateOffset);
  }
  const endTime = new Date();
  const params = {
    StartTime: startTime,
    EndTime: endTime,
    MetricDataQueries: [
      {
        Id: 'duration',
        MetricStat: {
          Metric: {
            Dimensions: [
              {
                Name: 'FunctionName',
                Value: functionName,
              },
              {
                Name: 'Resource',
                Value: functionName,
              },
            ],
            MetricName: 'Duration',
            Namespace: 'AWS/Lambda',
          },
          Period: period,
          Stat: 'Maximum',
        },
        ReturnData: true,
      },
      {
        Id: 'errors',
        MetricStat: {
          Metric: {
            Dimensions: [
              {
                Name: 'FunctionName',
                Value: functionName,
              },
              {
                Name: 'Resource',
                Value: functionName,
              },
            ],
            MetricName: 'Errors',
            Namespace: 'AWS/Lambda',
          },
          Period: period,
          Stat: 'Sum',
        },
        ReturnData: true,
      },
      {
        Id: 'invocations',
        MetricStat: {
          Metric: {
            Dimensions: [
              {
                Name: 'FunctionName',
                Value: functionName,
              },
              {
                Name: 'Resource',
                Value: functionName,
              },
            ],
            MetricName: 'Invocations',
            Namespace: 'AWS/Lambda',
          },
          Period: period,
          Stat: 'Sum',
        },
        ReturnData: true,
      },
    ],
  };

  return cloudwatch.getMetricData(params).promise();
}

class Main {
  constructor() {
    this.grid = new contrib.grid({ rows: 12, cols: 12, screen });
    this.bar = this.grid.set(4, 6, 4, 3, contrib.bar,
      {
        label: 'Lambda Duration (most recent)',
        barWidth: 6,
        barSpacing: 6,
        xOffset: 2,
        maxHeight: 9,
      });
    this.table = this.grid.set(0, 6, 4, 6, contrib.table,
      {
        keys: true,
        fg: 'green',
        label: 'Lambda Functions',
        columnSpacing: 1,
        columnWidth: [44, 60],
      });
    this.invocationsLineGraph = this.grid.set(2, 0, 6, 6, contrib.line,
      {
        maxY: 0,
        label: 'Function Metrics',
        showLegend: true,
        xPadding: 10,
        wholeNumbersOnly: true,
        legend: { width: 50 },
      });
    this.map = this.grid.set(4, 9, 4, 3, contrib.map, { label: `Servers Location (${process.argv[3]})` });
    this.log = this.grid.set(8, 0, 4, 12, blessed.log,
      {
        fg: 'green',
        selectedFg: 'green',
        label: 'Server Log',
        interactive: true,
        scrollbar: { bg: 'blue' },
        mouse: true,
      });
    this.titleBox = this.grid.set(0, 0, 2, 6, blessed.box, {
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
    this.marker = false;
    this.funcName = null;
  }

  async render() {
    screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
    // fixes https://github.com/yaronn/blessed-contrib/issues/10
    screen.on('resize', () => {
      this.bar.emit('attach');
      this.table.emit('attach');
      // errorsLine.emit('attach');
      this.titleBox.emit('attach');
      this.invocationsLineGraph.emit('attach');
      this.map.emit('attach');
      this.log.emit('attach');
    });
    screen.title = 'sls-dev-tools';

    await this.table.rows.on('select', (item) => {
      this.funcName = item.content.split('   ')[0];
      this.refetch();
    });

    while (true) {
      this.generateTable();
      this.table.focus();

      for (let index = 0; index < 2; index++) {
        this.updateMarker();
        screen.render();
        await sleep(1000);
      }
    }
  }

  updateMarker() {
    if (this.marker) {
      this.map.addMarker({
        ...awsRegionLocations[process.argv[3]],
        color: 'red',
        char: 'X',
      });
    } else {
      this.map.clearMarkers();
      Object.keys(awsRegionLocations).forEach((key) => {
        if (key !== process.argv[3]) {
          this.map.addMarker({
            ...awsRegionLocations[key],
            color: 'yellow',
            char: 'X',
          });
        }
      });
    }
    this.marker = !this.marker;
    screen.render();
  }

  async generateTable() {
    const newData = await getLambdasForStackName(process.argv[2], this.setData);
    this.data = newData;

    const lambdaFunctions = this.data.StackResourceSummaries.filter(
      (res) => res.ResourceType === 'AWS::Lambda::Function',
    ).map((lam) => [lam.PhysicalResourceId, lam.LastUpdatedTimestamp]);

    this.table.setData({ headers: ['logical', 'updated'], data: lambdaFunctions });

    if (this.funcName) {
      this.refetch();
    }

    screen.render();
  }

  async refetch() {
    const data = await getLambdaMetrics(this.funcName);
    this.data = data;

    this.data.MetricDataResults = this.sortMetricDataResultsByTimestamp(
      this.data.MetricDataResults,
    );

    const durations = this.data.MetricDataResults[0];
    this.bar.setData({
      titles: durations.Timestamps.map((t) => moment(t).format('HH:mm')),
      data: durations.Values.map((t) => Math.round(t)),
    });

    let dateFormat = 'DDMM';
    if (moment(this.data.MetricDataResults[1]).isAfter(moment().subtract(3, 'days'))) {
      // oldest event within 3days of now.
      dateFormat = 'HH:mm DD';
    }

    const functionError = {
      title: 'errors',
      style: { line: 'red' },
      x: this.data.MetricDataResults[1].Timestamps.map((d) => moment(d).format(dateFormat)),
      y: this.data.MetricDataResults[1].Values,
    };

    const functionInvocations = {
      title: 'invocations',
      style: { line: 'green' },
      x: this.data.MetricDataResults[2].Timestamps.map((d) => moment(d).format(dateFormat)),
      y: this.data.MetricDataResults[2].Values,
    };

    this.invocationsLineGraph.options.maxY = Math.max(
      [...functionInvocations.y, ...functionError.y],
    );
    this.invocationsLineGraph.setData([functionError, functionInvocations]);

    this.getLogStreams(`/aws/lambda/${this.funcName}`).then(() => {
      screen.render();
    });
  }

  getLogStreams(logGroupName) {
    const params = {
      logGroupName,
      descending: true,
      limit: 5,
      orderBy: 'LastEventTime',
    };
    return cloudwatchLogs.describeLogStreams(params, (err, data) => {
      if (err) {
        console.log(err, err.stack); // an error occurred
      } else {
        this.getLogEvents(logGroupName, data.logStreams.map((stream) => stream.logStreamName));
      }
    }).promise();
  }

  getLogEvents(logGroupName, logStreamNames) {
    if (logStreamNames.length === 0) {
      this.log.setContent('ERROR: No log streams found for this function.');
      return;
    }
    const params = {
      logGroupName,
      interleaved: true,
      logStreamNames,
      limit: 100,
    };
    cloudwatchLogs.filterLogEvents(params).promise().then((data) => {
      const { events } = data;
      this.log.setContent('');
      events.forEach((event) => { this.log.log(event.message); });
    }, (err) => {
      console.log(err, err.stack);
    });
  }

  sortMetricDataResultsByTimestamp() {
    return this.data.MetricDataResults.map((datum) => {
      const latest = datum.Timestamps.map((timestamp, index) => (
        { timestamp, value: datum.Values[index] }))
        .sort((first, second) => (moment(first.timestamp) < moment(second.timestamp) ? 1 : -1))
        .splice(0, 6);
      const sorted = latest.reverse();
      const returnData = datum;
      returnData.Timestamps = sorted.map((it) => it.timestamp);
      returnData.Values = sorted.map((it) => it.value);
      return returnData;
    });
  }
}


const main = new Main();

main.render();
