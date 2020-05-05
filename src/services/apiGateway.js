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
    this.apiGateway.createApi(params, (createError, createData) => {
      if (createError) console.error(createError, createError.stack);
      else {
        const integrationParams = {
          ApiId: createData.ApiId,
          IntegrationType: "AWS_PROXY",
          IntegrationMethod: "POST",
          IntegrationUri: `arn:aws:apigateway:${program.region}:lambda:path/2015-03-31/functions/${fullLambda.FunctionArn}/invocations`,
        };
        this.apiGateway.createIntegration(
          integrationParams,
          (integrationError, integrationData) => {
            if (integrationError)
              console.error(integrationError, integrationError.stack);
            else {
              const routeParams = {
                ApiId: createData.ApiId,
                RouteKey: "$connect",
                Target: `integrations/${integrationData.IntegrationId}`,
              };
              this.apiGateway.createRoute(routeParams, (routeError) => {
                if (routeError) console.error(routeError, routeError.stack);
                else {
                  const stageParams = {
                    ApiId: createData.ApiId,
                    StageName: "relay-dev",
                  };
                  this.apiGateway.createStage(stageParams, (stageError) => {
                    if (stageError) console.error(stageError, stageError.stack);
                    else {
                      const deployParams = {
                        ApiId: createData.ApiId,
                        StageName: "relay-dev",
                      };
                      this.apiGateway.createDeployment(
                        deployParams,
                        (deployError) => {
                          if (deployError)
                            console.log(deployError, deployError.stack);
                          else console.log("Relay API Deployed");
                        }
                      );
                    }
                  });
                }
              });
            }
          }
        );
      }
    });
  }
}

module.exports = {
  ApiGateway,
};
