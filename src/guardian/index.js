import chalk from "chalk";

import NoDefaultMemory from "./rules/best_practices/no-default-memory";
import NoDefaultTimeout from "./rules/best_practices/no-default-timeout";
import NoMaximumTimeout from "./rules/best_practices/no-max-timeout";
import NoMaximumMemory from "./rules/best_practices/no-max-memory";
import NoIdenticalCode from "./rules/best_practices/no-identical-code";
import NoSharedRoles from "./rules/best_practices/no-shared-roles";
import { getStackResources } from "../services/stackResources";

const infoLog = chalk.greenBright;
const titleLog = chalk.greenBright.underline.bold;
const fail = chalk.redBright;
const failTitleLog = chalk.redBright.underline.bold;

function getAWSCredentials(AWS, program) {
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

class GuardianCI {
  constructor(AWS, program) {
    AWS.config.credentials = getAWSCredentials(AWS, program);
    this.exitCode = 0;
    if (!AWS) {
      console.error("Invalid AWS SDK");
      this.exitCode = 1;
    }
    if (!program.stackName) {
      console.error("Invalid Cloudformation Stack Name");
      this.exitCode = 1;
    }
    this.AWS = AWS;
    this.stackName = program.stackName;
    this.checksToRun = [
      NoDefaultMemory,
      NoDefaultTimeout,
      NoMaximumTimeout,
      NoMaximumMemory,
      NoIdenticalCode,
      NoSharedRoles,
    ];
    this.failingChecks = [];

    this.resourceIDs = [];
    this.allFunctions = [];
    this.stackFunctions = [];

    this.config = program.slsDevToolsConfig.guardian;
    if (this.config) {
      this.ignoreConfig = this.config.ignore;
    }
  }

  async getAllLambdaFunctions() {
    const lambda = new this.AWS.Lambda();
    let marker;
    let allFunctions = [];
    while (true) {
      const functions = await lambda
        .listFunctions({ Marker: marker, MaxItems: 50 })
        .promise();
      allFunctions = [...allFunctions, ...functions.Functions];
      if (!functions.NextMarker) {
        break;
      }
      marker = functions.NextMarker;
    }
    return allFunctions;
  }

  async getStackFunctionResouceIDs() {
    const cloudformation = new this.AWS.CloudFormation();
    const stackResources = await getStackResources(
      this.stackName,
      cloudformation
    );
    const lambdaFunctionResources = stackResources.StackResourceSummaries.filter(
      (res) => {
        return res.ResourceType === "AWS::Lambda::Function";
      }
    );
    return lambdaFunctionResources.map((lambda) => lambda.PhysicalResourceId);
  }

  async initResources() {
    this.resourceIDs = await this.getStackFunctionResouceIDs();
    this.allFunctions = await this.getAllLambdaFunctions();
    this.stackFunctions = this.allFunctions.filter((lambda) =>
      this.resourceIDs.includes(lambda.FunctionName)
    );
  }

  ignoreCheck(check) {
    if (this.ignoreConfig[check.name] === true) {
      return true;
    }
    if (Date.parse(this.ignoreConfig[check.name]) > Date.now()) {
      return true;
    }
    return false;
  }

  ignoreArns(check, stackFunctions) {
    const arns = this.ignoreConfig[check.name];
    if (arns instanceof Array) {
      return stackFunctions.filter((func) => !arns.includes(func.FunctionArn));
    }
    return stackFunctions;
  }

  async runChecks() {
    console.log(
      chalk.greenBright(`
         ‗‗‗‗‗‗‗‗‗‗‗‗‗‗‗†‗‗‗‗‗‗‗‗‗‗‗‗‗‗
                        ╿
                       ▓▓▓
                     ▓▓▓▓▓▓▓
                 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
                ▓▔▔▔▔▔▔▔▓▔▔▔▔▔▔▔▓
                ▓▁▁▁▁▁▁▁▓▁▁▁▁▁▁▁▓
                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
                 ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  
                 ╿             ╿
                 ▔             ▔
                  sls-dev-tools        
                    GUARDIAN

        `)
    );
    if (this.exitCode != 0) {
      return;
    }

    console.group(titleLog(" > Running checks"));

    console.log("Analysing Resources...");
    await this.initResources();
    for (const Check of this.checksToRun) {
      console.group();
      const check = new Check(this.AWS, this.stackName, this.stackFunctions);
      if (this.ignoreConfig) {
        if (this.ignoreCheck(check)) continue;
      }
      const filteredStack = this.ignoreArns(check, this.stackFunctions);
      check.stackFunctions = filteredStack;
      const padCheckName = (checkName) => " ".repeat(20 - checkName.length);
      process.stdout.write(
        infoLog(`   > ${check.name}...${padCheckName(check.name)}`)
      );
      const checkResult = await check.run();
      console.log(checkResult ? "✅" : "❌");
      if (!checkResult) {
        this.failingChecks = [...this.failingChecks, check];
      }
      console.groupEnd();
    }
    console.groupEnd();

    if (this.failingChecks.length > 0) {
      console.group(
        chalk.blueBright.underline(failTitleLog(" > Failing Checks"))
      );
    }

    let overallResult = true;
    this.failingChecks.forEach((failingCheck) => {
      console.group(fail(`> ${failingCheck.name}`));
      console.log(failingCheck.failureMessage);
      console.log(failingCheck.rulePage);
      console.table(failingCheck.failingResources);
      overallResult = false;
      console.groupEnd();
    });
    console.groupEnd();

    if (!overallResult) {
      this.exitCode = 1;
    }

    return this.exitCode;
  }
}

export default GuardianCI;
