// End-to-End Testing Script
import http from 'http';

const API_BASE = 'http://localhost:5000';
const FRONTEND_BASE = 'http://localhost:5173';

const errors = [];
const tests = [];

function log(test, status, message) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${test}: ${status} - ${message}`;
  console.log(entry);
  tests.push({ test, status, message, timestamp });
  if (status === 'FAILED') {
    errors.push(entry);
  }
}

async function testBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    if (data.status === 'ok') {
      log('Backend Health Check', 'PASSED', 'API is running');
    } else {
      log('Backend Health Check', 'FAILED', 'API returned unexpected status');
    }
  } catch (error) {
    log('Backend Health Check', 'FAILED', `Error: ${error.message}`);
  }
}

async function testAuthEndpoint() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'test123',
        name: 'Test User'
      })
    });
    if (response.ok || response.status === 400) {
      log('Auth Registration', 'PASSED', 'Registration endpoint works (400 OK - user may already exist)');
    } else {
      log('Auth Registration', 'FAILED', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Auth Registration', 'FAILED', `Error: ${error.message}`);
  }
}

async function testResumeEndpoint() {
  try {
    const response = await fetch(`${API_BASE}/api/resume`);
    if (response.ok || response.status === 401) {
      log('Resume Endpoint', 'PASSED', 'Resume endpoint accessible (401 expected without auth)');
    } else {
      log('Resume Endpoint', 'FAILED', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Resume Endpoint', 'FAILED', `Error: ${error.message}`);
  }
}

async function testAlgorankEndpoint() {
  try {
    const response = await fetch(`${API_BASE}/api/algorank/problems?limit=1`);
    if (response.ok) {
      const data = await response.json();
      log('AlgoRank Endpoint', 'PASSED', `Found ${data.pagination?.totalProblems || 0} problems`);
    } else {
      log('AlgoRank Endpoint', 'FAILED', `Status: ${response.status}`);
    }
  } catch (error) {
    log('AlgoRank Endpoint', 'FAILED', `Error: ${error.message}`);
  }
}

async function testSeniorConnectEndpoint() {
  try {
    const response = await fetch(`${API_BASE}/api/connect/sessions`);
    if (response.ok || response.status === 401) {
      log('Senior Connect Endpoint', 'PASSED', 'Sessions endpoint accessible (401 expected without auth)');
    } else {
      log('Senior Connect Endpoint', 'FAILED', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Senior Connect Endpoint', 'FAILED', `Error: ${error.message}`);
  }
}

async function testRoadmapEndpoint() {
  try {
    const response = await fetch(`${API_BASE}/api/roadmaps/templates`);
    if (response.ok) {
      const data = await response.json();
      log('Roadmap Endpoint', 'PASSED', `Found ${data.templates?.length || 0} templates`);
    } else {
      log('Roadmap Endpoint', 'FAILED', `Status: ${response.status}`);
    }
  } catch (error) {
    log('Roadmap Endpoint', 'FAILED', `Error: ${error.message}`);
  }
}

async function runTests() {
  console.log('=== CareerHub End-to-End Testing ===\n');
  
  await testBackendHealth();
  await testAuthEndpoint();
  await testResumeEndpoint();
  await testAlgorankEndpoint();
  await testSeniorConnectEndpoint();
  await testRoadmapEndpoint();
  
  console.log('\n=== Test Summary ===');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${tests.filter(t => t.status === 'PASSED').length}`);
  console.log(`Failed: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n=== Errors ===');
    errors.forEach(error => console.log(error));
  }
  
  // Write to file
  const fs = await import('fs');
  const report = `
=== CareerHub End-to-End Test Report ===
Generated: ${new Date().toISOString()}

=== Test Results ===
Total Tests: ${tests.length}
Passed: ${tests.filter(t => t.status === 'PASSED').length}
Failed: ${errors.length}

=== Detailed Results ===
${tests.map(t => `[${t.timestamp}] ${t.test}: ${t.status} - ${t.message}`).join('\n')}

${errors.length > 0 ? '=== Errors ===\n' + errors.join('\n') : 'No errors found!'}
`;
  
  fs.writeFileSync('test-report.md', report);
  console.log('\nReport saved to test-report.md');
}

runTests().catch(console.error);
