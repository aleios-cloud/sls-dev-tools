import { getStackResources } from "../../../../services/stackResources";

class NoDefaultMemory {
  constructor(AWS, stackName) { 
        this.name = "no-default-memory"
        this.AWS = AWS;
        this.stackName = stackName;
    }

    async run() {
        try {
          const cloudformation = new this.AWS.CloudFormation();
          const stackResources = await getStackResources(this.stackName, cloudformation);
          // console.log(stackResources)
          const lambdaFunctionResources = stackResources.StackResourceSummaries.filter(
              (res) => {
                return res.ResourceType === "AWS::Lambda::Function";
              }
            );
          // console.log(lambdaFunctionResources[0].DriftInformation);
          return true;
        } catch (e) {
          return false;
        }
    }
}

export default NoDefaultMemory;