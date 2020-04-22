function invokeLambda(awsLambdaApi, functionName) {
  const params = {
    FunctionName: functionName,
    Qualifier: "LATEST",
  };
  awsLambdaApi.invoke(params, function (err, data) {
    if (err) console.log(err, err.stack);
    // an error occurred
    else console.log(data); // successful response
  });
}

module.exports = {
  invokeLambda,
};
