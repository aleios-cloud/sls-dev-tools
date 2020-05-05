import { Loader } from "../components/loader";

async function createRelay(apiGateway, fullLambda, program, screen) {
  console.log("Setting up Relay...");
  const loader = new Loader(screen, 5, 20);
  loader.load("Please wait");
  try {
    const websocketAddress = await apiGateway.createWebsocket(
      fullLambda,
      program
    );
    console.log(websocketAddress);
  } catch (e) {
    console.error("Relay Setup Failure");
  }
  loader.stop();
  loader.destroy();
}

module.exports = {
  createRelay,
};
