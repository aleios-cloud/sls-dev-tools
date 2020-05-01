const getStackResources = (stackName, cloudformation) =>
  cloudformation
    .listStackResources({ StackName: stackName })
    .promise()
    .catch((error) => {
      console.error(error);
    });

module.exports = {
  getStackResources,
};
