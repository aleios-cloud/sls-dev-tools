class NoDefaultMemory {
  constructor(AWS, stackName, stackFunctions) { 
        this.name = "no-default-memory"
        this.AWS = AWS;
        this.stackName = stackName;
        this.stackFunctions = stackFunctions
        this.result;
        this.defaultMemory = 1024;
        this.failingResources = [];
        this.failureMessage = "The following functions have their memory set as default."
        this.rulePage = "See (https://github.com/Theodo-UK/sls-dev-tools/blob/guardian-ci/src/guardian/rules/best_practices/no-default-memory/no-default-memory.MD) for impact and how to to resolve."
  }

  hasDefaultMemory(lambdaFunction) {
    return lambdaFunction.MemorySize == this.defaultMemory;
  }

  async run() {
    try {
      const defautlMemFunctions = this.stackFunctions.reduce((acc, current) => this.hasDefaultMemory(current) ? [...acc, current] : acc, []);

      this.failingResources = defautlMemFunctions.map(lambda => ({arn: lambda.FunctionArn, memory: lambda.MemorySize}));

      if(defautlMemFunctions.length > 0) {
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

export default NoDefaultMemory;