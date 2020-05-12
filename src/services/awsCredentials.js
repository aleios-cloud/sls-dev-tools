import AWS from "aws-sdk";

import { promptMfaModal } from "../modals";

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

  if (profile) {
    process.env.AWS_SDK_LOAD_CONFIG = 1;
    return new AWS.SharedIniFileCredentials({
      profile,
      tokenCodeFn: mfaCodeFn,
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
      tokenCodeFn: mfaCodeFn,
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
