module.exports = {
    testEnvironment: 'node',
    testMatch: [
        '**/tests/**/*.test.js',
        '**/__tests__/**/*.js'
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/'
    ],
    verbose: true,
}; 