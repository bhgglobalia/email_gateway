const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "\\.(css|scss|sass)$": "identity-obj-proxy",
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/{app,components,pages,lib,hooks,providers,store}/**/*.{js,ts,jsx,tsx}",
    "!<rootDir>/**/__tests__/**",
    "!<rootDir>/**/*.test.*",
    "!<rootDir>/**/*.spec.*",
    "!<rootDir>/**/index.{js,ts,jsx,tsx}",
    "!<rootDir>/**/*.d.ts",
    // Exclude Next.js boilerplate layout/page files from coverage
    "!<rootDir>/app/layout.{js,ts,jsx,tsx}",
    "!<rootDir>/app/page.{js,ts,jsx,tsx}",
    "!<rootDir>/app/**/layout.{js,ts,jsx,tsx}",
    "!<rootDir>/app/**/page.{js,ts,jsx,tsx}",
  ],
};

module.exports = createJestConfig(customJestConfig);
