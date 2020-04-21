const fs = require("fs");
const path = require("path");
const YAML = require("js-yaml");

class Serverless {
  constructor(location) {
    const ymlPath = path.join(location, "serverless.yml");
    const yamlPath = path.join(location, "serverless.yaml");
    const jsonPath = path.join(location, "serverless.json");

    if (fs.existsSync(ymlPath)) {
      this.config = YAML.load(fs.readFileSync(ymlPath).toString("utf8"));
      return;
    }
    if (fs.existsSync(yamlPath)) {
      this.config = YAML.load(fs.readFileSync(yamlPath).toString("utf8"));
    }
    if (fs.existsSync(jsonPath)) {
      this.config = JSON.parse(fs.readFileSync(jsonPath).toString("utf8"));
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
    return `${this.config.service.name}-${stage}`;
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
