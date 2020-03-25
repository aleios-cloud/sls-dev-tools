#!/usr/bin/env node
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
/* eslint-disable new-cap */
import AWS from 'aws-sdk';
import { awsRegionLocations, logo, dateFormats } from './constants';

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const moment = require('moment');
const program = require('commander');
const open = require('open');
const { exec } = require('child_process');
const emoji = require('node-emoji');

program.version('0.1.0');
program
  .requiredOption('-n, --stack-name <stackName>', 'AWS stack name')
  .requiredOption('-r, --region <region>', 'AWS region')
  .option('-t, --start-time <startTime>', 'when to start from')
  .option('-i, --interval <interval>', 'interval of graphs, in seconds')
  .option('-p, --profile <profile>', 'aws profile name to use')
  .option('-l, --location <location>', 'location of your serverless project')
  .option('--sls', 'use the serverless framework to execute commands')
  .parse(process.argv);

const screen = blessed.screen({ smartCSR: true });
const profile = program.profile || 'default';
const location = program.location || process.cwd();
let provider = '';
switch (program) {
  case program.sls:
  default:
    provider = 'serverless';
    break;
}
const credentials = new AWS.SharedIniFileCredentials({ profile });
AWS.config.credentials = credentials;
const cloudformation = new AWS.CloudFormation({
  region: program.region,
});
const cloudwatch = new AWS.CloudWatch({
  region: program.region,
});
const cloudwatchLogs = new AWS.CloudWatchLogs({
  region: program.region,
});

function getLambdasForStackName(stackName) {
  return cloudformation.listStackResources({ StackName: stackName }).promise();
}

let deployingLambdas = [];
class Main {
  constructor() {
    this.deployingLambdas = [];
    this.grid = new contrib.grid({ rows: 12, cols: 12, screen });
    this.bar = this.grid.set(4, 6, 4, 3, contrib.bar, {
      label: 'Lambda Duration (most recent)',
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
    this.log = this.grid.set(8, 0, 4, 12, blessed.log, {
      fg: 'green',
      selectedFg: 'green',
      label: 'Server Log',
      interactive: true,
      scrollbar: { bg: 'blue' },
      mouse: true,
    });
    this.titleBox = this.grid.set(0, 0, 2, 6, blessed.box, {
      tags: true,
      content:
        `${logo}\n Dev Tools for the Serverless World.`
        + '\n    - Select a function from the list on the right',
      style: {
        fg: 'green',
        border: {
          fg: 'green',
        },
      },
    });
    screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
    // fixes https://github.com/yaronn/blessed-contrib/issues/10
    screen.key(['o', 'O'], () => {
      const selectedLambdaFunctionName = this.table.rows.items[
        this.table.rows.selected
      ].data[0];
      return open(
        `https://${program.region}.console.aws.amazon.com/lambda/home?region=${program.region}#/functions/${program.stackName}-${selectedLambdaFunctionName}?tab=configuration`,
      );
    });
    screen.key(['d', 'D'], () => {
      const selectedLambdaFunction = this.table.rows.items[this.table.rows.selected];
      const selectedLambdaFunctionName = selectedLambdaFunction.data[0];
      const listItemDefaultBg = selectedLambdaFunction.style.bg;
      if (provider === 'serverless') {
        selectedLambdaFunction.content = `${emoji.get('coffee')} ${selectedLambdaFunctionName}`;
        selectedLambdaFunction.style.fg = 'blue';
        selectedLambdaFunction.style.bg = 'green';
        this.deployingLambdas.push(selectedLambdaFunctionName);
        exec(
          `serverless deploy -f ${selectedLambdaFunctionName} -r ${program.region} --aws-profile ${profile}`,
          { cwd: location },
          (error, stdout, stderr) => {
            if (error) {
              console.error(`stderr: ${stderr}`);
              console.error(`exec error: ${error}`);
            }
            const indexOfLambdaInDeployingLambdasArray = this.deployingLambdas.indexOf(selectedLambdaFunctionName);
            this.deployingLambdas.splice(indexOfLambdaInDeployingLambdasArray, 1);
            selectedLambdaFunction.style.fg = 'green';
            selectedLambdaFunction.style.bg = listItemDefaultBg;
            selectedLambdaFunction.content = selectedLambdaFunctionName;
          },
        );
      }
    });
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
  }

  async render() {
    await this.table.rows.on('select', (item) => {
      [this.funcName] = item.data;
      this.fullFuncName = `${program.stackName}-${this.funcName}`;
      this.updateGraphs();
    });

    setInterval(() => {
      this.updateMap();
      screen.render();
    }, 1000);

    setInterval(() => {
      this.generateTable();
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

  async generateTable() {
    const newData = await getLambdasForStackName(
      program.stackName,
      this.setData,
    );
    this.data = newData;

    const lambdaFunctions = this.data.StackResourceSummaries.filter(
      (res) => res.ResourceType === 'AWS::Lambda::Function',
    ).map((lam) => [
      lam.PhysicalResourceId.replace(`${program.stackName}-`, ''),
      lam.LastUpdatedTimestamp,
    ]);

    this.table.setData({
      headers: ['logical', 'updated'],
      data: lambdaFunctions,
    });

    for (let i = 0; i < lambdaFunctions.length; i++) {
      this.table.rows.items[i].data = lambdaFunctions[i];
      if (this.deployingLambdas.includes(lambdaFunctions[i][0])){
        this.table.rows.items[i].content = `${emoji.get('coffee')} ${this.table.rows.items[i].content}`;
      };
    }

    if (this.funcName) {
      this.updateGraphs();
    }

    screen.render();
  }

  padInvocationsAndErrorsWithZeros() {
    /* For the invocations and errors data in this.data.MetricDataResults, we will add '0' for each
     * timestamp that doesn't have an entry. This is to make the graph more readable.
     */
    for (let index = 1; index <= 2; index++) {
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
    const durations = this.data.MetricDataResults[0];
    this.bar.setData({
      titles: durations.Timestamps.map((t) => moment(t).format(dateFormats.graphDisplayTime)).slice(-6),
      data: durations.Values.map((t) => Math.round(t)).slice(-6),
    });
  }

  setLineGraphData() {
    const dateFormat = moment(this.data.MetricDataResults[1]).isAfter(
      moment().subtract(3, 'days'),
    )
      ? dateFormats.graphDisplayTime
      : dateFormats.graphDisplayDate;

    const functionError = {
      title: 'errors',
      style: { line: 'red' },
      x: this.data.MetricDataResults[2].Timestamps.map((d) => moment(d).format(dateFormat)),
      y: this.data.MetricDataResults[1].Values,
    };

    const functionInvocations = {
      title: 'invocations',
      style: { line: 'green' },
      x: this.data.MetricDataResults[2].Timestamps.map((d) => {
        const start = moment(d).format(dateFormat);
        const end = moment(d)
          .add(this.interval, 'seconds')
          .format(dateFormat);
        return `${start}-${end}`;
      }),
      y: this.data.MetricDataResults[2].Values,
    };

    this.invocationsLineGraph.options.maxY = Math.max([
      ...functionInvocations.y,
      ...functionError.y,
    ]);
    this.invocationsLineGraph.setData([functionError, functionInvocations]);
  }

  async updateGraphs() {
    const data = await this.getLambdaMetrics(this.fullFuncName);
    this.data = data;

    this.padInvocationsAndErrorsWithZeros();
    this.sortMetricDataResultsByTimestamp();

    this.setBarChartData();
    this.setLineGraphData();

    this.getLogStreams(`/aws/lambda/${this.fullFuncName}`).then(() => {
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
      this.log.setContent('ERROR: No log streams found for this function.');
      return;
    }
    const params = {
      logGroupName,
      interleaved: true,
      logStreamNames,
      limit: 100,
    };
    cloudwatchLogs
      .filterLogEvents(params)
      .promise()
      .then(
        (data) => {
          const { events } = data;
          this.log.setContent('');
          events.forEach((event) => {
            this.log.log(event.message);
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
            Period: this.interval,
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
