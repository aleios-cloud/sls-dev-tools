function addRelayPermissions(lambda, iam, fullLambda, stage) {
  return new Promise((resolve, reject) => {
    lambda.addPermission(
      {
        FunctionName: fullLambda.FunctionArn,
        Action: "lambda:InvokeFunction",
        Principal: "apigateway.amazonaws.com",
        StatementId: `api-gateway-${stage}-${Date.now()}`,
      },
      (permissionError) => {
        if (permissionError) {
          console.error(permissionError);
          reject();
        }
      }
    );
    const ssmRoleName = `${stage}-ssm-${Date.now()}`;
    iam.createPolicy(
      {
        PolicyDocument: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["ssm:PutParameter", "ssm:GetParameter"],
              Resource: "*",
            },
          ],
        }),
        PolicyName: ssmRoleName,
      },
      (policyError, policyData) => {
        if (policyError) {
          console.error(policyError, policyError.stack);
          reject();
        } else {
          iam.listRoles({}, (listError, listData) => {
            if (listError) {
              console.error(listError, listError.stack);
              reject();
            }
            const lambdaRole = listData.Roles.filter(
              (role) => role.Arn === fullLambda.Role
            );
            if (lambdaRole.length === 1) {
              iam.attachRolePolicy(
                {
                  PolicyArn: policyData.Policy.Arn,
                  RoleName: lambdaRole[0].RoleName,
                },
                (attachError) => {
                  if (attachError) {
                    console.error(attachError, attachError.stack);
                    reject();
                  }
                  console.log("Relay Permissions Added");
                  resolve();
                }
              );
            } else {
              console.error("Cannot find lambda role");
              reject();
            }
          });
        }
      }
    );
  });
}

module.exports = {
  addRelayPermissions,
};
