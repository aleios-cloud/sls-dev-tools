import { Loader } from "../components/loader";
import { createAndAddLambdaLayer } from "./lambdaLayers";
import { addRelayPermissions } from "./relayPermissions";

const WebSocket = require("ws");

async function createRelay(
  apiGateway,
  fullLambda,
  program,
  screen,
  lambda,
  iam,
  application
) {
  const stage = "relay-dev";
  console.log("Setting up Relay...");
  const loader = new Loader(screen, 5, 20);
  loader.load("Please wait");
  try {
    await addRelayPermissions(lambda, iam, fullLambda, stage);
    await createAndAddLambdaLayer(lambda, fullLambda.FunctionName);
    const websocketAddress = await apiGateway.createWebsocket(
      fullLambda,
      program,
      stage
    );
    const relay = new WebSocket(websocketAddress);
    relay.on("open", () => {
      console.log("Warning: Realtime logs will appear faster than CloudWatch");
      application.setRelayActive(true);
      application.lambdaLog.setContent("");
    });
    relay.on("message", (data) => {
      application.lambdaLog.log(data);
    });
    relay.on("close", () => {
      console.log("Relay Closed");
    });
    relay.on("error", console.error);
  } catch (e) {
    console.error("Relay Setup Failure");
    console.error(e);
  }
  loader.stop();
  loader.destroy();
}

module.exports = {
  createRelay,
};
