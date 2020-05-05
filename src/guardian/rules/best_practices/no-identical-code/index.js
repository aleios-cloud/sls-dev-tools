class NoIdenticalCode {
  constructor(AWS, stackName, stackFunctions) {
    this.name = "no-identical-code";
    this.AWS = AWS;
    this.stackName = stackName;
    this.stackFunctions = stackFunctions;
    this.result;
    this.failingResources = [];
    this.failureMessage =
      "The following functions have identical deployment code repeated in 1 or more other functions.";
    this.rulePage =
      "See (https://github.com/Theodo-UK/sls-dev-tools/blob/guardian-ci/src/guardian/rules/best_practices/no-identical-code/no-identical-code.MD) for impact and how to to resolve.";
    this.codeShasEncountered = {};
  }

  hasCodeShaBeenEncountered(lambdaFunction) {
    const encountered = !!this.codeShasEncountered[lambdaFunction.CodeSha256];
    if (!encountered) {
      this.codeShasEncountered[lambdaFunction.CodeSha256] = true;
    }
    return encountered;
  }

  async run() {
    try {
      const functionsWithIdenticalCode = this.stackFunctions.reduce(
        (acc, current) =>
          this.hasCodeShaBeenEncountered(current) ? [...acc, current] : acc,
        []
      );

      this.failingResources = functionsWithIdenticalCode.map((lambda) => ({
        arn: lambda.FunctionArn,
        CodeSha256: lambda.CodeSha256,
      }));

      if (functionsWithIdenticalCode.length > 0) {
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

export default NoIdenticalCode;
