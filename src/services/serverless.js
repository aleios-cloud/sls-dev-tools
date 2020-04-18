const fs = require("fs");
const YAML = require("js-yaml");

class Serverless {
  constructor() {
    const ymlPath = "./serverless.yml";
    const yamlPath = "./serverless.yaml";

    if (fs.existsSync(ymlPath)) {
      this.config = YAML.load(fs.readFileSync(ymlPath).toString("utf8"));
      return;
    }
    if (fs.existsSync(yamlPath)) {
      this.config = YAML.load(fs.readFileSync(yamlPath).toString("utf8"));
    }
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
    return `${this.config.service}-${stage}`;
  }

  getRegion() {
    if (typeof this.config !== "object") {
      return null;
    }
    if (
      this.config.provider &&
      this.config.provider.region &&
      typeof this.config.provider.region === "string"
    ) {
      return `${this.config.provider.region}`;
    }
    return null;
  }
}

export default Serverless;
