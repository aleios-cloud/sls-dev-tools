async function getLambdaFunctions(lambda) {
  let allFunctions = [];
  let marker;
  let response = { NextMarker: true };
  while (response.NextMarker) {
    // eslint-disable-next-line no-await-in-loop
    response = await lambda
      .listFunctions({
        Marker: marker,
        MaxItems: 50,
      })
      .promise()
      .catch((error) => console.error(error));
    allFunctions = [...allFunctions, ...response.Functions];
    marker = response.NextMarker;
  }
  return allFunctions;
}

module.exports = {
  getLambdaFunctions,
};
