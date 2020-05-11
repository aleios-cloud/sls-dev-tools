function invokeLambda(awsLambdaApi, functionName, payload) {
  const params = {
    FunctionName: functionName,
    Qualifier: "$LATEST",
    Payload: payload,
  };
  awsLambdaApi.invoke(params, (err, data) => {
    if (err) console.error(err, err.stack);
    // an error occurred
    else console.log(data); // successful response
  });
}

module.exports = {
  invokeLambda,
};
