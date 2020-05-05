import { Loader } from "../components/loader";
import { createAndAddLambdaLayer } from "./lambdaLayers";

const WebSocket = require("ws");

async function createRelay(apiGateway, fullLambda, program, screen) {
  console.log("Setting up Relay...");
  const loader = new Loader(screen, 5, 20);
  loader.load("Please wait");
  try {
    const websocketAddress = await apiGateway.createWebsocket(
      fullLambda,
      program
    );
    const relay = new WebSocket(websocketAddress);
    relay.on("open", () => {
      console.log("Warning: Realtime logs will appear faster than CloudWatch");
    });
    relay.on("message", (data) => {
      console.log(data);
    });
    relay.on("close", () => {
      console.log("Relay Closed");
    });
    relay.on("error", console.error);
  } catch (e) {
    console.error("Relay Setup Failure");
  }
  loader.stop();
  loader.destroy();
}

async function setupLambdaLayer(screen, lambdaApi, functionName) {
  console.log("Uploading Lamba Layer...");
  const loader = new Loader(screen, 5, 20);
  loader.load("Please wait");
  const callback = (err, updatedConfig) => {
    if (err) {
      console.error(err);
    } else {
      console.log(
        `Layer ${updatedConfig.Layers[0].Arn} added to function ${updatedConfig.FunctionName}`
      );
      loader.stop();
      loader.destroy();
    }
  };
  createAndAddLambdaLayer(lambdaApi, functionName, callback);
}

module.exports = {
  createRelay,
  setupLambdaLayer,
};
