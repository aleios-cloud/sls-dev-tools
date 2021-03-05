import YAML from "js-yaml";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

const EXT_TO_PARSER = {
  yml: YAML.load,
  yaml: YAML.load,
  json: JSON.parse,
};

const readConfigFile = (configPath) => {
  const extensions = Object.keys(EXT_TO_PARSER);

  for (let i = 0; i < extensions.length; i++) {
    const pathWithExt = `${configPath}.${extensions[i]}`;

    if (fs.existsSync(pathWithExt)) {
      const file = fs.readFileSync(pathWithExt).toString("utf8");
      return [file, extensions[i], EXT_TO_PARSER[extensions[i]]];
    }
  }

  return [];
};

const resolveYaml = (command, location) =>
  new Promise((resolve) => {
    let result;
    const childProcess = exec(command, { cwd: location });

    childProcess.stdout.on("data", (data) => {
      result = data;
    });

    childProcess.stdout.on("close", () => {
      resolve(result);
    });
  });

export default async function loadConfig({ args, location }) {
  let config;

  const [file, extension, parse] = readConfigFile(
    path.join(location, "serverless")
  );

  if (extension === "json") config = parse(file);

  if (extension === "yml" || extension === "yaml") {
    try {
      const cmd = `serverless print ${args.join(" ")}`;
      const resolvedFile = await resolveYaml(cmd, location);
      config = parse(resolvedFile);
    } catch (error) {
      console.log(error);
    }
  }

  return config;
}
