const ASYNC_AWS_SERVICES = ["events", "s3", "sqs", "sns"];

const getAwsServiceFromArn = (arn) => arn.split(":")[2];

const isLambdaPolicyAsync = (policy) => {
  const sourceArns = policy.Statement.map(
    (statement) => statement.Condition.ArnLike["AWS:SourceArn"]
  );
  return sourceArns.some((sourceArn) =>
    ASYNC_AWS_SERVICES.includes(getAwsServiceFromArn(sourceArn))
  );
};

class FailDestination {
  constructor(AWS, stackName, stackFunctions, SLS) {
    this.name = "no-default-timeout";
    this.AWS = AWS;
    this.stackName = stackName;
    this.stackFunctions = stackFunctions;
    this.result = false;
    this.defaultTimeoutAWS = 3;
    this.defaultTimeoutServerlessFramework = 6;
    this.failingResources = [];
    this.SLS = SLS;
    this.failureMessage =
      "The following asynchroneous functions have no destination configured on-failure.";
    this.rulePage = "***RulePage***";
    this.lambda = new this.AWS.Lambda();
  }

  async run() {
    try {
      this.result = false;

      const stackLambdaPolicies = await Promise.all(
        this.stackFunctions.map(({ FunctionName }) =>
          this.lambda
            .getPolicy({
              FunctionName,
            })
            .promise()
            .then((policy) => ({ ...policy, FunctionName }))
            .catch(() => {})
        )
      );

      const asyncFunctionsNames = stackLambdaPolicies
        .filter(
          (policy) =>
            policy !== undefined &&
            isLambdaPolicyAsync(JSON.parse(policy.Policy))
        )
        .map((policy) => policy.FunctionName);

      const invokeEventConfigs = await Promise.all(
        asyncFunctionsNames.map((FunctionName) =>
          this.lambda
            .getFunctionEventInvokeConfig({
              FunctionName,
            })
            .promise()
            .then((invokeEventConfig) => ({
              ...invokeEventConfig,
              FunctionName,
            }))
            .catch(() => ({ FunctionName }))
        )
      );

      this.failingResources = invokeEventConfigs
        .filter(
          (invokeEventConfig) =>
            invokeEventConfig.DestinationConfig === undefined ||
            invokeEventConfig.DestinationConfig.OnFailure.destination === null
        )
        .map(({ FunctionName }) => ({
          FunctionName,
        }));
      this.result = this.failingResources.length === 0;
    } catch (e) {
      console.error(e);
    }
    return this.result;
  }
}

export default FailDestination;
