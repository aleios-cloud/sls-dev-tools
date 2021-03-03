const OPT_REGEX = /\$\{opt:[^{}$]+\}/;
const OPT_REGEX_GLOBAL = /\$\{opt:[^{}$]+\}/g;
const REMOVE_BRACKETS_REGEX = /[${}]/g;

export const CYAN_STRING_FORMAT = "\x1b[36m%s\x1b[0m";

export const transformArgsToDict = (args) => {
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^-+/, "");
    options[key] = args[i + 1];
  }

  return options;
};

export const replaceStacknameOpt = (stackname, cmdOptions) => {
  if (!stackname.match(OPT_REGEX)) return stackname;

  const variables = stackname.match(OPT_REGEX_GLOBAL);

  variables.forEach((variable) => {
    variable = variable.replace(REMOVE_BRACKETS_REGEX, "");
    const varName = variable.split(":")[1];

    if (cmdOptions[varName] === undefined) {
      console.error(
        CYAN_STRING_FORMAT,
        `Your project requires stack name option --${varName} to be passed when starting sls-dev-tools`
      );
      process.exit(9);
    }

    stackname = stackname.replace(OPT_REGEX, cmdOptions[varName]);
  });

  return stackname;
};
