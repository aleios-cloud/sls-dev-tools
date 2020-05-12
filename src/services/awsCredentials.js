import AWS from "aws-sdk";

import { promptMfaModal } from "../modals";

function getMfaToken(serial, callback) {
  promptMfaModal(callback, this.screen);
}

function getAWSCredentials(profile) {
  if (profile) {
    process.env.AWS_SDK_LOAD_CONFIG = 1;
    return new AWS.SharedIniFileCredentials({
      profile,
      tokenCodeFn: getMfaToken,
      callback: (err) => {
        if (err) {
          console.error(`SharedIniFileCreds Error: ${err}`);
          process.exit(0);
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
      tokenCodeFn: getMfaToken,
      callback: (err) => {
        if (err) {
          console.error(`SharedIniFileCreds Error: ${err}`);
          process.exit(0);
        }
      },
    });
  }
  return new AWS.SharedIniFileCredentials({ profile: "default" });
}

module.exports = {
  getAWSCredentials,
};
