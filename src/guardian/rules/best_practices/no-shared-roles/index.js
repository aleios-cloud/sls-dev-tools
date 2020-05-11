class NoSharedRoles {
  constructor(AWS, stackName, stackFunctions) {
    this.name = "no-shared-roles";
    this.AWS = AWS;
    this.stackName = stackName;
    this.stackFunctions = stackFunctions;
    this.result = false;
    this.failingResources = [];
    this.failureMessage =
      "The following functions have roles used by 1 or more other functions.";
    this.rulePage =
      "See (https://theodo-uk.github.io/sls-dev-tools/docs/no-shared-roles) for impact and how to to resolve.";
    this.IAMRolesEncountered = {};
  }

  hasRoleBeenEncountered(lambdaFunction) {
    const encountered = !!this.IAMRolesEncountered[lambdaFunction.Role];
    if (!encountered) {
      this.IAMRolesEncountered[lambdaFunction.Role] = true;
    }
    return encountered;
  }

  async run() {
    try {
      const functionsWithIdenticalRoles = this.stackFunctions.reduce(
        (acc, current) =>
          this.hasRoleBeenEncountered(current) ? [...acc, current] : acc,
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

export default NoSharedRoles;
