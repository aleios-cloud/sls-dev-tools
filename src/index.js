#!/usr/bin/env node
import AWS from "aws-sdk";
import { logo, dateFormats, DEPLOYMENT_STATUS } from "./constants";
import { helpModal } from "./modals/helpModal";
import { eventRegistryModal } from "./modals/eventRegistryModal";
import { eventInjectionModal } from "./modals/eventInjectionModal";
import { lambdaInvokeModal } from "./modals/lambdaInvokeModal";
import { Map } from "./components";
import Serverless from "./services/serverless";
import { DurationBarChart } from "./components/durationBarChart";
import { lambdaStatisticsModal } from "./modals/lambdaStatisticsModal";
import { getLambdaMetrics } from "./services/lambdaMetrics";
import {
  updateLogContentsFromEvents,
  checkLogsForErrors,
} from "./services/processEventLogs";
import { getLogEvents } from "./services/awsCloudwatchLogs";
import { clargsWizardModal } from "./modals/clargsWizardModal";

const blessed = require("blessed");
const contrib = require("blessed-contrib");
const moment = require("moment");
const program = require("commander");
const open = require("open");
const { exec } = require("child_process");
const emoji = require("node-emoji");
const packageJson = require("../package.json");

let slsDevToolsConfig;
try {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  slsDevToolsConfig = require(`${process.cwd()}/slsdevtools.config.js`);
} catch (e) {
  // No config provided
}

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
  .option("-s, --stage <stage>", "If sls option is set, use this stage", "dev")
  .option("--sls", "use the serverless framework to execute commands")
  .option("--sam", "use the SAM framework to execute commands")
  .parse(process.argv);

function getAWSCredentials() {
  if (program.profile) {
    process.env.AWS_SDK_LOAD_CONFIG = 1;
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
  return new AWS.SharedIniFileCredentials({ profile: "default" });
}

const screen = blessed.screen({ smartCSR: true });
const profile = program.profile || "default";
const location = program.location || process.cwd();
let provider = "";
if (program.sam) {
  provider = "SAM";
} else {
  provider = "serverlessFramework";
  const SLS = new Serverless(location);
  if (!program.stackName) {
    program.stackName = SLS.getStackName(program.stage);
  }

  if (!program.region) {
    program.region = SLS.getRegion();
  }
}

if (!program.stackName) {
  console.error(
    "error: required option '-n, --stack-name <stackName>' not specified"
  );
  process.exit(1);
}

AWS.config.credentials = getAWSCredentials();

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

function getStackResources(stackName) {
  return cloudformation.listStackResources({ StackName: stackName }).promise();
}

let lambdaFunctions = {};
let latestLambdaFunctionsUpdateTimestamp = -1;

async function refreshLambdaFunctions() {
  const allFunctions = [];
  let marker;
  while (true) {
    const response = await lambda
      .listFunctions({
        Marker: marker,
        MaxItems: 50,
      })
      .promise();
    const functions = response.Functions;
    allFunctions.push(...functions);
    if (!response.NextMarker) {
      break;
    }
    marker = response.NextMarker;
  }
  lambdaFunctions = allFunctions.reduce(function (map, func) {
    map[func.FunctionName] = func;
    return map;
  }, {});
}

function getEventBuses() {
  return eventBridge.listEventBuses().promise();
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
    this.lambdasDeploymentStatus = {};
    this.layoutGrid = new contrib.grid({ rows: 12, cols: 12, screen });
    this.durationBarChart = new DurationBarChart(this, cloudwatchLogs, true);
    this.lambdasTable = this.layoutGrid.set(0, 6, 4, 6, contrib.table, {
      keys: true,
      fg: "green",
      label: "Lambda Functions",
      columnSpacing: 1,
      columnWidth: [45, 30, 15],
      style: {
        border: {
          fg: "yellow",
        },
      },
    });
    this.invocationsLineGraph = this.layoutGrid.set(2, 0, 6, 6, contrib.line, {
      maxY: 0,
      label: "Function Metrics",
      showLegend: true,
      xPadding: 10,
      xLabelPadding: 10,
      wholeNumbersOnly: true,
      legend: { width: 50 },
    });
    this.map = new Map(this.layoutGrid, program, this.updateRegion);
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
      this.lambdasTable.emit("attach");
      // errorsLine.emit('attach');
      this.titleBox.emit("attach");
      this.invocationsLineGraph.emit("attach");
      this.map.map = this.map.generateMap();
      this.lambdaLog.emit("attach");
      this.consoleLogs.emit("attach");
    });
    screen.title = "sls-dev-tools";
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
        Math.round(new Date().getTime() / this.interval) * this.interval -
          dateOffset
      );
    }

    global.console = {
      log: (m) => this.consoleLogs.log(m),
      error: (m) => this.consoleLogs.log(m),
    };

    // Curent element of focusList in focus
    this.focusList = [this.lambdasTable, this.eventBridgeTree, this.map.map];
    this.returnFocus();
    this.isModalOpen = false;

    // Dictionary to store previous submissions for each event bus
    this.previousSubmittedEvent = {};
    // Dictionary to store previous submissions for each lambda function
    this.previousLambdaPayload = {};
    this.lambdasTable.rows.on("select", (item) => {
      [this.funcName] = item.data;
      this.fullFuncName = `${program.stackName}-${this.funcName}`;
      this.setFirstLogsRetrieved(false);
    });
    // Store previous errorId found in logs
    this.prevErrorId = "";
    // Flag to avoid getting notifications on first retrieval of logs
    this.firstLogsRetrieved = false;
    // Store events from cloudwatchLogs
    this.events = [];
    // Allows use of .bell() function for notifications
    this.notifier = new blessed.Program();
  }

  setKeypresses() {
    screen.key(["d"], () => {
      // If focus is currently on this.lambdasTable
      if (this.focusIndex === 0 && this.isModalOpen === false) {
        return this.deployFunction();
      }
      return 0;
    });
    screen.key(["s"], () => {
      if (this.isModalOpen === false) {
        return this.deployStack();
      }
      return 0;
    });
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
    screen.key(["q", "C-c"], () => process.exit(0));
    // fixes https://github.com/yaronn/blessed-contrib/issues/10
    screen.key(["o"], () => {
      // If focus is currently on this.lambdasTable
      if (this.focusIndex === 0 && this.isModalOpen === false) {
        const selectedLambdaFunctionName = this.lambdasTable.rows.items[
          this.lambdasTable.rows.selected
        ].data[0];
        return open(
          `https://${program.region}.console.aws.amazon.com/lambda/home?region=${program.region}#/functions/${program.stackName}-${selectedLambdaFunctionName}?tab=configuration`
        );
      }
      // If focus is currently on this.eventBridgeTree
      if (this.focusIndex === 1 && this.isModalOpen === false) {
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
      if (this.focusIndex === 1 && this.isModalOpen === false) {
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
          previousEvent
        );
      }
      if (this.focusIndex === 0 && this.isModalOpen === false) {
        this.isModalOpen = true;

        const fullFunctionName = this.getCurrentlySelectedLambdaName();
        const previousLambdaPayload = this.previousLambdaPayload[
          fullFunctionName
        ];

        return lambdaInvokeModal(
          screen,
          this,
          fullFunctionName,
          lambda,
          previousLambdaPayload
        );
      }
      return 0;
    });
    screen.key(["l"], () => {
      if (this.focusIndex === 0 && this.isModalOpen === false) {
        this.isModalOpen = true;
        const fullFunctionName = this.getCurrentlySelectedLambdaName();

        return lambdaStatisticsModal(
          screen,
          this,
          fullFunctionName,
          cloudwatchLogs,
          cloudwatch,
          lambda
        );
      }
      return 0;
    });
    screen.key(["r"], () => {
      // If focus is currently on this.eventBridgeTree
      if (this.focusIndex === 1 && this.isModalOpen === false) {
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

  getCurrentlySelectedLambdaName() {
    const selectedRow = this.lambdasTable.rows.selected;
    const [selectedLambdaName] = this.lambdasTable.rows.items[selectedRow].data;
    return `${program.stackName}-${selectedLambdaName}`;
  }

  setIsModalOpen(value) {
    this.isModalOpen = value;
  }

  setFirstLogsRetrieved(value) {
    this.firstLogsRetrieved = value;
  }

  setPrevErrorId(value) {
    this.prevErrorId = value;
  }

  async render() {
    setInterval(() => {
      if (program.region && program.stackName) {
        this.map.updateMap();
        this.updateResourcesInformation();
        this.updateGraphs();
      } else if (!this.isModalOpen) {
        this.setIsModalOpen(true);
        clargsWizardModal(screen, this);
      }
      screen.render();
    }, 1000);
  }

  async updateGraphs() {
    if (this.fullFuncName) {
      this.data = await getLambdaMetrics(this, this.fullFuncName, cloudwatch);
      getLogEvents(`/aws/lambda/${this.fullFuncName}`, cloudwatchLogs).then(
        (data) => {
          this.events = data;
          updateLogContentsFromEvents(this.lambdaLog, this.events);
          checkLogsForErrors(this.events, this);
          this.setFirstLogsRetrieved(true);

          this.durationBarChart.updateData();
        }
      );
    }

    this.padInvocationsAndErrorsWithZeros();
    this.sortMetricDataResultsByTimestamp();
    this.setLineGraphData();
  }

  async updateResourcesInformation() {
    const stackResources = await getStackResources(
      program.stackName,
      this.setData
    );
    this.data = stackResources;

    let latestLastUpdatedTimestamp = -1;
    const lambdaFunctionResources = stackResources.StackResourceSummaries.filter(
      (res) => {
        const isLambdaFunction = res.ResourceType === "AWS::Lambda::Function";
        if (isLambdaFunction) {
          const lastUpdatedTimestampMilliseconds = moment(
            res.LastUpdatedTimestamp
          ).valueOf();
          if (lastUpdatedTimestampMilliseconds > latestLastUpdatedTimestamp) {
            latestLastUpdatedTimestamp = lastUpdatedTimestampMilliseconds;
          }
        }
        return isLambdaFunction;
      }
    );
    if (latestLastUpdatedTimestamp > latestLambdaFunctionsUpdateTimestamp) {
      // In case of update in the Lambda function resources,
      // instead of getting updated function configurations one by one individually,
      // we are getting all the functions' configurations in batch
      // even though there will be unrelated ones with the stack.
      // Because this should result with less API calls in most cases.
      await refreshLambdaFunctions();
      latestLambdaFunctionsUpdateTimestamp = latestLastUpdatedTimestamp;
    }

    this.lambdasTable.data = lambdaFunctionResources.map((lam) => {
      const funcName = lam.PhysicalResourceId;
      const func = lambdaFunctions[funcName];
      let funcRuntime = "?";
      if (func) {
        funcRuntime = func.Runtime;
      }
      return [
        lam.PhysicalResourceId.replace(`${program.stackName}-`, ""),
        moment(lam.LastUpdatedTimestamp).format("MMMM Do YYYY, h:mm:ss a"),
        funcRuntime,
      ];
    });

    this.updateLambdaTableRows();
    this.updateLambdaDeploymentStatus();

    const eventBridgeResources = await getEventBuses();
    const busNames = eventBridgeResources.EventBuses.map((o) => o.Name).reduce(
      (eventBridges, bus) => {
        eventBridges[bus] = {};
        return eventBridges;
      },
      {}
    );

    this.eventBridgeTree.setData({
      extended: true,
      children: busNames,
    });
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

  deployStack() {
    if (provider === "serverlessFramework") {
      exec(
        `serverless deploy -r ${program.region} --aws-profile ${profile} ${
          slsDevToolsConfig ? slsDevToolsConfig.deploymentArgs : ""
        }`,
        { cwd: location },
        (error, stdout) => this.handleStackDeployment(error, stdout)
      );
    } else if (provider === "SAM") {
      exec("sam build", { cwd: location }, (error) => {
        if (error) {
          console.error(error);
          Object.keys(this.lambdasDeploymentStatus).forEach(
            // eslint-disable-next-line no-return-assign
            (functionName) =>
              (this.lambdasDeploymentStatus[functionName] =
                DEPLOYMENT_STATUS.ERROR)
          );
        } else {
          exec(
            `sam deploy --region ${
              program.region
            } --profile ${profile} --stack-name ${program.stackName} ${
              slsDevToolsConfig ? slsDevToolsConfig.deploymentArgs : ""
            }`,
            { cwd: location },
            (deployError, stdout) =>
              this.handleStackDeployment(deployError, stdout)
          );
        }
      });
    }
    this.lambdasTable.data.forEach((v, i) => {
      this.flashLambdaTableRow(i);
      this.lambdasDeploymentStatus[this.lambdasTable.rows.items[i].data[0]] =
        DEPLOYMENT_STATUS.PENDING;
    });
    this.updateLambdaTableRows();
  }

  handleStackDeployment(error, stdout) {
    if (error) {
      console.error(error);
      Object.keys(this.lambdasDeploymentStatus).forEach(
        // eslint-disable-next-line no-return-assign
        (functionName) =>
          (this.lambdasDeploymentStatus[functionName] = DEPLOYMENT_STATUS.ERROR)
      );
    } else {
      console.log(stdout);
      Object.keys(this.lambdasDeploymentStatus).forEach(
        // eslint-disable-next-line no-return-assign
        (functionName) =>
          (this.lambdasDeploymentStatus[functionName] =
            DEPLOYMENT_STATUS.SUCCESS)
      );
    }
    this.lambdasTable.data.forEach((v, i) => {
      this.unflashLambdaTableRow(i);
    });
    this.updateLambdaTableRows();
  }

  deployFunction() {
    const selectedRowIndex = this.lambdasTable.rows.selected;
    if (selectedRowIndex !== -1) {
      const selectedLambdaFunctionName = this.lambdasTable.rows.items[
        selectedRowIndex
      ].data[0];
      if (provider === "serverlessFramework") {
        exec(
          `serverless deploy -f ${selectedLambdaFunctionName} -r ${
            program.region
          } --aws-profile ${profile} ${
            slsDevToolsConfig ? slsDevToolsConfig.deploymentArgs : ""
          }`,
          { cwd: location },
          (error, stdout) =>
            this.handleFunctionDeployment(
              error,
              stdout,
              selectedLambdaFunctionName,
              selectedRowIndex
            )
        );
      } else if (provider === "SAM") {
        console.error(
          "ERROR: UNABLE TO DEPLOY SINGLE FUNCTION WITH SAM. PRESS s TO DEPLOY STACK"
        );
        return;
      }
      this.flashLambdaTableRow(selectedRowIndex);
      this.lambdasDeploymentStatus[selectedLambdaFunctionName] =
        DEPLOYMENT_STATUS.PENDING;
      this.updateLambdaTableRows();
    }
  }

  handleFunctionDeployment(error, stdout, lambdaName, lambdaIndex) {
    if (error) {
      console.error(error);
      this.lambdasDeploymentStatus[lambdaName] = DEPLOYMENT_STATUS.ERROR;
    } else {
      console.log(stdout);
      this.lambdasDeploymentStatus[lambdaName] = DEPLOYMENT_STATUS.SUCCESS;
    }
    this.unflashLambdaTableRow(lambdaIndex);
    this.updateLambdaTableRows();
  }

  flashLambdaTableRow(rowIndex) {
    this.lambdasTable.rows.items[rowIndex].style.fg = "blue";
    this.lambdasTable.rows.items[rowIndex].style.bg = "green";
  }

  unflashLambdaTableRow(rowIndex) {
    this.lambdasTable.rows.items[rowIndex].style.fg = () =>
      rowIndex === this.lambdasTable.rows.selected ? "white" : "green";
    this.lambdasTable.rows.items[rowIndex].style.bg = () =>
      rowIndex === this.lambdasTable.rows.selected ? "blue" : "default";
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

  updateLambdaDeploymentStatus() {
    Object.entries(this.lambdasDeploymentStatus).forEach(([key, value]) => {
      if (
        value === DEPLOYMENT_STATUS.SUCCESS ||
        value === DEPLOYMENT_STATUS.ERROR
      ) {
        this.lambdasDeploymentStatus[key] = undefined;
      }
    });
  }

  updateLambdaTableRows() {
    const lambdaFunctionsWithDeploymentIndicator = JSON.parse(
      JSON.stringify(this.lambdasTable.data)
    );
    let deploymentIndicator;
    for (let i = 0; i < this.lambdasTable.data.length; i++) {
      deploymentIndicator = null;
      switch (this.lambdasDeploymentStatus[this.lambdasTable.data[i][0]]) {
        case DEPLOYMENT_STATUS.PENDING:
          deploymentIndicator = emoji.get("coffee");
          break;
        case DEPLOYMENT_STATUS.SUCCESS:
          deploymentIndicator = emoji.get("sparkles");
          break;
        case DEPLOYMENT_STATUS.ERROR:
          deploymentIndicator = emoji.get("x");
          break;
        default:
          break;
      }
      if (deploymentIndicator) {
        lambdaFunctionsWithDeploymentIndicator[
          i
        ][0] = `${deploymentIndicator} ${this.lambdasTable.data[i][0]}`;
      }
    }

    this.lambdasTable.setData({
      headers: ["logical", "updated", "runtime"],
      data: lambdaFunctionsWithDeploymentIndicator,
    });

    for (let i = 0; i < this.lambdasTable.data.length; i++) {
      this.lambdasTable.rows.items[i].data = this.lambdasTable.data[i];
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

  updateRegion(region) {
    program.region = region;
    AWS.config.region = region;
    updateAWSServices();
  }
}

new Main().render();
exports.slsDevTools = () => new Main().render();
