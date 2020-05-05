class ApiGateway {
  constructor(AWS, lambda) {
    this.apiGateway = new AWS.ApiGatewayV2();
    this.lambda = lambda;
  }

  createWebsocket(fullLambda, program) {
    const stage = "relay-dev";
    return new Promise((resolve, reject) => {
      this.lambda.addPermission(
        {
          FunctionName: fullLambda.FunctionArn,
          Action: "lambda:InvokeFunction",
          Principal: "apigateway.amazonaws.com",
          StatementId: `${stage}-${Date.now()}`,
        },
        (permissionError) => {
          if (permissionError) {
            console.error(permissionError);
            reject();
          }
        }
      );
      const params = {
        Name: `${fullLambda.FunctionName}-${stage}`,
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
              if (integrationError) {
                console.error(integrationError, integrationError.stack);
                reject();
              } else {
                const routeParams = {
                  ApiId: createData.ApiId,
                  RouteKey: "$connect",
                  Target: `integrations/${integrationData.IntegrationId}`,
                };
                this.apiGateway.createRoute(routeParams, (routeError) => {
                  if (routeError) {
                    console.error(routeError, routeError.stack);
                    reject();
                  } else {
                    const stageParams = {
                      ApiId: createData.ApiId,
                      StageName: stage,
                    };
                    this.apiGateway.createStage(stageParams, (stageError) => {
                      if (stageError) {
                        console.error(stageError, stageError.stack);
                        reject();
                      } else {
                        const deployParams = {
                          ApiId: createData.ApiId,
                          StageName: stage,
                        };
                        this.apiGateway.createDeployment(
                          deployParams,
                          (deployError) => {
                            if (deployError) {
                              console.error(deployError, deployError.stack);
                              reject();
                            } else {
                              console.log("Relay API Deployed");
                              resolve(`${createData.ApiEndpoint}/${stage}`);
                            }
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
    });
  }
}

module.exports = {
  ApiGateway,
};
