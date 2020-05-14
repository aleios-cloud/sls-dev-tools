const fs = require("fs");

function addLayerToLambda(
  lambdaApi,
  functionConfig,
  layerArn,
  resolve,
  reject
) {
  const layers = functionConfig.Layers;
  let layerArns;
  if (layers) {
    layerArns = layers.map((layer) => layer.Arn);
  } else {
    layerArns = [];
  }
  layerArns.push(layerArn);
  const params = {
    FunctionName: functionConfig.FunctionName,
    Layers: layerArns,
    Runtime: "provided",
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

function createAndAddLambdaLayer(lambdaApi, functionConfig, resolve, reject) {
  console.log("Uploading Lamba Layer...");
  let data;
  try {
    data = fs.readFileSync("resources/layer.zip");
  } catch (err) {
    console.error(err);
    reject();
  }

  const params = {
    Content: {
      ZipFile: data,
    },
    CompatibleRuntimes: [functionConfig.Runtime],
    LayerName: "test-node10-layer",
  };

  lambdaApi.publishLayerVersion(params, (err, layer) => {
    if (err) {
      console.error(err);
      reject();
    } else {
      console.log("Layer uploaded. Adding to function...");
      const arn = layer.LayerVersionArn;
      addLayerToLambda(lambdaApi, functionConfig, arn, resolve, reject);
    }
  });
}

function setupLambdaLayer(lambdaApi, functionConfig) {
  // TODO: Determine required layer name using function runtime
  const requiredLayerName = "test-node10-layer";
  console.log("Searching for existing layer");
  const params = {
    CompatibleRuntime: functionConfig.Runtime,
  };
  return new Promise((resolve, reject) => {
    lambdaApi.listLayers(params, (err, data) => {
      if (err) {
        console.error(err);
        reject();
      } else {
        const layerFound = data.Layers.some((layer) => {
          if (layer.LayerName === requiredLayerName) {
            console.log("Existing layer found. Adding to function...");
            addLayerToLambda(
              lambdaApi,
              functionConfig,
              layer.LatestMatchingVersion.LayerVersionArn,
              resolve,
              reject
            );
            return true;
          }
          return false;
        });
        if (!layerFound) {
          console.log("No existing layer found");
          createAndAddLambdaLayer(lambdaApi, functionConfig, resolve, reject);
        }
      }
    });
  });
}

function resetLambdaLayers(lambdaApi, layers, lambdaName) {
  const params = {
    FunctionName: lambdaName,
    Runtime: "nodejs10.x",
    Layers: layers,
  };
  return new Promise((resolve, reject) => {
    lambdaApi.updateFunctionConfiguration(params, (err, data) => {
      if (err) {
        console.error(err);
        reject();
      }
      console.log(data);
      resolve();
    });
  });
}

module.exports = {
  resetLambdaLayers,
  setupLambdaLayer,
};
