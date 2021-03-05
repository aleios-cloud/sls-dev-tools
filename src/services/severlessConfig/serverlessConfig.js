class ServerlessConfig {
  constructor(config) {
    this.config = config;
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
    if (
      this.config.service &&
      this.config.service.name &&
      typeof this.config.service.name === "string"
    ) {
      return `${this.config.service.name}-${stage}`;
    }

    return null;
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

export default ServerlessConfig;
