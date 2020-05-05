const fs = require("fs");

function addLayerToLambda(lambdaApi, functionName, layerArn, resolve, reject) {
  const params = {
    FunctionName: functionName,
    Layers: [layerArn],
  };
  lambdaApi.updateFunctionConfiguration(params, (err) => {
    if (err) {
      console.error(err);
      reject();
    }
    console.log("Relay layer added");
    resolve();
  });
}

function createAndAddLambdaLayer(lambdaApi, functionName) {
  console.log("Uploading Lamba Layer...");
  let data;
  try {
    data = fs.readFileSync("src/resources/layer.zip");
  } catch (err) {
    console.error(err);
  }

  const params = {
    Content: {
      ZipFile: data,
    },
    LayerName: "test-node10-layer",
  };
  return new Promise((resolve, reject) => {
    lambdaApi.publishLayerVersion(params, (err, layer) => {
      if (err) {
        console.error(err);
        reject();
      } else {
        console.log("Layer uploaded. Adding to function...");
        const arn = layer.LayerVersionArn;
        addLayerToLambda(lambdaApi, functionName, arn, resolve, reject);
      }
    });
  });
}

module.exports = {
  createAndAddLambdaLayer,
};
