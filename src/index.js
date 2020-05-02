#!/usr/bin/env node
import AWS from "aws-sdk";
import { logo, dateFormats, DASHBOARD_FOCUS_INDEX } from "./constants";
import {
  eventRegistryModal,
  eventInjectionModal,
  helpModal,
  regionWizardModal,
  stackWizardModal,
} from "./modals";

import { Map } from "./components";
import { ResourceTable } from "./components/resourceTable";
import Serverless from "./services/serverless";
import { DurationBarChart } from "./components/durationBarChart";
import { getLambdaMetrics } from "./services/lambdaMetrics";
import {
  updateLogContentsFromEvents,
  checkLogsForErrors,
} from "./services/processEventLogs";
import { getLogEvents } from "./services/awsCloudwatchLogs";
import { regionWizardModal } from "./modals/regionWizardModal";
import { stackWizardModal } from "./modals/stackWizardModal";
import { promptMfaModal } from "./modals/promptMfaModal";

import updateNotifier from "./utils/updateNotifier";

const blessed = require("blessed");
const contrib = require("blessed-contrib");
const moment = require("moment");
const program = require("commander");
const open = require("open");
const packageJson = require("../package.json");

let slsDevToolsConfig;
try {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  slsDevToolsConfig = require(`${process.cwd()}/slsdevtools.config.js`);
} catch (e) {
  // No config provided
}

updateNotifier();

program.version(packageJson.version);
program
  .option("-n, --stack-name <stackName>", "AWS stack name")
  .option("-r, --region <region>", "AWS region")
  .option(
    "-t, --start-time <startTime>",
    "when to start from, date string with form '30 March 2020 09:00 GMT'"
  )
  .option("-i, --interval <interval>", "interval of graphs, in seconds")
  .option("-p, --profile <profile>", "aws profile name to use")
  .option("-l, --location <location>", "location of your serverless project")
  .option("-s, --stage <stage>", "If sls option is set, use this stage")
  .option("--sls", "use the serverless framework to execute commands")
  .option("--sam", "use the SAM framework to execute commands")
  .parse(process.argv);

function getMfaToken(serial, callback) { 
  promptMfaModal(callback, screen);
}


function getAWSCredentials() {
  if (program.profile) {
    process.env.AWS_SDK_LOAD_CONFIG = 1;
    return new AWS.SharedIniFileCredentials({ 
      profile: program.profile,
      tokenCodeFn: getMfaToken,
      callback: (err) => {
        if (err) {
          console.error(`SharedIniFileCreds Error: ${err}`)
        }
      }
    });
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
      tokenCodeFn: getMfaToken,
      callback: (err) => {
        if (err) {
          console.error(`SharedIniFileCreds Error: ${err}`)
        }
      }
    });
  }
  return new AWS.SharedIniFileCredentials({ profile: "default" });
}

const screen = blessed.screen({ smartCSR: true });
screen.key(["q", "C-c"], () => process.exit(0));
const profile = program.profile || "default";
const location = program.location || process.cwd();
let provider = "";
if (program.sam) {
  provider = "SAM";
} else {
  provider = "serverlessFramework";
  const SLS = new Serverless(location);
  if (!program.stage) {
    program.stage = SLS.getStage();
  }
  if (!program.stackName) {
    program.stackName = SLS.getStackName(program.stage);
  }
  if (!program.region) {
    program.region = SLS.getRegion();
  }
}

let cloudformation;
let cloudwatch;
let cloudwatchLogs;
let eventBridge;
let schemas;
let lambda;

function updateAWSServices() {
  cloudformation = new AWS.CloudFormation();
  cloudwatch = new AWS.CloudWatch();
  cloudwatchLogs = new AWS.CloudWatchLogs();
  eventBridge = new AWS.EventBridge();
  schemas = new AWS.Schemas();
  lambda = new AWS.Lambda();
}

if (program.region) {
  AWS.config.region = program.region;
  updateAWSServices();
}

function getEventBuses() {
  return eventBridge
    .listEventBuses()
    .promise()
    .catch((error) => {
      console.error(error);
    });
}

function injectEvent(event) {
  const params = { Entries: [] };
  params.Entries.push(event);
  eventBridge.putEvents(params, (err, data) => {
    if (err) console.error(err, err.stack);
    // an error occurred
    else console.log(data); // successful response
  });
}

class Main {
  constructor() {
    this.focusIndex = 0;
    // eslint-disable-next-line new-cap
    this.layoutGrid = new contrib.grid({ rows: 12, cols: 12, screen });
    this.durationBarChart = new DurationBarChart(this, cloudwatchLogs, true);
    this.resourceTable = new ResourceTable(
      this,
      screen,
      program,
      provider,
      slsDevToolsConfig,
      profile,
      location,
      cloudformation,
      lambda,
      cloudwatch,
      cloudwatchLogs
    );
    this.invocationsLineGraph = this.layoutGrid.set(2, 0, 6, 6, contrib.line, {
      maxY: 0,
      label: "Function Metrics",
      showLegend: true,
      xPadding: 10,
      xLabelPadding: 10,
      wholeNumbersOnly: true,
      legend: { width: 50 },
    });
    this.map = new Map(this.layoutGrid, program, Main.updateRegion);
    this.eventBridgeTree = this.layoutGrid.set(8, 9, 4, 3, contrib.tree, {
      label: "Event Bridges",
      style: {
        fg: "green",
      },
      template: {
        lines: true,
      },
    });
    this.eventBridgeTree.rows.interactive = false;
    this.lambdaLog = this.layoutGrid.set(8, 0, 4, 6, blessed.log, {
      fg: "green",
      selectedFg: "green",
      label: "Server Log",
      interactive: true,
      scrollbar: { bg: "blue" },
      mouse: true,
    });
    this.consoleLogs = this.layoutGrid.set(8, 6, 4, 3, blessed.log, {
      fg: "green",
      selectedFg: "dark-green",
      label: "Dashboard Logs",
      interactive: true,
      scrollbar: { bg: "blue" },
      mouse: true,
    });
    this.titleBox = this.layoutGrid.set(0, 0, 2, 6, blessed.box, {
      tags: true,
      content:
        `${logo}\n Dev Tools for the Serverless World.` +
        "    Press `h` for help",
      style: {
        fg: "green",
        border: {
          fg: "green",
        },
      },
    });
    this.setKeypresses();
    screen.on("resize", () => {
      this.durationBarChart.chart("attach");
      this.resourceTable.table.emit("attach");
      // errorsLine.emit('attach');
      this.titleBox.emit("attach");
      this.invocationsLineGraph.emit("attach");
      this.map.map = this.map.generateMap();
      this.lambdaLog.emit("attach");
      this.consoleLogs.emit("attach");
    });
    screen.title = "sls-dev-tools";
    this.interval = program.interval || 3600; // 1 hour
    this.endTime = new Date();
    if (program.startTime) {
      // eslint-disable-next-line prefer-destructuring
      this.startTime = new Date(program.startTime);
    } else {
      const dateOffset = 24 * 60 * 60 * 1000; // 1 day
      // Round to closest interval to make query faster.
      this.startTime = new Date(
        Math.round(new Date().getTime() / this.interval) * this.interval -
          dateOffset
      );
    }

    global.console = {
      log: (m) => this.consoleLogs.log(m),
      error: (m) => this.consoleLogs.log(m),
    };

    // Curent element of focusList in focus
    this.focusList = [
      this.resourceTable.table,
      this.eventBridgeTree,
      this.map.map,
    ];
    this.resourceTable.table.focus();
    this.returnFocus();
    this.isModalOpen = false;

    // Dictionary to store previous submissions for each event bus
    this.previousSubmittedEvent = {};
    // Dictionary to store previous submissions for each lambda function
    this.previousLambdaPayload = {};

    // Store previous errorId found in logs, with region and fullFunc name
    this.prevError = {};
    // Store events from cloudwatchLogs
    this.events = [];
    // Allows use of .bell() function for notifications
    this.notifier = new blessed.Program();
  }

  setKeypresses() {
    screen.key(["h"], () => {
      if (this.isModalOpen === false) {
        this.isModalOpen = true;
        return helpModal(screen, this);
      }
      return 0;
    });
    screen.key(["tab"], () => {
      if (this.isModalOpen === false) {
        return this.changeFocus();
      }
      return 0;
    });
    // fixes https://github.com/yaronn/blessed-contrib/issues/10
    screen.key(["o"], () => {
      // If focus is currently on this.eventBridgeTree
      if (
        this.focusIndex === DASHBOARD_FOCUS_INDEX.EVENT_BRIDGE_TREE &&
        this.isModalOpen === false
      ) {
        const selectedRow = this.eventBridgeTree.rows.selected;
        // take substring to remove leading characters displayed in tree
        const selectedEventBridge = this.eventBridgeTree.rows.ritems[
          selectedRow
        ].substring(2);
        return open(
          `https://${program.region}.console.aws.amazon.com/events/home?region=${program.region}#/eventbus/${selectedEventBridge}`
        );
      }
      return 0;
    });
    screen.key(["i"], () => {
      // If focus is currently on this.eventBridgeTree
      if (
        this.focusIndex === DASHBOARD_FOCUS_INDEX.EVENT_BRIDGE_TREE &&
        this.isModalOpen === false
      ) {
        this.isModalOpen = true;
        const selectedRow = this.eventBridgeTree.rows.selected;
        // take substring to remove leading characters displayed in tree
        const selectedEventBridge = this.eventBridgeTree.rows.ritems[
          selectedRow
        ].substring(2);
        const previousEvent = this.previousSubmittedEvent[selectedEventBridge];
        return eventInjectionModal(
          screen,
          selectedEventBridge,
          this,
          injectEvent,
          previousEvent,
          schemas
        );
      }
      return 0;
    });

    screen.key(["r"], () => {
      // If focus is currently on this.eventBridgeTree
      if (
        this.focusIndex === DASHBOARD_FOCUS_INDEX.EVENT_BRIDGE_TREE &&
        this.isModalOpen === false
      ) {
        this.isModalOpen = true;
        const selectedRow = this.eventBridgeTree.rows.selected;
        // take substring to remove leading characters displayed in tree
        const selectedEventBridge = this.eventBridgeTree.rows.ritems[
          selectedRow
        ].substring(2);
        return eventRegistryModal(
          screen,
          selectedEventBridge,
          this,
          schemas,
          injectEvent
        );
      }
      return 0;
    });
  }

  setIsModalOpen(value) {
    this.isModalOpen = value;
  }

  setFirstLogsRetrieved(value) {
    this.firstLogsRetrieved = value;
  }

  setPrevError(value) {
    this.prevError = value;
  }

  async render() {
    setInterval(() => {
      this.map.updateMap();
      this.updateResourcesInformation();
      this.updateGraphs();
      screen.render();
    }, 1000);
  }

  async updateGraphs() {
    if (this.resourceTable.fullFuncName) {
      this.data = await getLambdaMetrics(
        this,
        this.resourceTable.fullFuncName,
        cloudwatch
      );
      getLogEvents(
        `/aws/lambda/${this.resourceTable.fullFuncName}`,
        cloudwatchLogs
      ).then((data) => {
        this.events = data;
        updateLogContentsFromEvents(this.lambdaLog, this.events);
        if (data) {
          checkLogsForErrors(this.events, this);
          this.setFirstLogsRetrieved(true);

          this.durationBarChart.updateData();
        }
      });
    }

    this.padInvocationsAndErrorsWithZeros();
    this.sortMetricDataResultsByTimestamp();
    this.setLineGraphData();
  }

  async updateResourcesInformation() {
    this.resourceTable.updateData();
    const eventBridgeResources = await getEventBuses();
    if (eventBridgeResources) {
      const busNames = eventBridgeResources.EventBuses.map(
        (o) => o.Name
      ).reduce((eventBridges, bus) => {
        eventBridges[bus] = {};
        return eventBridges;
      }, {});

      this.eventBridgeTree.setData({
        extended: true,
        children: busNames,
      });
    }
  }

  changeFocus() {
    if (this.focusList[this.focusIndex].rows) {
      this.focusList[this.focusIndex].rows.interactive = false;
    }
    this.focusList[this.focusIndex].style.border.fg = "cyan";
    this.focusIndex = (this.focusIndex + 1) % this.focusList.length;
    if (this.focusList[this.focusIndex].rows) {
      this.focusList[this.focusIndex].rows.interactive = true;
    }
    this.focusList[this.focusIndex].style.border.fg = "yellow";
    this.returnFocus();
  }

  returnFocus() {
    this.focusList[this.focusIndex].focus();
  }

  padInvocationsAndErrorsWithZeros() {
    /* For the invocations and errors data in this.data.MetricDataResults, we will add '0' for each
     * timestamp that doesn't have an entry. This is to make the graph more readable.
     */
    if (this.data && this.data.MetricDataResults) {
      for (let index = 0; index <= 1; index++) {
        for (
          let timestamp = moment(this.startTime).valueOf();
          timestamp < moment(this.endTime).valueOf();
          timestamp = moment(timestamp).add(this.interval, "seconds").valueOf()
        ) {
          if (
            this.data.MetricDataResults[index].Timestamps.every(
              (it) => it.valueOf() !== timestamp
            )
          ) {
            this.data.MetricDataResults[index].Timestamps.push(
              new Date(timestamp)
            );
            this.data.MetricDataResults[index].Values.push(0);
          }
        }
      }
    }
  }

  setLineGraphData() {
    if (this.data && this.data.MetricDataResults) {
      const dateFormat = moment(this.data.MetricDataResults[0]).isAfter(
        moment().subtract(3, "days")
      )
        ? dateFormats.graphDisplayTime
        : dateFormats.graphDisplayDate;

      const functionError = {
        title: "errors",
        style: { line: "red" },
        x: this.data.MetricDataResults[1].Timestamps.map((d) =>
          moment(d).format(dateFormat)
        ),
        y: this.data.MetricDataResults[0].Values,
      };

      const functionInvocations = {
        title: "invocations",
        style: { line: "green" },
        x: this.data.MetricDataResults[1].Timestamps.map((d) => {
          const start = moment(d).format(dateFormat);
          const end = moment(d)
            .add(this.interval, "seconds")
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
  }

  sortMetricDataResultsByTimestamp() {
    if (this.data && this.data.MetricDataResults) {
      this.data.MetricDataResults = this.data.MetricDataResults.map((datum) => {
        const latest = datum.Timestamps.map((timestamp, index) => ({
          timestamp: moment(timestamp),
          value: datum.Values[index],
        })).sort((first, second) =>
          moment(first.timestamp) > moment(second.timestamp) ? 1 : -1
        );
        const returnData = datum;
        returnData.Timestamps = latest.map((it) => it.timestamp);
        returnData.Values = latest.map((it) => it.value);
        return returnData;
      });
    }
  }

  static updateRegion(region) {
    program.region = region;
    AWS.config.region = region;
    updateAWSServices();
  }
}

function promptStackName() {
  const stackTable = stackWizardModal(screen, program, cloudformation);
  stackTable.key(["enter"], () => {
    program.stackName = stackTable.ritems[stackTable.selected];
    new Main().render();
  });
}

function promptRegion() {
  const regionTable = regionWizardModal(screen, program);
  regionTable.key(["enter"], () => {
    program.region = regionTable.ritems[regionTable.selected];
    AWS.config.region = program.region;
    updateAWSServices();
    if (!program.stackName) {
      promptStackName();
    } else {
      new Main().render();
    }
  });
}

async function getAwsCreds() {
  
  const creds = getAWSCredentials();

  (async () => {
    await creds.getPromise().then( () =>  {
      AWS.config.credentials = creds;
      updateAWSServices();

      if (!program.region) {
        promptRegion();
      } else if (!program.stackName) {
        promptStackName();
      } else {
        new Main().render();
      }
    }).catch( (error) => {
      console.log(JSON.stringify(creds), 'error:', error);
    });
  })();
}

async function startTool() {
  await getAwsCreds();
}

startTool();
exports.slsDevTools = () => startTool();
