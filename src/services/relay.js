import { Loader } from "../components/loader";

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

module.exports = {
  createRelay,
};
