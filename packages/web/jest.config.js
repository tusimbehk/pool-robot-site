/**
 * Jest configuration for compatibility
 * Primary test runner is Vitest, this is for tooling compatibility
 */

module.exports = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
