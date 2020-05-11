import {
  DEPLOYMENT_STATUS,
  RESOURCE_TABLE_TYPE,
  DASHBOARD_FOCUS_INDEX,
} from "../constants";
import { getStackResources } from "../services/stackResources";
import { padString } from "../utils/padString";
import { lambdaStatisticsModal, lambdaInvokeModal } from "../modals";
import { getLambdaFunctions } from "../services";

const contrib = require("blessed-contrib");
const open = require("open");
const { exec } = require("child_process");
const emoji = require("node-emoji");
const moment = require("moment");

class ResourceTable {
  constructor(
    application,
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
  ) {
    this.application = application;
    this.lambdaFunctions = {};
    this.fullFunctionNames = {};
    this.latestLambdaFunctionsUpdateTimestamp = -1;
    this.program = program;
    this.cloudformation = cloudformation;
    this.table = this.generateLambdaTable();
    this.funcName = null;
    this.fullFuncName = null;
    this.table.rows.on("select", (item) => {
      [this.funcName] = item.data;
      this.fullFuncName = this.getFullFunctionName(this.funcName);
    });
    this.provider = provider;
    this.slsDevToolsConfig = slsDevToolsConfig;
    this.lambdasDeploymentStatus = {};
    this.profile = profile;
    this.location = location;
    this.type = RESOURCE_TABLE_TYPE.LAMBDA;
    this.lambda = lambda;
    this.screen = screen;
    this.cloudwatch = cloudwatch;
    this.cloudwatchLogs = cloudwatchLogs;
    this.setKeypresses();
  }

  updateAPIs(profile, cloudformation, lambda, cloudwatch, cloudwatchLogs) {
    this.profile = profile;
    this.cloudformation = cloudformation;
    this.lambda = lambda;
    this.cloudwatch = cloudwatch;
    this.cloudwatchLogs = cloudwatchLogs;
  }

  getFullFunctionName(abbreviatedFunctionName) {
    return this.fullFunctionNames[abbreviatedFunctionName];
  }

  isOnFocus() {
    return this.application.focusIndex === DASHBOARD_FOCUS_INDEX.RESOURCE_TABLE;
  }

  isLambdaTable() {
    return this.type === RESOURCE_TABLE_TYPE.LAMBDA;
  }

  setKeypresses() {
    this.screen.key(["l"], () => {
      if (this.isOnFocus() && this.application.isModalOpen === false) {
        this.application.isModalOpen = true;
        return lambdaStatisticsModal(
          this.screen,
          this.application,
          this.getCurrentlyOnHoverFullLambdaName(),
          this.cloudwatchLogs,
          this.cloudwatch,
          this.lambda,
          this.lambdaFunctions[this.getCurrentlyOnHoverFullLambdaName()]
        );
      }
      return 0;
    });
    this.screen.key(["i"], () => {
      if (
        this.isOnFocus() &&
        this.isLambdaTable() &&
        this.application.isModalOpen === false
      ) {
        this.application.isModalOpen = true;
        const fullFunctionName = this.getCurrentlyOnHoverFullLambdaName();
        const previousLambdaPayload = this.application.previousLambdaPayload[
          fullFunctionName
        ];

        return lambdaInvokeModal(
          this.screen,
          this.application,
          fullFunctionName,
          this.lambda,
          previousLambdaPayload
        );
      }
      return 0;
    });
    this.screen.key(["o"], () => {
      if (
        this.isOnFocus() &&
        this.isLambdaTable() &&
        this.application.isModalOpen === false
      ) {
        return this.openLambdaInAWSConsole();
      }
      return 0;
    });
    this.screen.key(["d"], () => {
      if (
        this.isOnFocus() &&
        this.isLambdaTable() &&
        this.application.isModalOpen === false
      ) {
        return this.deployFunction();
      }
      return 0;
    });
    this.screen.key(["right", "left"], () => {
      if (this.isOnFocus() && this.application.isModalOpen === false) {
        this.switchTable();
      }
      return 0;
    });
    this.screen.key(["s"], () => {
      if (
        this.isOnFocus() &&
        this.isLambdaTable() &&
        this.application.isModalOpen === false
      ) {
        return this.deployStack();
      }
      return 0;
    });
  }

  switchTable() {
    switch (this.type) {
      case RESOURCE_TABLE_TYPE.LAMBDA:
        this.type = RESOURCE_TABLE_TYPE.ALL_RESOURCES;
        this.table.setLabel("<-           All Resources          ->");
        this.table.options.columnWidth = [50, 30];
        break;
      case RESOURCE_TABLE_TYPE.ALL_RESOURCES:
        this.type = RESOURCE_TABLE_TYPE.LAMBDA;
        this.table.setLabel("<-         Lambda Functions         ->");
        this.table.options.columnWidth = [30, 30, 10, 10, 20];
        break;
      default:
        return 0;
    }
    return this.updateData();
  }

  generateLambdaTable() {
    return this.application.layoutGrid.set(0, 6, 4, 6, contrib.table, {
      keys: true,
      fg: "green",
      label: "<-         Lambda Functions         ->",
      columnSpacing: 1,
      columnWidth: [30, 30, 10, 10, 20, 10],
      style: {
        border: {
          fg: "yellow",
        },
      },
    });
  }

  getCurrentlyOnHoverLambdaName() {
    const onHoverRow = this.table.rows.selected;
    const [onHoverLambdaName] = this.table.rows.items[onHoverRow].data;
    return onHoverLambdaName;
  }

  getCurrentlyOnHoverFullLambdaName() {
    return this.getFullFunctionName(this.getCurrentlyOnHoverLambdaName());
  }

  async refreshLambdaFunctions() {
    const allFunctions = await getLambdaFunctions(this.lambda);
    this.lambdaFunctions = allFunctions.reduce((map, func) => {
      // eslint-disable-next-line no-param-reassign
      map[func.FunctionName] = func;
      return map;
    }, {});
  }

  async updateData() {
    const stackResources = await getStackResources(
      this.program.stackName,
      this.cloudformation,
      this.application.setData
    );

    if (stackResources) {
      this.application.data = stackResources;

      switch (this.type) {
        case RESOURCE_TABLE_TYPE.LAMBDA:
          this.updateLambdaTableData(stackResources);
          break;
        case RESOURCE_TABLE_TYPE.ALL_RESOURCES:
          this.updateAllResourceTableData(stackResources);
          break;
        default:
          break;
      }
    }
    return 0;
  }

  async updateLambdaTableData(stackResources) {
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
    if (
      latestLastUpdatedTimestamp > this.latestLambdaFunctionsUpdateTimestamp
    ) {
      // In case of update in the Lambda function resources,
      // instead of getting updated function configurations one by one individually,
      // we are getting all the functions' configurations in batch
      // even though there will be unrelated ones with the stack.
      // Because this should result with less API calls in most cases.
      this.refreshLambdaFunctions();
      this.latestLambdaFunctionsUpdateTimestamp = latestLastUpdatedTimestamp;
    }
    this.table.data = lambdaFunctionResources.map((lam) => {
      const funcName = lam.PhysicalResourceId;
      const func = this.lambdaFunctions[funcName];
      const shortenedFuncName = lam.PhysicalResourceId.replace(
        `${this.program.stackName}-`,
        ""
      );
      this.fullFunctionNames[shortenedFuncName] = funcName;
      let timeout = "?";
      let memory = "?";
      let funcRuntime = "?";
      let layersPresent = "?";
      if (func) {
        funcRuntime = func.Runtime;
        timeout = func.Timeout.toString();
        memory = func.MemorySize.toString();
        layersPresent = func.Layers ? "Y" : "N";
      }
      // Max timout is 900 seconds, align values with whitespace
      timeout = padString(timeout, 3);
      // Max memory is 3008 MB, align values with whitespace
      memory = padString(memory, 4);
      return [
        shortenedFuncName,
        moment(lam.LastUpdatedTimestamp).format("MMMM Do YYYY, h:mm:ss a"),
        `${memory} MB`,
        `${timeout} secs`,
        funcRuntime,
        `${layersPresent}`,
      ];
    });
    this.updateLambdaTableRows();
    this.updateLambdaDeploymentStatus();
  }

  updateAllResourceTableData(stackResources) {
    const resources = stackResources.StackResourceSummaries;
    this.table.data = resources.map((resource) => {
      const resourceName = resource.LogicalResourceId;
      const resourceType = resource.ResourceType.replace("AWS::", "");
      return [resourceName, resourceType];
    });
    this.updateAllResourcesTableRows();
  }

  openLambdaInAWSConsole() {
    if (this.type === RESOURCE_TABLE_TYPE.LAMBDA) {
      return open(
        `https://${
          this.program.region
        }.console.aws.amazon.com/lambda/home?region=${
          this.program.region
        }#/functions/${this.getCurrentlyOnHoverFullLambdaName()}?tab=configuration`
      );
    }
    return 0;
  }

  deployFunction() {
    const selectedRowIndex = this.table.rows.selected;
    if (selectedRowIndex !== -1) {
      const selectedLambdaFunctionName = this.getCurrentlyOnHoverLambdaName();
      if (this.provider === "serverlessFramework") {
        exec(
          `serverless deploy -f ${selectedLambdaFunctionName} -r ${
            this.program.region
          } --aws-profile ${this.profile} ${
            this.slsDevToolsConfig ? this.slsDevToolsConfig.deploymentArgs : ""
          }`,
          { cwd: this.location },
          (error, stdout) => {
            console.log(error);
            return this.handleFunctionDeployment(
              error,
              stdout,
              selectedLambdaFunctionName,
              selectedRowIndex
            );
          }
        );
      } else if (this.provider === "SAM") {
        console.error(
          "ERROR: UNABLE TO DEPLOY SINGLE FUNCTION WITH SAM. PRESS s TO DEPLOY STACK"
        );
        return;
      }
      this.flashRow(selectedRowIndex);
      this.lambdasDeploymentStatus[selectedLambdaFunctionName] =
        DEPLOYMENT_STATUS.PENDING;
      this.updateLambdaTableRows();
    }
  }

  updateAllResourcesTableRows() {
    this.table.setData({
      headers: ["logical", "type"],
      data: this.table.data,
    });
  }

  updateLambdaTableRows() {
    const lambdaFunctionsWithDeploymentIndicator = JSON.parse(
      JSON.stringify(this.table.data)
    );
    let deploymentIndicator;
    for (let i = 0; i < this.table.data.length; i++) {
      deploymentIndicator = null;
      switch (this.lambdasDeploymentStatus[this.table.data[i][0]]) {
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
        ][0] = `${deploymentIndicator} ${this.table.data[i][0]}`;
      }
    }

    this.table.setData({
      headers: ["logical", "updated", "memory", "timeout", "runtime", "layers"],
      data: lambdaFunctionsWithDeploymentIndicator,
    });

    for (let i = 0; i < this.table.data.length; i++) {
      this.table.rows.items[i].data = this.table.data[i];
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
    this.unflashRow(lambdaIndex);
    this.updateLambdaTableRows();
  }

  flashRow(rowIndex) {
    this.table.rows.items[rowIndex].style.fg = "blue";
    this.table.rows.items[rowIndex].style.bg = "green";
  }

  unflashRow(rowIndex) {
    this.table.rows.items[rowIndex].style.fg = () =>
      rowIndex === this.table.rows.selected ? "white" : "green";
    this.table.rows.items[rowIndex].style.bg = () =>
      rowIndex === this.table.rows.selected ? "blue" : "default";
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

  deployStack() {
    if (this.provider === "serverlessFramework") {
      exec(
        `serverless deploy -r ${this.program.region} --aws-profile ${
          this.profile
        } ${
          this.slsDevToolsConfig ? this.slsDevToolsConfig.deploymentArgs : ""
        }`,
        { cwd: this.location },
        (error, stdout) => this.handleStackDeployment(error, stdout)
      );
    } else if (this.provider === "SAM") {
      exec("sam build", { cwd: this.location }, (error) => {
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
            `sam deploy --region ${this.program.region} --profile ${
              this.profile
            } --stack-name ${this.program.stackName} ${
              this.slsDevToolsConfig
                ? this.slsDevToolsConfig.deploymentArgs
                : ""
            }`,
            { cwd: this.location },
            (deployError, stdout) =>
              this.handleStackDeployment(deployError, stdout)
          );
        }
      });
    }
    this.table.data.forEach((v, i) => {
      this.flashRow(i);
      this.lambdasDeploymentStatus[this.table.rows.items[i].data[0]] =
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
    this.table.data.forEach((v, i) => {
      this.unflashRow(i);
    });
    this.updateLambdaTableRows();
  }
}

module.exports = {
  ResourceTable,
};
