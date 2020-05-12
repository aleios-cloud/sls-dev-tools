import AWS from "aws-sdk";

import { promptMfaModal } from "../modals";

function getAWSCredentials(profile, program, screen) {
  let codeFn;
  if (program.mfa) {
    codeFn = (serial, callback) => callback(null, program.mfa);
  } else if (screen) {
    codeFn = (serial, callback) => promptMfaModal(callback, screen);
  } else {
    codeFn = () =>
      console.error(
        "In-tool mfa authentication isn't supported for guardian. Please provide your mfa token via the --mfa option"
      );
  }

  if (profile) {
    process.env.AWS_SDK_LOAD_CONFIG = 1;
    return new AWS.SharedIniFileCredentials({
      profile,
      tokenCodeFn: codeFn,
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
      tokenCodeFn: codeFn,
      callback: (err) => {
        if (err) {
          console.error(`SharedIniFileCreds Error: ${err}`);
        }
      },
    });
  }
  return new AWS.SharedIniFileCredentials({ profile: "default" });
}

module.exports = {
  getAWSCredentials,
};
