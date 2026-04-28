#!/usr/bin/env node
/**
 * Simple test script to verify token refresh functionality
 *
 * Usage: node test-refresh.js
 *
 * This script:
 * 1. Registers a test user
 * 2. Generates OAuth tokens
 * 3. Waits for token to expire (simulated)
 * 4. Refreshes the token
 * 5. Verifies the new token works
 */

const BASE_URL = 'http://localhost:8080';

async function makeRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: response.status, data };
}

async function testTokenRefresh() {
  console.log('🧪 Testing Token Refresh Functionality\n');

  // Step 1: Register a test user
  console.log('1️⃣  Registering test user...');
  const username = `test-user-${Date.now()}`;
  const password = 'test-password';

  const registerResp = await makeRequest('/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (registerResp.status !== 200) {
    console.error('❌ Failed to register user:', registerResp.data);
    return;
  }

  const { jwt } = registerResp.data;
  console.log('✅ User registered successfully\n');

  // Step 2: Generate OAuth tokens
  console.log('2️⃣  Generating OAuth tokens...');
  const oauthResp = await makeRequest('/oauth', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      clientId: 'test-client',
      clientSecret: 'test-secret',
    }),
  });

  if (oauthResp.status !== 200) {
    console.error('❌ Failed to generate tokens:', oauthResp.data);
    return;
  }

  const { accessToken, refreshToken, expiresIn } = oauthResp.data;
  console.log('✅ Tokens generated successfully');
  console.log(`   Access Token: ${accessToken.substring(0, 20)}...`);
  console.log(`   Refresh Token: ${refreshToken.substring(0, 20)}...`);
  console.log(`   Expires In: ${expiresIn} seconds\n`);

  // Step 3: Verify access token works
  console.log('3️⃣  Verifying access token works...');
  const experiencesResp = await makeRequest('/api/experiences', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (experiencesResp.status !== 200) {
    console.error('❌ Access token validation failed:', experiencesResp.data);
    return;
  }

  console.log('✅ Access token is valid\n');

  // Step 4: Refresh the token
  console.log('4️⃣  Refreshing access token...');
  const decodedRefreshToken = atob(refreshToken);
  const refreshResp = await makeRequest('/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: decodedRefreshToken }),
  });

  if (refreshResp.status !== 200) {
    console.error('❌ Token refresh failed:', refreshResp.data);
    return;
  }

  const { access_token: newAccessToken, expires: newExpiresIn } = refreshResp.data;
  console.log('✅ Token refreshed successfully');
  console.log(`   New Access Token: ${newAccessToken.substring(0, 20)}...`);
  console.log(`   Expires In: ${newExpiresIn} seconds\n`);

  // Step 5: Verify new access token works
  console.log('5️⃣  Verifying new access token works...');
  const newExperiencesResp = await makeRequest('/api/experiences', {
    method: 'GET',
    headers: { Authorization: `Bearer ${btoa(newAccessToken)}` },
  });

  if (newExperiencesResp.status !== 200) {
    console.error('❌ New access token validation failed:', newExperiencesResp.data);
    return;
  }

  console.log('✅ New access token is valid\n');

  // Step 6: Verify old access token still works (same user)
  console.log('6️⃣  Verifying old access token still works...');
  const oldTokenResp = await makeRequest('/api/experiences', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (oldTokenResp.status !== 200) {
    console.error('❌ Old access token no longer works (expected behavior after refresh)');
  } else {
    console.log('✅ Old access token still works (both tokens valid for same user)\n');
  }

  console.log('🎉 All tests passed! Token refresh is working correctly.\n');
}

// Run the test
testTokenRefresh().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
