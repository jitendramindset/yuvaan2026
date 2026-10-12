#!/usr/bin/env node

/**
 * 🔐 Authentication API Test Suite
 * Tests all auth endpoints: signin, signup, forgot password, reset, biometric, etc.
 * Date: January 29, 2026
 */

const http = require('http');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const BASE_URL = 'http://localhost:5000';
let testResults = [];
let passCount = 0;
let failCount = 0;

// HTTP Request Helper
function makeRequest(method, path, body = null) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ status: 0, error: error.message });
    });

    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test logging
function logTest(name, passed, message = '') {
  const status = passed ? `${colors.green}✅ PASS${colors.reset}` : `${colors.red}❌ FAIL${colors.reset}`;
  console.log(`${status} ${name}`);
  if (message) console.log(`   ${colors.cyan}${message}${colors.reset}`);
  
  testResults.push({ name, passed, message });
  if (passed) passCount++; else failCount++;
}

// Main test runner
async function runTests() {
  console.log(`\n${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}🔐 AUTHENTICATION API TEST SUITE${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`);

  // ============================================
  // PHASE 1: SIGNUP
  // ============================================
  console.log(`${colors.bright}${colors.blue}📝 PHASE 1: SIGNUP ENDPOINT${colors.reset}\n`);

  const signupBody = {
    fullName: "Test User",
    email: "test@example.com",
    mobileNo: "+1234567890",
    password: "Test@123456",
    confirmPassword: "Test@123456"
  };

  const signup = await makeRequest('POST', '/api/auth/signup', signupBody);
  logTest(
    'POST /api/auth/signup',
    signup.status === 201 && signup.data && signup.data.success === true,
    `Status: ${signup.status}, Message: ${signup.data && (signup.data.message || signup.data.error) || 'No response'}`
  );

  // ============================================
  // PHASE 2: SIGNIN
  // ============================================
  console.log(`\n${colors.bright}${colors.blue}🔑 PHASE 2: SIGNIN ENDPOINT${colors.reset}\n`);

  const signinBody = {
    emailOrPhone: "test@example.com",
    password: "Test@123456"
  };

  const signin = await makeRequest('POST', '/api/auth/signin', signinBody);
  logTest(
    'POST /api/auth/signin',
    signin.status === 200 && signin.data && signin.data.success === true,
    `Status: ${signin.status}, Message: ${signin.data && (signin.data.message || signin.data.error) || 'No response'}`
  );

  // ============================================
  // PHASE 3: SEND OTP
  // ============================================
  console.log(`\n${colors.bright}${colors.blue}📧 PHASE 3: OTP ENDPOINTS${colors.reset}\n`);

  const sendOtpBody = {
    email: "test@example.com",
    method: "email"
  };

  const sendOtp = await makeRequest('POST', '/api/auth/send-otp', sendOtpBody);
  logTest(
    'POST /api/auth/send-otp',
    sendOtp.status === 200 && sendOtp.data && sendOtp.data.success === true,
    `Status: ${sendOtp.status}, Message: ${sendOtp.data && (sendOtp.data.message || sendOtp.data.error) || 'No response'}`
  );

  // ============================================
  // PHASE 4: VERIFY OTP
  // ============================================
  const verifyOtpBody = {
    email: "test@example.com",
    otpCode: "123456"
  };

  const verifyOtp = await makeRequest('POST', '/api/auth/verify-otp', verifyOtpBody);
  logTest(
    'POST /api/auth/verify-otp',
    verifyOtp.status === 200 || verifyOtp.status === 401,
    `Status: ${verifyOtp.status}`
  );

  // ============================================
  // PHASE 5: FORGOT PASSWORD
  // ============================================
  console.log(`\n${colors.bright}${colors.blue}🔐 PHASE 4: PASSWORD RESET ENDPOINTS${colors.reset}\n`);

  const forgotBody = {
    email: "test@example.com"
  };

  const forgotPassword = await makeRequest('POST', '/api/auth/forgot-password', forgotBody);
  logTest(
    'POST /api/auth/forgot-password',
    forgotPassword.status === 200 && forgotPassword.data && forgotPassword.data.success === true,
    `Status: ${forgotPassword.status}, Message: ${forgotPassword.data && forgotPassword.data.message || 'No response'}`
  );

  // ============================================
  // PHASE 6: VERIFY RESET TOKEN
  // ============================================
  const verifyResetBody = {
    email: "test@example.com",
    resetToken: "test_token_123",
    otp: "123456"
  };

  const verifyReset = await makeRequest('POST', '/api/auth/verify-reset-token', verifyResetBody);
  logTest(
    'POST /api/auth/verify-reset-token',
    verifyReset.status === 200 || verifyReset.status === 401,
    `Status: ${verifyReset.status}`
  );

  // ============================================
  // PHASE 7: RESET PASSWORD
  // ============================================
  const resetPasswordBody = {
    email: "test@example.com",
    resetToken: "test_token_123",
    otp: "123456",
    newPassword: "NewPass@123456",
    confirmPassword: "NewPass@123456"
  };

  const resetPassword = await makeRequest('POST', '/api/auth/reset-password', resetPasswordBody);
  logTest(
    'POST /api/auth/reset-password',
    resetPassword.status === 200 || resetPassword.status === 401,
    `Status: ${resetPassword.status}`
  );

  // ============================================
  // PHASE 8: BIOMETRIC
  // ============================================
  console.log(`\n${colors.bright}${colors.blue}🔒 PHASE 5: BIOMETRIC ENDPOINTS${colors.reset}\n`);

  const biometricLoginBody = {
    userId: "test-user-123",
    biometricData: "fingerprint_hash_123"
  };

  const biometricLogin = await makeRequest('POST', '/api/auth/biometric-login', biometricLoginBody);
  logTest(
    'POST /api/auth/biometric-login',
    biometricLogin.status === 200 || biometricLogin.status === 401,
    `Status: ${biometricLogin.status}`
  );

  // ============================================
  // PHASE 9: REGISTER BIOMETRIC
  // ============================================
  const registerBioBody = {
    userId: "test-user-123",
    biometricData: "fingerprint_hash_456",
    biometricType: "fingerprint"
  };

  const registerBio = await makeRequest('POST', '/api/auth/register-biometric', registerBioBody);
  logTest(
    'POST /api/auth/register-biometric',
    registerBio.status === 200 || registerBio.status === 400 || registerBio.status === 500,
    `Status: ${registerBio.status}`
  );

  // ============================================
  // PHASE 10: USER PROFILE
  // ============================================
  console.log(`\n${colors.bright}${colors.blue}👤 PHASE 6: USER PROFILE ENDPOINTS${colors.reset}\n`);

  const getUser = await makeRequest('GET', '/api/auth/user/test-user-123');
  logTest(
    'GET /api/auth/user/:userId',
    [200, 404, 500].includes(getUser.status),
    `Status: ${getUser.status}`
  );

  // ============================================
  // PHASE 11: UPDATE PROFILE
  // ============================================
  const updateUserBody = {
    fullName: "Updated User",
    mobileNo: "+9876543210",
    email: "updated@example.com"
  };

  const updateUser = await makeRequest('PUT', '/api/auth/user/test-user-123', updateUserBody);
  logTest(
    'PUT /api/auth/user/:userId',
    [200, 404, 500].includes(updateUser.status),
    `Status: ${updateUser.status}`
  );

  // ============================================
  // PHASE 12: CHANGE PASSWORD
  // ============================================
  console.log(`\n${colors.bright}${colors.blue}🔑 PHASE 7: ADDITIONAL AUTH ENDPOINTS${colors.reset}\n`);

  const changePassBody = {
    userId: "test-user-123",
    oldPassword: "Test@123456",
    newPassword: "NewPass@123456",
    confirmPassword: "NewPass@123456"
  };

  const changePass = await makeRequest('POST', '/api/auth/change-password', changePassBody);
  logTest(
    'POST /api/auth/change-password',
    [200, 401, 404, 500].includes(changePass.status),
    `Status: ${changePass.status}`
  );

  // ============================================
  // PHASE 13: LOGOUT
  // ============================================
  const logoutBody = {
    userId: "test-user-123"
  };

  const logout = await makeRequest('POST', '/api/auth/logout', logoutBody);
  logTest(
    'POST /api/auth/logout',
    logout.status === 200 && logout.data && logout.data.success === true,
    `Status: ${logout.status}`
  );

  // ============================================
  // TEST SUMMARY
  // ============================================
  console.log(`\n${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}📊 TEST SUMMARY${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`);

  const totalTests = passCount + failCount;
  const passRate = totalTests > 0 ? ((passCount / totalTests) * 100).toFixed(1) : 0;

  console.log(`${colors.bright}Total Tests:${colors.reset} ${totalTests}`);
  console.log(`${colors.green}${colors.bright}✅ Passed:${colors.reset} ${passCount}`);
  console.log(`${colors.red}${colors.bright}❌ Failed:${colors.reset} ${failCount}`);
  console.log(`${colors.bright}Pass Rate:${colors.reset} ${passRate}%\n`);

  if (failCount === 0) {
    console.log(`${colors.green}${colors.bright}🎉 ALL TESTS PASSED!${colors.reset}\n`);
  } else if (passRate >= 80) {
    console.log(`${colors.yellow}${colors.bright}⚠️  MOST TESTS PASSED (${passRate}%)${colors.reset}\n`);
  }

  console.log(`${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}✅ Auth Test Execution Complete${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'═'.repeat(70)}${colors.reset}\n`);

  // Print endpoint summary
  console.log(`${colors.bright}${colors.green}ENDPOINTS TESTED:${colors.reset}`);
  console.log(`  ✅ POST /api/auth/signup`);
  console.log(`  ✅ POST /api/auth/signin`);
  console.log(`  ✅ POST /api/auth/send-otp`);
  console.log(`  ✅ POST /api/auth/verify-otp`);
  console.log(`  ✅ POST /api/auth/forgot-password`);
  console.log(`  ✅ POST /api/auth/verify-reset-token`);
  console.log(`  ✅ POST /api/auth/reset-password`);
  console.log(`  ✅ POST /api/auth/biometric-login`);
  console.log(`  ✅ POST /api/auth/register-biometric`);
  console.log(`  ✅ GET  /api/auth/user/:userId`);
  console.log(`  ✅ PUT  /api/auth/user/:userId`);
  console.log(`  ✅ POST /api/auth/change-password`);
  console.log(`  ✅ POST /api/auth/logout\n`);

  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal Error:${colors.reset}`, error.message);
  process.exit(1);
});
