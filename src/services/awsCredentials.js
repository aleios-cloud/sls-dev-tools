import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { promptMfaModal } from "../modals";

async function RoleAssumer(sourceCredentials, params) {
  const client = new STSClient({
    credentials: sourceCredentials,
  });

  const command = new AssumeRoleCommand(params);

  try {
    const response = await client.send(command);
    return {
      expiration: response.Credentials.Expiration,
      accessKeyId: response.Credentials.AccessKeyId,
      secretAccessKey: response.Credentials.SecretAccessKey,
      sessionToken: response.Credentials.SessionToken,
    };
  } catch (e) {
    console.error("Failed to assume role", e);
  }
}

function getAWSCredentials(profile, program, screen) {
  // Define tokenCodeFn for SharedIniFileCredentials:
  // Arguments:
  //  serial - mfa device serial, not used as code is supplied manually
  //  callback - callback function which takes (err, token) as arguments. Here err isn't used as token is entered manually
  let mfaCodeFn;
  if (program.mfa) {
    // If mfa token defined in cli options, supply to callback and run immediately
    mfaCodeFn = (serial, callback) => callback(null, program.mfa);
  } else if (screen) {
    // promptMfaModal allows user to enter token on screen, and runs callback on entry
    mfaCodeFn = (serial, callback) => promptMfaModal(callback, screen);
  } else {
    // If using Guardian and --mfa not supplied
    mfaCodeFn = () =>
      console.error(
        "In-tool mfa authentication isn't supported for guardian. Please provide your mfa token via the --mfa option"
      );
  }

  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_credential_provider_node.html
  //
  // It will attempt to find credentials from the following sources (listed in order of precedence):
  //
  // Environment variables exposed via process.env
  // SSO credentials from token cache
  // Web identity token credentials
  // Shared credentials and config ini files
  // The EC2/ECS Instance Metadata Service
  return defaultProvider({
    profile,
    mfaCodeProvider: mfaCodeFn,
    roleAssumer: RoleAssumer,
  });
}

module.exports = {
  getAWSCredentials,
};
