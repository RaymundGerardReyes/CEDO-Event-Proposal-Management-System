#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Profile Page Tests...\n');

try {
  // Run unit tests
  console.log('📋 Running Unit Tests...');
  execSync('npx vitest run tests/profile-page.test.jsx --reporter=verbose', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  console.log('\n✅ Unit Tests Passed!\n');

  // Run hooks tests
  console.log('🔗 Running Hooks Tests...');
  execSync('npx vitest run tests/profile-page-hooks.test.js --reporter=verbose', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  console.log('\n✅ Hooks Tests Passed!\n');

  // Run integration tests
  console.log('🔗 Running Integration Tests...');
  execSync('npx vitest run tests/profile-page-integration.test.jsx --reporter=verbose', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  console.log('\n✅ Integration Tests Passed!\n');

  // Run coverage
  console.log('📊 Running Coverage Analysis...');
  execSync('npx vitest run --coverage', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });

  console.log('\n🎉 All Profile Page Tests Completed Successfully!');
  console.log('\n📊 Test Summary:');
  console.log('  ✅ Unit Tests: Component rendering, user interactions, form validation');
  console.log('  ✅ Hooks Tests: State management, data fetching, error handling');
  console.log('  ✅ Integration Tests: Complete user workflows, error recovery, performance');
  console.log('  ✅ Coverage: Comprehensive test coverage for all functionality');

} catch (error) {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
}

