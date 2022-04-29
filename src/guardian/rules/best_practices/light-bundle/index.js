class LightBundle {
  constructor(AWS, stackName, stackFunctions) {
    this.name = "light-bundle";
    this.AWS = AWS;
    this.stackName = stackName;
    this.stackFunctions = stackFunctions;
    this.result = false;
    this.failingResources = [];
    this.failureMessage =
      "The following functions have bundles that weight more than 5 Mb.";
    this.rulePage =
      "See (https://m33.notion.site/Serverless-Sustainability-Audit-a36847289fd64339a60e40bc5aa63092) for impact.";
  }

  static hasHeavyBundle(lambdaFunction) {
    return lambdaFunction.CodeSize > 5000000;
  }

  async run() {
    try {
      const functionsWithIdenticalRoles = this.stackFunctions.reduce(
        (acc, current) =>
          LightBundle.hasHeavyBundle(current) ? [...acc, current] : acc,
        []
      );

      this.failingResources = functionsWithIdenticalRoles.map((lambda) => ({
        arn: lambda.FunctionArn,
        Role: lambda.Role,
      }));

      if (functionsWithIdenticalRoles.length > 0) {
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

export default LightBundle;
