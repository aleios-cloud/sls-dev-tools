class NoMaximumMemory {
  constructor(AWS, stackName, stackFunctions) {
    this.name = "no-max-memory";
    this.AWS = AWS;
    this.stackName = stackName;
    this.stackFunctions = stackFunctions;
    this.result = false;
    this.maxMemory = 3008;
    this.failingResources = [];
    this.failureMessage =
      "The following functions have their memory set to the maximum limit.";
    this.rulePage =
      "See (https://theodo-uk.github.io/sls-dev-tools/docs/no-max-memory) for impact and how to to resolve.";
  }

  hasMaximumMemory(lambdaFunction) {
    return lambdaFunction.MemorySize === this.maxMemory;
  }

  async run() {
    try {
      const maxMemFunction = this.stackFunctions.reduce(
        (acc, current) =>
          this.hasMaximumMemory(current) ? [...acc, current] : acc,
        []
      );

      this.failingResources = maxMemFunction.map((lambda) => ({
        arn: lambda.FunctionArn,
        memory: lambda.MemorySize,
      }));

      if (maxMemFunction.length > 0) {
        this.result = false;
      } else {
        this.result = true;
      }
    } catch (e) {
      console.error(e);
      this.result = false;
    }
    return this.result;
  }
}

export default NoMaximumMemory;
