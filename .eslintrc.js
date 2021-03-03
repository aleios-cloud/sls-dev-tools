module.exports = {
  env: {
    node: true,
    es6: true,
    "jest/globals": true,
  },
  extends: ["airbnb-base", "prettier"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: ["prettier", "jest"],
  rules: {
    "prettier/prettier": "error",
    quotes: ["error", "double"],
    "no-console": "off",
    "no-plusplus": "off",
    "no-param-reassign": "off",
    "no-new": "off",
    "import/named": "off",
    "import/no-cycle": "off",
    // jest
    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/prefer-to-have-length": "warn",
    "jest/valid-expect": "error",
  },
};
