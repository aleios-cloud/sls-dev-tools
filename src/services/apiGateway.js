class ApiGateway {
  constructor(AWS) {
    this.apiGateway = new AWS.ApiGatewayV2();
    this.ssm = new AWS.SSM();
  }

  createWebsocket(fullLambda, program, stage) {
    return new Promise((resolve, reject) => {
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
                              const ssmParams = {
                                Name: `${fullLambda.FunctionName}-relay-websocket-endpoint`,
                                Value: `${createData.ApiId}.execute-api.${program.region}.amazonaws.com/${stage}`,
                                Type: "String",
                                Overwrite: true,
                              };
                              this.ssm.putParameter(ssmParams, (ssmError) => {
                                if (ssmError) {
                                  console.log(ssmError, ssmError.stack);
                                  reject();
                                } else {
                                  console.log("Relay API Deployed");
                                  resolve(`${createData.ApiEndpoint}/${stage}`);
                                }
                              });
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
