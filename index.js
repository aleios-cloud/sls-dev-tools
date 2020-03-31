#!/usr/bin/env node
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
/* eslint-disable new-cap */
import AWS from 'aws-sdk';
import { awsRegionLocations, logo, dateFormats } from './constants';
import { helpModal } from './modals';

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const moment = require('moment');
const program = require('commander');
const open = require('open');

program.version('0.1.3');
program
  .option('-n, --stack-name <stackName>', 'AWS stack name')
  .option('-r, --region <region>', 'AWS region')
  .option('-t, --start-time <startTime>', 'when to start from')
  .option('-i, --interval <interval>', 'interval of graphs, in seconds')
  .option('-p, --profile <profile>', 'aws profile name to use')
  .parse(process.argv);

function getAWSCredentials() {
  if (program.profile) {
    return new AWS.SharedIniFileCredentials({ profile: program.profile });
  }
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return new AWS.Credentials({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    });
  }
  if (process.env.AWS_PROFILE) {
    return new AWS.SharedIniFileCredentials({
      profile: process.env.AWS_PROFILE,
    });
  }
  return new AWS.SharedIniFileCredentials({ profile: 'default' });
}

const screen = blessed.screen({ smartCSR: true });
AWS.config.credentials = getAWSCredentials();
AWS.config.region = program.region;
const cloudformation = new AWS.CloudFormation();
const cloudwatch = new AWS.CloudWatch();
const cloudwatchLogs = new AWS.CloudWatchLogs();

function getStackResources(stackName) {
  return cloudformation.listStackResources({ StackName: stackName }).promise();
}

class Main {
  constructor() {
    this.grid = new contrib.grid({ rows: 12, cols: 12, screen });
    this.bar = this.grid.set(4, 6, 4, 3, contrib.bar, {
      label: 'Lambda Duration (ms) (most recent)',
      barWidth: 6,
      barSpacing: 6,
      xOffset: 2,
      maxHeight: 9,
    });
    this.table = this.grid.set(0, 6, 4, 6, contrib.table, {
      keys: true,
      fg: 'green',
      label: 'Lambda Functions',
      columnSpacing: 1,
      columnWidth: [44, 60],
    });
    this.invocationsLineGraph = this.grid.set(2, 0, 6, 6, contrib.line, {
      maxY: 0,
      label: 'Function Metrics',
      showLegend: true,
      xPadding: 10,
      xLabelPadding: 10,
      wholeNumbersOnly: true,
      legend: { width: 50 },
    });
    this.map = this.grid.set(4, 9, 4, 3, contrib.map, {
      label: `Servers Location (${program.region})`,
    });
    this.eventBridgeTree = this.grid.set(8, 9, 4, 3, contrib.tree, {
      label: 'Event Bridges',
      style: {
        fg: 'green',
      },
      template: {
        lines: true,
      },
    });
    this.eventBridgeTree.rows.interactive = false;
    this.lambdaLog = this.grid.set(8, 0, 4, 6, blessed.log, {
      fg: 'green',
      selectedFg: 'green',
      label: 'Server Log',
      interactive: true,
      scrollbar: { bg: 'blue' },
      mouse: true,
    });
    this.consoleLogs = this.grid.set(8, 6, 4, 3, blessed.log, {
      fg: 'red',
      selectedFg: 'dark-red',
      label: 'Dashboard Logs',
      interactive: true,
      scrollbar: { bg: 'red' },
      mouse: true,
    });
    this.titleBox = this.grid.set(0, 0, 2, 6, blessed.box, {
      tags: true,
      content:
        `${logo}\n Dev Tools for the Serverless World.`
        + '    Press `h` for help',
      style: {
        fg: 'green',
        border: {
          fg: 'green',
        },
      },
    });
    screen.key(['q', 'C-c'], () => process.exit(0));
    // fixes https://github.com/yaronn/blessed-contrib/issues/10
    screen.key(['o', 'O'], () => {
      const selectedLambdaFunctionName = this.table.rows.items[
        this.table.rows.selected
      ].data[0];
      return open(
        `https://${program.region}.console.aws.amazon.com/lambda/home?region=${program.region}#/functions/${selectedLambdaFunctionName}?tab=configuration`,
      );
    });
    screen.key(['h', 'H'], () => helpModal(screen, blessed));
    screen.on('resize', () => {
      this.bar.emit('attach');
      this.table.emit('attach');
      // errorsLine.emit('attach');
      this.titleBox.emit('attach');
      this.invocationsLineGraph.emit('attach');
      this.map.emit('attach');
      this.lambdaLog.emit('attach');
      this.consoleLogs.emit('attach');
    });
    screen.title = 'sls-dev-tools';
    this.marker = false;

    this.funcName = null;

    this.interval = program.interval || 3600; // 1 hour
    this.endTime = new Date();
    if (program.startTime) {
      // eslint-disable-next-line prefer-destructuring
      this.startTime = new Date(program.startTime);
    } else {
      const dateOffset = 24 * 60 * 60 * 1000; // 1 day

      // Round to closest interval to make query faster.
      this.startTime = new Date(
        Math.round(new Date().getTime() / this.interval) * this.interval
          - dateOffset,
      );
    }

    global.console = {
      log: (m) => this.consoleLogs.log(m),
      error: (m) => this.consoleLogs.log(m),
    };
  }

  async render() {
    await this.table.rows.on('select', (item) => {
      [this.funcName] = item.data;
      this.updateGraphs();
    });

    setInterval(() => {
      this.updateMap();
      screen.render();
    }, 1000);

    setInterval(() => {
      this.updateResourcesInformation();
      this.table.focus();
    }, 3000);
  }

  updateMap() {
    if (this.marker) {
      this.map.addMarker({
        ...awsRegionLocations[program.region],
        color: 'red',
        char: 'X',
      });
    } else {
      this.map.clearMarkers();
      Object.keys(awsRegionLocations).forEach((key) => {
        if (key !== program.region) {
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

  async updateResourcesInformation() {
    const newData = await getStackResources(
      program.stackName,
      this.setData,
    );
    this.data = newData;

    const lambdaFunctions = this.data.StackResourceSummaries.filter(
      (res) => res.ResourceType === 'AWS::Lambda::Function',
    ).map((lam) => [lam.PhysicalResourceId, lam.LastUpdatedTimestamp]);

    this.table.setData({
      headers: ['logical', 'updated'],
      data: lambdaFunctions,
    });

    for (let i = 0; i < lambdaFunctions.length; i++) {
      this.table.rows.items[i].data = lambdaFunctions[i];
    }

    const eventBridgeResources = this.data.StackResourceSummaries.filter(
      (res) => res.ResourceType === 'Custom::EventBridge',
    ).reduce((eventBridges, eventBridge) => {
      eventBridges[eventBridge.PhysicalResourceId] = {};
      return eventBridges;
    }, {});

    this.eventBridgeTree.setData({ extended: true, children: eventBridgeResources });

    if (this.funcName) {
      this.updateGraphs();
    }

    screen.render();
  }

  padInvocationsAndErrorsWithZeros() {
    /* For the invocations and errors data in this.data.MetricDataResults, we will add '0' for each
     * timestamp that doesn't have an entry. This is to make the graph more readable.
     */
    for (let index = 0; index <= 1; index++) {
      for (
        let timestamp = moment(this.startTime).valueOf();
        timestamp < moment(this.endTime).valueOf();
        timestamp = moment(timestamp)
          .add(this.interval, 'seconds')
          .valueOf()
      ) {
        if (
          this.data.MetricDataResults[index].Timestamps.every(
            (it) => it.valueOf() !== timestamp,
          )
        ) {
          this.data.MetricDataResults[index].Timestamps.push(
            new Date(timestamp),
          );
          this.data.MetricDataResults[index].Values.push(0);
        }
      }
    }
  }

  setBarChartData() {
    const regex = /RequestId:(\s)*(\w|-)*(\s)*Duration:(\s)*(\d|\.)*(\s)*ms/gm;
    // Extract reports from the server logs
    const matches = this.lambdaLog.content.match(regex);
    const splits = [];
    if (matches !== null) {
      for (let i = 0; i < matches.length; i++) {
        // Split report into fields using tabs (or 4 spaces)
        splits.push(matches[i].split(/\t|\s\s\s\s/));
      }
      this.bar.setData({
        titles: ['1', '2', '3', '4', '5'],
        // Extract numerical value from field by splitting on spaces, and taking second value
        data: splits.map((s) => s[1].split(' ')[1]).slice(-5),
      });
    }
  }

  setLineGraphData() {
    const dateFormat = moment(this.data.MetricDataResults[0]).isAfter(
      moment().subtract(3, 'days'),
    )
      ? dateFormats.graphDisplayTime
      : dateFormats.graphDisplayDate;

    const functionError = {
      title: 'errors',
      style: { line: 'red' },
      x: this.data.MetricDataResults[1].Timestamps.map((d) => moment(d).format(dateFormat)),
      y: this.data.MetricDataResults[0].Values,
    };

    const functionInvocations = {
      title: 'invocations',
      style: { line: 'green' },
      x: this.data.MetricDataResults[1].Timestamps.map((d) => {
        const start = moment(d).format(dateFormat);
        const end = moment(d)
          .add(this.interval, 'seconds')
          .format(dateFormat);
        return `${start}-${end}`;
      }),
      y: this.data.MetricDataResults[1].Values,
    };

    this.invocationsLineGraph.options.maxY = Math.max([
      ...functionInvocations.y,
      ...functionError.y,
    ]);
    this.invocationsLineGraph.setData([functionError, functionInvocations]);
  }

  async updateGraphs() {
    const data = await this.getLambdaMetrics(this.funcName);
    this.data = data;

    this.padInvocationsAndErrorsWithZeros();
    this.sortMetricDataResultsByTimestamp();

    this.getLogStreams(`/aws/lambda/${this.funcName}`).then(() => {
      screen.render();
    });

    this.setBarChartData();
    this.setLineGraphData();
  }

  getLogStreams(logGroupName) {
    const params = {
      logGroupName,
      descending: true,
      limit: 5,
      orderBy: 'LastEventTime',
    };
    return cloudwatchLogs
      .describeLogStreams(params, (err, data) => {
        if (err) {
          console.log(err, err.stack); // an error occurred
        } else {
          this.getLogEvents(
            logGroupName,
            data.logStreams.map((stream) => stream.logStreamName),
          );
        }
      })
      .promise();
  }

  getLogEvents(logGroupName, logStreamNames) {
    if (logStreamNames.length === 0) {
      this.lambdaLog.setContent('ERROR: No log streams found for this function.');
      return;
    }
    const params = {
      logGroupName,
      logStreamNames,
    };
    cloudwatchLogs
      .filterLogEvents(params)
      .promise()
      .then(
        (data) => {
          const { events } = data;
          this.lambdaLog.setContent('');
          events.forEach((event) => {
            this.lambdaLog.log(event.message);
          });
        },
        (err) => {
          console.log(err, err.stack);
        },
      );
  }

  sortMetricDataResultsByTimestamp() {
    this.data.MetricDataResults = this.data.MetricDataResults.map((datum) => {
      const latest = datum.Timestamps.map((timestamp, index) => ({
        timestamp: moment(timestamp),
        value: datum.Values[index],
      })).sort((first, second) => (moment(first.timestamp) > moment(second.timestamp) ? 1 : -1));
      const returnData = datum;
      returnData.Timestamps = latest.map((it) => it.timestamp);
      returnData.Values = latest.map((it) => it.value);
      return returnData;
    });
  }

  getLambdaMetrics(functionName) {
    this.endTime = new Date();
    const params = {
      StartTime: this.startTime,
      EndTime: this.endTime,
      MetricDataQueries: [
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
            Period: this.interval,
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
            Period: this.interval,
            Stat: 'Sum',
          },
          ReturnData: true,
        },
      ],
    };

    return cloudwatch.getMetricData(params).promise();
  }
}

new Main().render();
exports.slsDevTools = () => new Main().render();
