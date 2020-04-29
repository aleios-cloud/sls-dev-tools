async function getFunctionConfig(lambdaApi, params) {
  return lambdaApi
    .getFunctionConfiguration(params)
    .promise()
    .catch(() => null);
}

async function getFunctionMemoryAndTimeout(lambdaApi, funcName) {
  const params = { FunctionName: funcName };

  const config = await getFunctionConfig(lambdaApi, params);
  if (config) {
    const details = {
      timeout: config.Timeout.toString(),
      memory: config.MemorySize.toString(),
    };
    return details;
  }
  return null;
}

module.exports = {
  getFunctionMemoryAndTimeout,
};
