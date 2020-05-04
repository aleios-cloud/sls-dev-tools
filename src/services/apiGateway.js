class ApiGateway {
  constructor(AWS) {
    this.apiGateway = new AWS.ApiGatewayV2();
  }

  createWebsocket(fullLambda, program) {
    const params = {
      Name: `${fullLambda.FunctionName}-relay`,
      ProtocolType: "WEBSOCKET",
      RouteSelectionExpression: "$request.body.action",
    };
    this.apiGateway.createApi(params, (err, data) => {
      if (err) console.error(err, err.stack);
      else {
        const integrationParams = {
          ApiId: data.ApiId,
          IntegrationType: "AWS_PROXY",
          IntegrationMethod: "POST",
          IntegrationUri: `arn:aws:apigateway:${program.region}:lambda:path/2015-03-31/functions/${fullLambda.FunctionArn}/invocations`,
        };
        this.apiGateway.createIntegration(
          integrationParams,
          (integrationError, integrationData) => {
            if (err) console.error(integrationError, integrationError.stack);
            else console.log(integrationData);
          }
        );
      }
    });
  }
}

module.exports = {
  ApiGateway,
};
