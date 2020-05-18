import { RELAY_ID } from "../constants";

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
    const ssmRoleName = `${stage}-${Date.now()}`;
    iam.createPolicy(
      {
        PolicyDocument: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "ssm:PutParameter",
                "ssm:GetParameter",
                "execute-api:ManageConnections",
              ],
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

function removeRelayPermissions(lambda, iam, fullLambda) {
  return new Promise((resolve, reject) => {
    lambda.getPolicy(
      { FunctionName: fullLambda.FunctionName },
      (policyError, policyData) => {
        if (policyError) {
          console.error(policyError);
          reject();
        }
        const permissionToRemove = policyData.Statement.filter((permission) =>
          permission.Sid.includes(RELAY_ID)
        );
        const permissionSid = permissionToRemove.Sid;
        lambda.removePermission(
          { FunctionName: fullLambda.FunctionName, StatementId: permissionSid },
          (removeError) => {
            if (removeError) {
              console.error(removeError);
              reject();
            }
          }
        );
      }
    );
    iam.listRoles({}, (listRoleError, listRoleData) => {
      if (listRoleError) {
        console.error(listRoleError, listRoleError.stack);
        reject();
      }
      const lambdaRole = listRoleData.Roles.filter(
        (role) => role.Arn === fullLambda.Role
      );
      iam.listAttachedRolePolicies(
        { RoleName: lambdaRole[0].RoleName },
        (listPolicyError, listPolicyData) => {
          if (listPolicyError) {
            console.error(listPolicyError);
            reject();
          }
          const policyToRemove = listPolicyData.AttachedPolicies.filter(
            (policy) => policy.PolicyName.includes(RELAY_ID)
          );
          const policyArn = policyToRemove[0].PolicyArn;
          const detachRoleParams = {
            RoleName: lambdaRole[0].RoleName,
            PolicyArn: policyArn,
          };
          iam.detachRolePolicy(detachRoleParams, (detachError) => {
            if (detachError) {
              console.error(detachError);
              reject();
            }
            iam.deletePolicy({ PolicyArn: policyArn }, (deleteError) => {
              if (deleteError) {
                console.error(deleteError);
                reject();
              }
              console.log("Relay Permissions Removed");
              resolve();
            });
          });
        }
      );
    });
  });
}

module.exports = {
  addRelayPermissions,
  removeRelayPermissions,
};
