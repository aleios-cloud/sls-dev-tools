import { Loader } from "../components/loader";
import { setupLambdaLayer, removeLambdaLayer } from "./lambdaLayers";
import {
  addRelayPermissions,
  removeRelayPermissions,
} from "./relayPermissions";
import { RELAY_ID } from "../constants";

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
  const stage = `${RELAY_ID}-dev`;
  console.log("Setting up Relay...");
  const loader = new Loader(screen, 5, 20);
  loader.load("Please wait");
  try {
    await addRelayPermissions(lambda, iam, fullLambda, stage);
    await setupLambdaLayer(lambda, fullLambda);
    const websocketDetails = await apiGateway.createWebsocket(
      fullLambda,
      program,
      stage
    );
    const websocketAddress = websocketDetails.Address;
    application.setRelayApis(fullLambda.FunctionName, websocketDetails);
    const relay = new WebSocket(websocketAddress);
    relay.on("open", () => {
      console.log("Warning: Realtime logs will appear faster than CloudWatch");
      application.setRelayActive(fullLambda.FunctionName, true);
    });
    relay.on("message", (data) => {
      if (!application.relayLogs[fullLambda.FunctionName]) {
        application.relayLogs[fullLambda.FunctionName] = [];
      }
      application.relayLogs[fullLambda.FunctionName].push(data);
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

async function takedownRelay(
  fullLambda,
  lambda,
  screen,
  application,
  iam,
  apiGateway
) {
  console.log("Disabling relay...");
  const loader = new Loader(screen, 5, 20);
  loader.load("Please wait");
  try {
    await apiGateway.deleteWebsocket(
      fullLambda,
      application.relayApis[fullLambda.FunctionName]
    );
    await removeLambdaLayer(lambda, fullLambda);
    await removeRelayPermissions(lambda, iam, fullLambda);
    console.log("Relay Successfully Disabled");
    application.setRelayActive(fullLambda.FunctionName, false);
  } catch (e) {
    console.error("Relay Takedown Failure");
    console.error(e);
  }
  loader.stop();
  loader.destroy();
}

module.exports = {
  createRelay,
  takedownRelay,
};
