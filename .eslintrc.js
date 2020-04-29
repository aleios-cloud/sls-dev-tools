module.exports = {
  env: {
    node: true,
    es6: true,
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
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
    quotes: ["error", "double"],
    "no-console": "off",
    "no-plusplus": "off",
    "no-param-reassign": "off",
    "no-new": "off",
  },
};
