class ApiGateway {
  constructor(AWS) {
    this.apiGateway = new AWS.ApiGatewayV2();
  }

  createWebsocket() {
    const params = {
      Name: "STRING_VALUE",
      ProtocolType: "WEBSOCKET",
      RouteSelectionExpression: "$request.body.action",
    };
    this.apiGateway.createApi(params, (err, data) => {
      if (err) console.error(err, err.stack);
      else console.log("WEBSOCKET API CREATED:", data);
    });
  }
}

module.exports = {
  ApiGateway,
};
