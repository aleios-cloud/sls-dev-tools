import AWS from "aws-sdk";
import {
  awsRegionLocations,
  logo,
  dateFormats,
  DASHBOARD_FOCUS_INDEX,
} from "./constants";

import { Map } from "./components";
import { ResourceTable } from "./components/resourceTable";
import { DurationBarChart } from "./components/durationBarChart";
import { getLambdaMetrics } from "./services/lambdaMetrics";
import {
  updateLogContentsFromEvents,
  checkLogsForErrors,
} from "./services/processEventLogs";
import { getLogEvents } from "./services/awsCloudwatchLogs";
import checkForUpdates from "./utils/updateNotifier";
import { getAWSCredentialsHQ } from "./services";

import {
  eventRegistryModal,
  eventInjectionModal,
  helpModal,
  regionWizardModal,
  stackWizardModal,
} from "./modals";

const blessed = require("blessed");
const contrib = require("blessed-contrib");
const moment = require("moment");
const open = require("open");

class Main {
  constructor(program) {
    this.program = program;
    this.screen = blessed.screen({ smartCSR: true });
    this.screen.key(["q", "C-c"], () => process.exit(0));
    this.location = this.program.location;
    if (program.sam) {
      this.provider = "SAM";
    } else {
      this.provider = "serverlessFramework";
    }
    this.cloudformation = new AWS.CloudFormation();
    this.cloudwatch = new AWS.CloudWatch();
    this.cloudwatchLogs = new AWS.CloudWatchLogs();
    this.eventBridge = new AWS.EventBridge();
    this.schemas = new AWS.Schemas();
    this.lambda = new AWS.Lambda();

    if (this.program.region) {
      AWS.config.region = this.program.region;
      this.updateAWSServices();
    }

    this.focusIndex = 0;
    // eslint-disable-next-line new-cap
    this.layoutGrid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen,
    });
    this.durationBarChart = new DurationBarChart(
      this,
      this.cloudwatchLogs,
      true
    );
    const profile = this.program.profile || "default";
    this.resourceTable = new ResourceTable(
      this,
      this.screen,
      this.program,
      this.provider,
      this.program.slsDevToolsConfig,
      profile,
      this.location,
      this.cloudformation,
      this.lambda,
      this.cloudwatch,
      this.cloudwatchLogs
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
    this.map = new Map(this.layoutGrid, this.program, this);
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
      alwaysScroll: true,
    });
    this.consoleLogs = this.layoutGrid.set(8, 6, 4, 3, blessed.log, {
      fg: "green",
      selectedFg: "dark-green",
      label: "Dashboard Logs",
      interactive: true,
      scrollbar: { bg: "blue" },
      mouse: true,
      alwaysScroll: true,
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
    this.screen.on("resize", () => {
      this.durationBarChart.chart("attach");
      this.resourceTable.table.emit("attach");
      // errorsLine.emit('attach');
      this.titleBox.emit("attach");
      this.invocationsLineGraph.emit("attach");
      this.map.map = this.map.generateMap();
      this.lambdaLog.emit("attach");
      this.consoleLogs.emit("attach");
    });
    this.screen.title = "sls-dev-tools";
    this.interval = this.program.interval || 3600; // 1 hour
    this.endTime = new Date();
    if (this.program.startTime) {
      // eslint-disable-next-line prefer-destructuring
      this.startTime = new Date(this.program.startTime);
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
    // Dictionary to store previous submissions for each this.lambda function
    this.previousLambdaPayload = {};

    // Store previous errorId found in logs, with region and fullFunc name
    this.prevError = {};
    // Store events from this.cloudwatchLogs
    this.events = [];
    // Allows use of .bell() function for notifications
    this.notifier = new blessed.Program();

    checkForUpdates();

    this.init();
  }

  init() {
    const creds = getAWSCredentialsHQ(this.program.profile, this.screen);

    return creds
      .getPromise()
      .then(() => {
        AWS.config.credentials = creds;
        this.updateAWSServices();

        if (
          !awsRegionLocations
            .map((region) => region.label)
            .includes(this.program.region)
        ) {
          this.promptRegion();
        } else if (!this.program.stackName) {
          this.promptStackName();
        } else {
          this.render();
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  async getEventBuses() {
    return this.eventBridge
      .listEventBuses()
      .promise()
      .catch((error) => {
        console.error(error);
      });
  }

  static injectEvent(event, eventBridgeAPI) {
    const params = { Entries: [] };
    params.Entries.push(event);
    eventBridgeAPI.putEvents(params, (err, data) => {
      if (err) console.error(err, err.stack);
      // an error occurred
      else console.log(data); // successful response
    });
  }

  promptStackName() {
    const stackTable = stackWizardModal(this.screen, this.cloudformation, this);
    stackTable.key(["enter"], () => {
      this.program.stackName = stackTable.ritems[stackTable.selected];
      this.render();
    });
  }

  promptRegion() {
    const regionTable = regionWizardModal(this.screen, this);
    regionTable.key(["enter"], () => {
      this.program.region = regionTable.ritems[regionTable.selected];
      AWS.config.region = this.program.region;
      this.updateAWSServices();
      this.map = new Map(this.layoutGrid, this.program, this);
      this.focusList[2] = this.map.map;
      if (!this.program.stackName) {
        this.promptStackName();
      } else {
        this.render();
      }
    });
  }

  updateAWSServices() {
    this.cloudformation = new AWS.CloudFormation();
    this.cloudwatch = new AWS.CloudWatch();
    this.cloudwatchLogs = new AWS.CloudWatchLogs();
    this.eventBridge = new AWS.EventBridge();
    this.schemas = new AWS.Schemas();
    this.lambda = new AWS.Lambda();

    if (this.resourceTable) {
      this.resourceTable.updateAPIs(
        this.profile,
        this.cloudformation,
        this.lambda,
        this.cloudwatch,
        this.cloudwatchLogs
      );
    }
  }

  setKeypresses() {
    this.screen.key(["h"], () => {
      if (this.isModalOpen === false) {
        this.isModalOpen = true;
        return helpModal(this.screen, this);
      }
      return 0;
    });
    this.screen.key(["tab"], () => {
      if (this.isModalOpen === false) {
        return this.changeFocus();
      }
      return 0;
    });
    // fixes https://github.com/yaronn/blessed-contrib/issues/10
    this.screen.key(["o"], () => {
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
          `https://${this.program.region}.console.aws.amazon.com/events/home?region=${this.program.region}#/eventbus/${selectedEventBridge}`
        );
      }
      return 0;
    });
    this.screen.key(["i"], () => {
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
          this.screen,
          selectedEventBridge,
          this,
          Main.injectEvent,
          previousEvent,
          this.schemas
        );
      }
      return 0;
    });

    this.screen.key(["r"], () => {
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
          this.screen,
          selectedEventBridge,
          this,
          this.schemas,
          Main.injectEvent
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
      this.screen.render();
    }, 1000);
  }

  async updateGraphs() {
    if (this.resourceTable.fullFuncName) {
      this.data = await getLambdaMetrics(
        this,
        this.resourceTable.fullFuncName,
        this.cloudwatch
      );
      getLogEvents(
        `/aws/lambda/${this.resourceTable.fullFuncName}`,
        this.cloudwatchLogs
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
    const eventBridgeResources = await this.getEventBuses();
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

  updateRegion(region) {
    this.program.region = region;
    AWS.config.region = region;
    this.updateAWSServices();
  }
}

export default Main;
