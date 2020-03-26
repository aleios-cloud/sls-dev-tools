module.exports = {
  collectCoverageFrom: [
    '.',
  ],
  coverageThreshold: {
    global: {
      statements: 0,
      branches: 0,
      functions: 0,
      lines: 0,
    },
  },
  testRegex: './*.test.js$',
  moduleFileExtensions: ['js', 'ts', 'tsx', 'jsx', 'json'],
};
