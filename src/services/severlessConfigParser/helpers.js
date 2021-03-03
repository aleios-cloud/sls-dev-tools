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
  const optRegex = /\$\{opt:.*\}/;

  if (!stackname.match(optRegex)) return stackname;

  let variable = stackname.match(optRegex)[0];

  variable = variable.replace(/[${}]/g, "");
  const varName = variable.split(":")[1];

  if (cmdOptions[varName] === undefined) {
    console.error(
      CYAN_STRING_FORMAT,
      `Your project requires stack name option --${varName} to be passed when starting sls-dev-tools`
    );
    process.exit(9);
  }

  return stackname.replace(/\$\{opt:.*\}/, cmdOptions[varName]);
};
