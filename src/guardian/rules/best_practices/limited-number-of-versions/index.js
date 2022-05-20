class LimitedNumberOfVersions {
  constructor(AWS, stackName, stackFunctions) {
    this.name = "limited-number-of-versions";
    this.AWS = AWS;
    this.stackName = stackName;
    this.stackFunctions = stackFunctions;
    this.result = false;
    this.failingResources = [];
    this.failureMessage =
      "The following functions have a number of deployed versions greater than 3";
    this.rulePage =
      "See (https://m33.notion.site/Serverless-Sustainability-Audit-a36847289fd64339a60e40bc5aa63092) for impact.";
    this.lambda = new AWS.Lambda();
  }

  // Given the name of a lambda, returns its number of versions (excluding $Latest)
  async getNumberOfLambdaVersions(FunctionName) {
    const lambdaVersions = await this.lambda
      .listVersionsByFunction({
        FunctionName,
      })
      .promise();
    return lambdaVersions.Versions.length - 1;
  }

  async run() {
    try {
      const functionsWithCount = await Promise.all(
        this.stackFunctions.map(async (lambda) => {
          const numberOfVersions = await this.getNumberOfLambdaVersions(
            lambda.FunctionName
          );
          return {
            functionArn: lambda.FunctionArn,
            numberOfVersions,
          };
        })
      );

      const functionsWithTooManyVersions = functionsWithCount.reduce(
        (acc, current) =>
          current.numberOfVersions > 3 ? [...acc, current] : acc,
        []
      );

      this.failingResources = functionsWithTooManyVersions.map(
        (lambdaWithCount) => ({
          arn: lambdaWithCount.functionArn,
          numberOfVersions: lambdaWithCount.numberOfVersions,
        })
      );

      if (functionsWithTooManyVersions.length > 0) {
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

export default LimitedNumberOfVersions;
