class UseArm {
  constructor(AWS, stackName, stackFunctions, SLS) {
    this.name = "use-arm";
    this.AWS = AWS;
    this.stackName = stackName;
    this.stackFunctions = stackFunctions;
    this.result = false;
    this.failingResources = [];
    this.armArchitecture = "arm64";
    this.SLS = SLS;
    this.failureMessage =
      "The following functions do not use an arm64 architecture.";
    this.rulePage =
      "See (https://theodo-uk.github.io/sls-dev-tools/docs/no-default-memory) for impact and how to to resolve.";
  }

  hasArmArchitecture(lambdaFunction) {
    return lambdaFunction.Architectures[0] === this.armArchitecture;
  }

  async run() {
    console.log(this.stackFunctions);
    try {
      const notArmFunctions = this.stackFunctions.reduce(
        (acc, current) =>
          this.hasArmArchitecture(current) ? acc : [...acc, current],
        []
      );

      this.failingResources = notArmFunctions.map((lambda) => ({
        arn: lambda.FunctionArn,
        architecture: lambda.Architectures[0],
      }));

      if (notArmFunctions.length > 0) {
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

export default UseArm;
