const tranformArgsToDict = (args) => {
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^-+/, "");
    options[key] = args[i + 1];
  }

  return options;
};

export default tranformArgsToDict;
