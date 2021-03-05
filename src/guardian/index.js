import chalk from "chalk";
import AWS from "aws-sdk";

import NoDefaultMemory from "./rules/best_practices/no-default-memory";
import NoDefaultTimeout from "./rules/best_practices/no-default-timeout";
import NoMaximumTimeout from "./rules/best_practices/no-max-timeout";
import NoMaximumMemory from "./rules/best_practices/no-max-memory";
import NoIdenticalCode from "./rules/best_practices/no-identical-code";
import NoSharedRoles from "./rules/best_practices/no-shared-roles";
import {
  getAWSCredentials,
  getStackResources,
  getLambdaFunctions,
} from "../services";
import ServerlessConfig from "../services/severlessConfig/serverlessConfig";

const infoLog = chalk.greenBright;
const titleLog = chalk.greenBright.underline.bold;
const fail = chalk.redBright;
const failTitleLog = chalk.redBright.underline.bold;

class GuardianCI {
  constructor(program, config) {
    AWS.config.credentials = getAWSCredentials(program.profile, program);
    if (program.region) {
      AWS.config.region = program.region;
    }
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

    if (program.slsDevToolsConfig) {
      this.config = program.slsDevToolsConfig.guardian;
    }
    if (this.config) {
      this.ignoreConfig = this.config.ignore;
    }

    this.SLS = new ServerlessConfig(config);
  }

  async getAllLambdaFunctions() {
    const lambda = new this.AWS.Lambda();
    const allFunctions = getLambdaFunctions(lambda);
    return allFunctions;
  }

  async getStackFunctionResouceIDs() {
    const cloudformation = new this.AWS.CloudFormation();
    const stackResources = await getStackResources(
      this.stackName,
      cloudformation
    );
    const lambdaFunctionResources = stackResources.StackResourceSummaries.filter(
      (res) => res.ResourceType === "AWS::Lambda::Function"
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
    if (this.ignoreConfig) {
      if (this.ignoreConfig[check.name] === true) {
        return true;
      }
      if (Date.parse(this.ignoreConfig[check.name]) > Date.now()) {
        return true;
      }
    }
    return false;
  }

  ignoreArns(check, stackFunctions) {
    if (this.ignoreConfig) {
      const arns = this.ignoreConfig[check.name];
      if (arns instanceof Array) {
        return stackFunctions.filter(
          (func) => !arns.includes(func.FunctionArn)
        );
      }
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
    if (this.exitCode !== 0) {
      return;
    }

    console.group(titleLog(" > Running checks"));

    console.log("Analysing Resources...");
    await this.initResources();
    // eslint-disable-next-line no-restricted-syntax
    for (const Check of this.checksToRun) {
      console.group();
      const check = new Check(
        this.AWS,
        this.stackName,
        this.stackFunctions,
        this.SLS
      );
      if (!this.ignoreCheck(check)) {
        const filteredStack = this.ignoreArns(check, this.stackFunctions);
        check.stackFunctions = filteredStack;
        const padCheckName = (checkName) => " ".repeat(20 - checkName.length);
        process.stdout.write(
          infoLog(`   > ${check.name}...${padCheckName(check.name)}`)
        );
        // eslint-disable-next-line no-await-in-loop
        const checkResult = await check.run();
        console.log(checkResult ? "✅" : "❌");
        if (!checkResult) {
          this.failingChecks = [...this.failingChecks, check];
        }
        console.groupEnd();
      }
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

    // eslint-disable-next-line consistent-return
    return this.exitCode;
  }
}

export default GuardianCI;
