class NoDefaultTimeout {
  constructor(AWS, stackName, stackFunctions) { 
        this.name = "no-default-timeout"
        this.AWS = AWS;
        this.stackName = stackName;
        this.stackFunctions = stackFunctions
        this.result;
        this.defaultTimeoutAWS = 3;
        this.defaultTimeoutServerlessFramework = 6;
        this.failingResources = [];
        this.failureMessage = "The following functions have their timeout set as default."
        this.rulePage = "See (https://github.com/Theodo-UK/sls-dev-tools/blob/guardian-ci/src/guardian/rules/best_practices/no-default-timeout/no-default-timeout.MD) for impact and how to to resolve."
  }

  hasDefaultTimeout(lambdaFunction) {
    return [this.defaultTimeoutAWS, this.defaultTimeoutServerlessFramework].includes(lambdaFunction.Timeout);
  }

  async run() {
    try {
      const defaultTimeoutFuntions = this.stackFunctions.reduce((acc, current) => this.hasDefaultTimeout(current) ? [...acc, current] : acc, []);

      this.failingResources = defaultTimeoutFuntions.map(lambda => ({arn: lambda.FunctionArn, timeout: lambda.Timeout}));

      if(defaultTimeoutFuntions.length > 0) {
        this.result = false;
      } else {
        this.result = true;
      }
    } catch (e) {
      console.error(e)
      this.result = false;
    }
    return this.result;
  }
}

export default NoDefaultTimeout;