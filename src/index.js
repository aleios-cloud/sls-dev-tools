#!/usr/bin/env node
import AWS from "aws-sdk";

import Serverless from "./services/serverless";
import GuardianCI from "./guardian/index";
import Main from "./CLIMain";

const program = require("commander");
const packageJson = require("../package.json");

let slsDevToolsConfig;
try {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  slsDevToolsConfig = require(`${process.cwd()}/slsdevtools.config.js`);
  program.slsDevToolsConfig = slsDevToolsConfig;
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
  .option("-s, --stage <stage>", "If sls option is set, use this stage")
  .option("--sls", "use the serverless framework to execute commands")
  .option("--sam", "use the SAM framework to execute commands")
  .option("-c, --ci", "ci mode for sls-dev-guardian checks")
  .parse(process.argv);

program.location = program.location || process.cwd();
let provider = "";
if (program.sam) {
  provider = "SAM";
} else {
  provider = "serverlessFramework";
  const SLS = new Serverless(program.location);
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

if (program.region) {
  AWS.config.region = program.region;
}

function startTool() {
  if (program.ci) {
    const guardian = new GuardianCI(AWS, program);
    guardian.runChecks().then((exitCode) => (process.exitCode = exitCode));
  } else {
    new Main(program);
  }
}

startTool();
exports.slsDevTools = () => startTool();
