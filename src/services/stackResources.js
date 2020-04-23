const getStackResources = (stackName, cloudformation) =>
    cloudformation.listStackResources({ StackName: stackName }).promise();

module.exports = {
    getStackResources,
};
