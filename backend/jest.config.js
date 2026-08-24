module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: [
    "<rootDir>/tests"
  ],
  moduleFileExtensions: [
    "ts",
    "js"
  ],
  clearMocks: true,
  testTimeout: 30000
};
