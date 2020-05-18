function abbreviateFunction(fullFuncName, stackName) {
  return fullFuncName.replace(`${stackName}-`, "");
}

module.exports = {
  abbreviateFunction,
};
