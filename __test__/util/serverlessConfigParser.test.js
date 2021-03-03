import fs from "fs";

import {
  transformArgsToDict,
  replaceStacknameOpt,
  CYAN_STRING_FORMAT,
} from "../../src/services/severlessConfigParser/helpers";
import ServerlessConfigParser from "../../src/services/severlessConfigParser/serverlessConfigParser";

const TEST_YAML_FILE_EMPTY = "";
const TEST_YAML_FILE = `
service:
  name: test-\${opt:testArg1}

provider:
  name: aws
  runtime: nodejs10.x
  region: eu-west-1
  stage: \${opt:stage, 'dev'}

functions:
  hello:
    handler: hello.main
    memorySize: 1024
    timeout: 6
    events:
      - http:
          method: get
          path: hello
          authorizer:
            type: COGNITO_USER_POOLS
            authorizerId:
              Ref: ApiGatewayAuthorizer
`;

// eslint-disable-next-line no-template-curly-in-string
const STACK_NAME_OPT = "test-${opt:testArg1}";
// eslint-disable-next-line no-template-curly-in-string
const STACK_NAME_MANY_OPTS = "test-${opt:testArg1}-${opt:testArg2}";
const STACK_NAME_MANY_NO_OPTS = "test-backend-arg2";
const STACK_NAME_NO_OPT = "test-backend";
const CMD_VAR_1 = "--testArg1";
const CMD_VAL_1 = "backend";
const CMD_VAR_2 = "-testArg2";
const CMD_VAL_2 = "arg2";
const INVALID_ARGUMENT_EXIT_CODE = 9;

const setupConfigParser = (yamlFileString) => {
  fs.readFileSync.mockReturnValue(yamlFileString);
  fs.existsSync.mockReturnValue(true);

  const program = {
    args: [CMD_VAR_1, CMD_VAL_1],
    location: "~/Dev/testProject/backend",
  };

  return new ServerlessConfigParser(program);
};

jest.mock("fs");

describe("Serverless Config Options", () => {
  /*
   * Transform Args
   */
  it("should transform 1 arg (double dash) to dict", () => {
    const args = [CMD_VAR_1, CMD_VAL_1];
    const result = { testArg1: CMD_VAL_1 };
    expect(transformArgsToDict(args)).toStrictEqual(result);
  });

  it("should transform 1 arg (single dash) to dict", () => {
    const args = [CMD_VAR_2, CMD_VAL_2];
    const result = { testArg2: CMD_VAL_2 };
    expect(transformArgsToDict(args)).toStrictEqual(result);
  });

  it("should not remove dashes from middle of option in service name", () => {
    const args = ["--env-name", CMD_VAL_1];
    const result = { "env-name": CMD_VAL_1 };
    expect(transformArgsToDict(args)).toStrictEqual(result);
  });

  it("should transform multiple args (mixed dash) to dict", () => {
    const args = [CMD_VAR_1, CMD_VAL_1, CMD_VAR_2, CMD_VAL_2];
    const result = {
      testArg1: CMD_VAL_1,
      testArg2: CMD_VAL_2,
    };
    expect(transformArgsToDict(args)).toStrictEqual(result);
  });

  /*
   * Replace service.name Opt
   */
  it("should replace the service name option with stored option", () => {
    const testOptions = { testArg1: CMD_VAL_1 };
    expect(replaceStacknameOpt(STACK_NAME_OPT, testOptions)).toBe(
      STACK_NAME_NO_OPT
    );
  });

  it("should replace multiple service name option with their respective stored options", () => {
    const testOptions = { testArg1: CMD_VAL_1, testArg2: CMD_VAL_2 };
    expect(replaceStacknameOpt(STACK_NAME_MANY_OPTS, testOptions)).toBe(
      STACK_NAME_MANY_NO_OPTS
    );
  });

  it("should not replace the stack name where there is not opt variable in the YAML configuration file", () => {
    const testOptions = { testArg1: CMD_VAL_1 };
    expect(replaceStacknameOpt(STACK_NAME_NO_OPT, testOptions)).toBe(
      STACK_NAME_NO_OPT
    );
  });

  it("should output an error message when an opt varibale exists in serverless configuration but no option is passed", () => {
    console.error = jest.fn();
    process.exit = jest.fn();
    replaceStacknameOpt(STACK_NAME_OPT, []);

    expect(console.error).toHaveBeenCalledWith(
      CYAN_STRING_FORMAT,
      `Your project requires stack name option ${CMD_VAR_1} to be passed when starting sls-dev-tools`
    );
    expect(process.exit).toHaveBeenCalledWith(INVALID_ARGUMENT_EXIT_CODE);
  });
});

describe("Serverless Config Parsing", () => {
  it("should read YAML file and replace opt in service.name with stored arg", () => {
    const SLS = setupConfigParser(TEST_YAML_FILE);
    expect(SLS.getStackName("dev")).toBe("test-backend-dev");
  });

  it("should get a stackname given a stage", () => {
    const SLS = setupConfigParser(TEST_YAML_FILE);
    const stage = "test";
    expect(SLS.getStackName(stage)).toBe("test-backend-test");
  });

  it("should continue as normal when YAML file is empty", () => {
    const SLS = setupConfigParser(TEST_YAML_FILE_EMPTY);
    expect(SLS.getStage()).toBe("dev");
    expect(SLS.getStackName("dev")).toBe(null);
    expect(SLS.getRegion()).toBe(null);
  });
});
