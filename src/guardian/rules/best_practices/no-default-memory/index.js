import { getStackResources } from "../../../../services/stackResources";

class NoDefaultMemory {
  constructor(AWS, stackName) { 
        this.name = "no-default-memory"
        this.AWS = AWS;
        this.stackName = stackName;
        this.defaultMemory = 1024;
        this.failingResources = [];
        this.failureMessage = "The following functions have their memory set as default."
        this.rulePage = "See (https://github.com/Theodo-UK/sls-dev-tools/blob/guardian-ci/src/guardian/rules/best_practices/no-default-memory/no-default-memory.MD) for impact and how to to resolve."
    }

  async getAllLambdaFunctions() {
      const lambda = new this.AWS.Lambda();
      let marker;
      let allFunctions = [];
      while (true){
        const functions = await lambda.listFunctions({Marker: marker, MaxItems: 50}).promise()
        allFunctions = [...allFunctions, ...functions.Functions]
        if(!functions.NextMarker){
          break;
        }
        marker = functions.NextMarker
      }
      return allFunctions;
  }

  async getStackFunctionResouceIDs() {
      const cloudformation = new this.AWS.CloudFormation();
      const stackResources = await getStackResources(this.stackName, cloudformation);
      const lambdaFunctionResources = stackResources.StackResourceSummaries.filter(
          (res) => {
            return res.ResourceType === "AWS::Lambda::Function";
          }
        );
      return lambdaFunctionResources.map(lambda => lambda.PhysicalResourceId);
  }

  hasDefaultMemory(lambdaFunction) {
    return lambdaFunction.MemorySize == this.defaultMemory;
  }

  async run() {
    try {
      const resourceIDs = await this.getStackFunctionResouceIDs();
      const allFunctions = await this.getAllLambdaFunctions();
      const stackFunctions = allFunctions.filter(lambda => resourceIDs.includes(lambda.FunctionName));
      
      const defautlMemFunctions = stackFunctions.reduce((acc, current) => this.hasDefaultMemory(current) ? [...acc, current] : acc, []);

      this.failingResources = defautlMemFunctions.map(lambda => ({arn: lambda.FunctionArn, memory: lambda.MemorySize}));

      if(defautlMemFunctions.length > 0) {
        return false
      } else {
        return true;
      }

    } catch (e) {
      console.error(e)
      return false;
    }
  }
}

export default NoDefaultMemory;