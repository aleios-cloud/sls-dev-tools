import AWS from "aws-sdk";

import { promptMfaModal } from "../modals";

function getAWSCredentials(
  profile,
  tokenFn = () => console.error("In-tool MFA not supported for Guardian")
) {
  if (profile) {
    process.env.AWS_SDK_LOAD_CONFIG = 1;
    return new AWS.SharedIniFileCredentials({
      profile,
      tokenCodeFn: tokenFn,
      callback: (err) => {
        if (err) {
          console.error(`SharedIniFileCreds Error: ${err}`);
        }
      },
    });
  }
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return new AWS.Credentials({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    });
  }
  if (process.env.AWS_PROFILE) {
    return new AWS.SharedIniFileCredentials({
      profile: process.env.AWS_PROFILE,
      tokenCodeFn: tokenFn,
      callback: (err) => {
        if (err) {
          console.error(`SharedIniFileCreds Error: ${err}`);
        }
      },
    });
  }
  return new AWS.SharedIniFileCredentials({ profile: "default" });
}

function generateTokenFn(screen) {
  return (serial, callback) => promptMfaModal(callback, screen);
}

function getAWSCredentialsHQ(profile, screen) {
  getAWSCredentials(profile, generateTokenFn(screen));
}

module.exports = {
  getAWSCredentials,
  getAWSCredentialsHQ,
};
