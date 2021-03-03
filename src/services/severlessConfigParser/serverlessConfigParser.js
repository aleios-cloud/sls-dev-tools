import { transformArgsToDict, replaceStacknameOpt } from "./helpers";

const fs = require("fs");
const path = require("path");
const YAML = require("js-yaml");

class ServerlessConfigParser {
  constructor(program) {
    const { args, location } = program;
    const options = transformArgsToDict(args);
    const ymlPath = path.join(location, "serverless.yml");
    const yamlPath = path.join(location, "serverless.yaml");
    const jsonPath = path.join(location, "serverless.json");

    if (fs.existsSync(ymlPath)) {
      this.config = YAML.load(fs.readFileSync(ymlPath).toString("utf8"));
    } else if (fs.existsSync(yamlPath)) {
      this.config = YAML.load(fs.readFileSync(yamlPath).toString("utf8"));
    } else if (fs.existsSync(jsonPath)) {
      this.config = JSON.parse(fs.readFileSync(jsonPath).toString("utf8"));
    }

    if (!this.config) return;

    this.config.service.name = replaceStacknameOpt(
      this.config.service.name,
      options
    );
  }

  getFunctionConfig(functionName) {
    if (this.config && this.config.functions) {
      return this.config.functions[functionName];
    }
    return undefined;
  }

  getTimeout(functionName) {
    const config = this.getFunctionConfig(functionName);
    if (config && config.timeout) {
      return config.timeout;
    }
    return undefined;
  }

  getMemorySize(functionName) {
    const config = this.getFunctionConfig(functionName);
    if (config && config.memorySize) {
      return config.memorySize;
    }
    return undefined;
  }

  getStage() {
    if (typeof this.config !== "object") {
      return "dev";
    }
    if (
      this.config.provider &&
      this.config.provider.stage &&
      typeof this.config.provider.stage === "string" &&
      this.config.provider.stage[0] !== "$"
    ) {
      return `${this.config.provider.stage}`;
    }
    return "dev";
  }

  getStackName(stage) {
    if (typeof this.config !== "object") {
      return null;
    }
    if (
      this.config.provider &&
      this.config.provider.stackName &&
      typeof this.config.provider.stackName === "string"
    ) {
      return `${this.config.provider.stackName}`;
    }
    if (typeof this.config.service === "string") {
      return `${this.config.service}-${stage}`;
    }
    return `${this.config.service.name}-${stage}`;
  }

  getRegion() {
    if (typeof this.config !== "object") {
      return null;
    }
    if (
      this.config.provider &&
      this.config.provider.region &&
      typeof this.config.provider.region === "string" &&
      this.config.provider.region[0] !== "$"
    ) {
      return `${this.config.provider.region}`;
    }
    return null;
  }
}

export default ServerlessConfigParser;
