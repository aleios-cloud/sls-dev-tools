const replaceVariablesInYml = (config, cmdOptions) => {
  const optRegex = /\$\{opt:.*\}/;

  if (config.service.name.match(optRegex)) {
    let variable = config.service.name.match(optRegex)[0];

    variable = variable.replace(/[${}]/g, "");
    const varName = variable.split(":")[1];

    config.service.name = config.service.name.replace(
      /\$\{opt:.*\}/,
      cmdOptions[varName]
    );
  }
};

export default replaceVariablesInYml;
