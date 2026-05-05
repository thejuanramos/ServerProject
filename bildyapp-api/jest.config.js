export default {
  testEnvironment: 'node',
  transform: {}, // Disable transforms for native ES modules
  globalSetup: './tests/envSetup.js', // We will create this in Step 5
  testMatch: ['**/tests/**/*.test.js'], // Finds your test files
  verbose: true
};