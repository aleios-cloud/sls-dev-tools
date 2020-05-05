const fs = require("fs");

function addLayerToLambda(lambdaApi, functionName, layerArn, callback) {
  const params = {
    FunctionName: functionName,
    Layers: [layerArn],
  };
  lambdaApi.updateFunctionConfiguration(params, callback);
}

function createAndAddLambdaLayer(lambdaApi, functionName, callback) {
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

  lambdaApi.publishLayerVersion(params, (err, layer) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Layer uploaded. Adding to function...");
      const arn = layer.LayerVersionArn;
      addLayerToLambda(lambdaApi, functionName, arn, callback);
    }
  });
}

module.exports = {
  createAndAddLambdaLayer,
};
