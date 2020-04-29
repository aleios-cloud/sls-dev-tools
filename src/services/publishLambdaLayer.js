function publishLambdaLayer(lambda, fullFuncName) {
  if (fullFuncName) {
    const params = {
      CompatibleRuntimes: ["nodejs"],
      Content: {
        S3Bucket: "lambda-layers-us-west-2-123456789012",
        S3Key: "layer.zip",
      },
      Description: "A listening layer for faster logs with sls dev tools",
      LayerName: "listening-station",
      LicenseInfo: "MIT",
    };
    console.log(fullFuncName);
    lambda.publishLayerVersion(params, (err, data) => {
      if (err) {
        console.error(err);
      }
      console.log(data);
    });
  }
}

module.exports = {
  publishLambdaLayer,
};
