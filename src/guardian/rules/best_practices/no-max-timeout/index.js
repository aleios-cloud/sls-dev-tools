class NoMaximumTimeout {
  constructor(AWS, stackName, stackFunctions) {
    this.name = "no-max-timeout";
    this.AWS = AWS;
    this.stackName = stackName;
    this.stackFunctions = stackFunctions;
    this.result = false;
    this.maximumTimeout = 900;
    this.failingResources = [];
    this.failureMessage =
      "The following functions have their timeout set as the maximum.";
    this.rulePage =
      "See (https://theodo-uk.github.io/sls-dev-tools/docs/no-max-timeout) for impact and how to to resolve.";
  }

  hasMaximumTimeout(lambdaFunction) {
    return lambdaFunction.Timeout === this.maximumTimeout;
  }

  async run() {
    try {
      const maximumTimeoutFuntions = this.stackFunctions.reduce(
        (acc, current) =>
          this.hasMaximumTimeout(current) ? [...acc, current] : acc,
        []
      );

      this.failingResources = maximumTimeoutFuntions.map((lambda) => ({
        arn: lambda.FunctionArn,
        timeout: lambda.Timeout,
      }));

      if (maximumTimeoutFuntions.length > 0) {
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

export default NoMaximumTimeout;
