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
                this.apiGateway.createRoute(
                  routeParams,
                  (routeError, routeData) => {
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
                            (deployError, deployData) => {
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
                                    resolve({
                                      Address: `${createData.ApiEndpoint}/${stage}`,
                                      ApiId: createData.ApiId,
                                      IntegrationId:
                                        integrationData.IntegrationId,
                                      RouteId: routeData.RouteId,
                                      StageName: stage,
                                      DeploymentId: deployData.DeploymentId,
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
                );
              }
            }
          );
        }
      });
    });
  }

  deleteWebsocket(fullLambda, socket) {
    const { ApiId } = socket;
    const { DeploymentId } = socket;
    const { IntegrationId } = socket;
    const { RouteId } = socket;
    const { StageName } = socket;
    return new Promise((resolve, reject) => {
      this.ssm.deleteParameter(
        { Name: `${fullLambda.FunctionName}-relay-websocket-endpoint` },
        (ssmError) => {
          if (ssmError) {
            console.error(ssmError);
            reject();
          }
          this.apiGateway.deleteDeployment(
            { ApiId, DeploymentId },
            (deployError) => {
              if (deployError) {
                console.error(deployError);
                reject();
              }
              this.apiGateway.deleteStage(
                { ApiId, StageName },
                (stageError) => {
                  if (stageError) {
                    console.error(stageError);
                    reject();
                  }
                  this.apiGateway.deleteRoute(
                    { ApiId, RouteId },
                    (routeError) => {
                      if (routeError) {
                        console.error(routeError);
                        reject();
                      }
                      this.apiGateway.deleteIntegration(
                        { ApiId, IntegrationId },
                        (integrationError) => {
                          if (integrationError) {
                            console.error(integrationError);
                            reject();
                          }
                          this.apiGateway.deleteApi({ ApiId }, (apiError) => {
                            if (apiError) {
                              console.error(apiError);
                              reject();
                            }
                            console.log("Relay API Removed");
                            resolve();
                          });
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  }
}

module.exports = {
  ApiGateway,
};
